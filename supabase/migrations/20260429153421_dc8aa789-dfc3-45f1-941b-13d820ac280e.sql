CREATE OR REPLACE FUNCTION public.increment_property_view(_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = _property_id
    AND admin_status = 'published';
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;