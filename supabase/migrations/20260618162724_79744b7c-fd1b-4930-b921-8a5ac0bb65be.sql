-- Defensive RESTRICTIVE policy: non-admin sessions can never SELECT country_configs directly.
-- Public/anon access remains via SECURITY DEFINER RPCs (list_country_configs_public, get_country_support).
DROP POLICY IF EXISTS "Restrict country_configs direct reads to admins" ON public.country_configs;

CREATE POLICY "Restrict country_configs direct reads to admins"
ON public.country_configs
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'admin_readonly'::public.app_role)
);