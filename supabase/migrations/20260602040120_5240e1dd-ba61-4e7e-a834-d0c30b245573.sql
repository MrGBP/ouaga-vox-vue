-- Audit columns for moderation (admin) and owner edits
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS owner_updated_at timestamptz;

-- Auto-refresh updated_at on every UPDATE
DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;
CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();