CREATE TABLE public.country_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_emoji text NOT NULL DEFAULT '🏳️',
  currency text NOT NULL DEFAULT 'XOF',
  currency_symbol text NOT NULL DEFAULT 'FCFA',
  language text NOT NULL DEFAULT 'fr',
  support_email text,
  support_whatsapp text,
  commission_rate numeric NOT NULL DEFAULT 6 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.country_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.country_configs TO authenticated;
GRANT ALL ON public.country_configs TO service_role;

ALTER TABLE public.country_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads enabled countries"
  ON public.country_configs FOR SELECT
  USING (true);

CREATE POLICY "Admins manage countries"
  ON public.country_configs FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER country_configs_updated_at
  BEFORE UPDATE ON public.country_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.country_configs (code, name, flag_emoji, currency, currency_symbol, language, support_email, support_whatsapp, commission_rate, enabled) VALUES
  ('BF', 'Burkina Faso', '🇧🇫', 'XOF', 'FCFA', 'fr', 'contact@sapsaphouse.com', '+22657976660', 6, true),
  ('ML', 'Mali', '🇲🇱', 'XOF', 'FCFA', 'fr', 'mali@sapsaphouse.com', '+22377018912', 6, true),
  ('GH', 'Ghana', '🇬🇭', 'GHS', '₵', 'en', 'ghana@sapsaphouse.com', NULL, 6, false);