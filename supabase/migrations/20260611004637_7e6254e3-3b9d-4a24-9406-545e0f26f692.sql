
CREATE OR REPLACE FUNCTION public.sync_property_images_from_media(_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties p
  SET images = COALESCE((
    SELECT array_agg(pm.url ORDER BY pm.position, pm.created_at)
    FROM public.property_media pm
    WHERE pm.property_id = _property_id
      AND pm.kind = 'image'
      AND pm.url IS NOT NULL
  ), ARRAY[]::text[])
  WHERE p.id = _property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_property_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _pid := OLD.property_id;
  ELSE
    _pid := NEW.property_id;
  END IF;
  PERFORM public.sync_property_images_from_media(_pid);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS property_media_sync_images ON public.property_media;
CREATE TRIGGER property_media_sync_images
AFTER INSERT OR UPDATE OR DELETE ON public.property_media
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_property_images();

-- Backfill every property
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT property_id FROM public.property_media WHERE kind='image' LOOP
    PERFORM public.sync_property_images_from_media(r.property_id);
  END LOOP;
END $$;
