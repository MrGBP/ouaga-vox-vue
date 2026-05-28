
-- 1. PROFILES: restrict public read (was exposing phone numbers)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- 2. PUBLIC_RESERVATIONS: remove public SELECT, expose only dates via RPC
DROP POLICY IF EXISTS "Public can view reservation dates" ON public.public_reservations;

CREATE OR REPLACE FUNCTION public.get_reserved_dates(_property_id text)
RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT check_in, check_out
  FROM public.public_reservations
  WHERE property_id = _property_id
    AND status IN ('pending','confirmed')
$$;
REVOKE ALL ON FUNCTION public.get_reserved_dates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reserved_dates(text) TO anon, authenticated;

-- Tighten INSERT (replaces WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can create reservation" ON public.public_reservations;
CREATE POLICY "Anyone can create reservation"
  ON public.public_reservations FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(user_name)) BETWEEN 1 AND 120
    AND user_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(user_email) <= 254
    AND length(trim(user_phone)) BETWEEN 4 AND 32
    AND check_out > check_in
    AND nights > 0
    AND guests_count > 0
    AND price_per_night >= 0
    AND total_price >= 0
    AND status = 'pending'
  );

-- 3. USER_ROLES: prevent self-assigning 'owner'
DROP POLICY IF EXISTS "Users can self-assign owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can remove own owner role" ON public.user_roles;

-- 4. STORAGE: allow property owners to manage their own media files
CREATE POLICY "Owners upload their property media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-media'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners delete their property media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners update their property media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.owner_id = auth.uid()
    )
  );

-- 5. SECURITY DEFINER functions: revoke direct EXECUTE from API roles.
-- RLS policies still work because they evaluate as the policy owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_property_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
