-- Tighten storage SELECT (no broad listing)
DROP POLICY IF EXISTS "Public can read property media" ON storage.objects;
CREATE POLICY "Public can read property media files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-media');

-- Revoke EXECUTE on SECURITY DEFINER funcs from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;