
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS last_correction_note text,
  ADD COLUMN IF NOT EXISTS last_correction_at timestamptz,
  ADD COLUMN IF NOT EXISTS correction_round integer NOT NULL DEFAULT 0;
