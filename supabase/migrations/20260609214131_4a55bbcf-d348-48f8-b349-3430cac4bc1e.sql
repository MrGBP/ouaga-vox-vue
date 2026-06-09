
-- 1) Notifications : restreindre l'INSERT côté client à user_id = auth.uid().
--    Les triggers SECURITY DEFINER (notify_owner_on_new_reservation,
--    notify_owner_on_admin_status_change) continuent d'insérer sans contrainte.
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications insert self" ON public.notifications;
DROP POLICY IF EXISTS "insert notifications" ON public.notifications;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can create notifications for themselves"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) country_configs : retirer les contacts support à anon via grants colonnaires.
REVOKE SELECT ON public.country_configs FROM anon;
GRANT SELECT (id, code, name, flag_emoji, currency, currency_symbol, language, commission_rate, enabled, created_at, updated_at)
  ON public.country_configs TO anon;
-- Authenticated garde l'accès complet (déjà autorisé par la policy "Public reads enabled countries" qui couvre les deux rôles).
GRANT SELECT ON public.country_configs TO authenticated;

-- Fonction publique de récupération du contact support (réservée aux utilisateurs authentifiés).
CREATE OR REPLACE FUNCTION public.get_country_support(_code text)
RETURNS TABLE(support_email text, support_whatsapp text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT support_email, support_whatsapp
  FROM public.country_configs
  WHERE code = _code AND enabled = true
$$;

REVOKE ALL ON FUNCTION public.get_country_support(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_country_support(text) TO authenticated;

-- 3) Extension pg_trgm : déplacer hors du schéma public.
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
