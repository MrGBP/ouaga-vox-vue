
-- 1) country_configs: restrict anon to non-sensitive columns
REVOKE SELECT ON public.country_configs FROM anon;
GRANT SELECT (id, code, name, flag_emoji, currency, currency_symbol, language, commission_rate, enabled, created_at, updated_at)
  ON public.country_configs TO anon;

-- 2) profiles: only self or admin can SELECT
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;
CREATE POLICY "Users view own profile or admin views all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Realtime: scope notifications channel to owner
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_notifications_own_topic') THEN
    DROP POLICY "auth_notifications_own_topic" ON realtime.messages;
  END IF;
END $$;

CREATE POLICY "auth_notifications_own_topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'notifications-' || auth.uid()::text
  );
