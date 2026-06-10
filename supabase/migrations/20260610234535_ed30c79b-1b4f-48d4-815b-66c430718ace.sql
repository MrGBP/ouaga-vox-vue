
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'BF',
  ADD COLUMN IF NOT EXISTS city text;

-- Backfill from locations when possible
UPDATE public.properties p
SET country_code = COALESCE(l.country_code, p.country_code),
    city = COALESCE(l.city, p.city)
FROM public.locations l
WHERE l.quartier = p.quartier;

UPDATE public.properties
SET city = COALESCE(city, 'Ouagadougou')
WHERE city IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_country ON public.properties (country_code);
