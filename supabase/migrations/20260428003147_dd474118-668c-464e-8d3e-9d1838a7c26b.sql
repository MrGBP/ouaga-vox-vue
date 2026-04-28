CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage roles"
ON public.user_roles
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public sees published properties" ON public.properties;
DROP POLICY IF EXISTS "Admins manage all properties" ON public.properties;
CREATE POLICY "Public sees published properties"
ON public.properties
FOR SELECT
USING (
  admin_status = 'published'::property_admin_status
  OR auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'admin'::public.app_role)
);
CREATE POLICY "Admins manage all properties"
ON public.properties
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can view media of published properties" ON public.property_media;
DROP POLICY IF EXISTS "Admins manage all media" ON public.property_media;
CREATE POLICY "Public can view media of published properties"
ON public.property_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_media.property_id
      AND (
        p.admin_status = 'published'::property_admin_status
        OR auth.uid() = p.owner_id
        OR private.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);
CREATE POLICY "Admins manage all media"
ON public.property_media
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage POIs" ON public.pois;
CREATE POLICY "Admins manage POIs"
ON public.pois
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update property media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property media" ON storage.objects;
CREATE POLICY "Admins can upload property media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'property-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update property media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'property-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete property media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'property-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;