-- 1. Table des subscriptions push (un endpoint par appareil)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Trigger updated_at
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Extensions requises pour appeler l'edge function depuis un trigger
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Fonction trigger : appel HTTP asynchrone vers l'edge function send-push
--    à chaque nouvelle notification insérée
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _project_ref text := 'hrpfneoeigfqonxtjpuu';
  _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycGZuZW9laWdmcW9ueHRqcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTc1MzgsImV4cCI6MjA3ODI5MzUzOH0.AlbEE79nzC7oXVFhR_zl2TBBo-albw4j65UcfuSVVxk';
BEGIN
  PERFORM net.http_post(
    url := 'https://' || _project_ref || '.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'data', NEW.data
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block notification insert if push fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_push ON public.notifications;
CREATE TRIGGER notifications_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_send_push_notification();