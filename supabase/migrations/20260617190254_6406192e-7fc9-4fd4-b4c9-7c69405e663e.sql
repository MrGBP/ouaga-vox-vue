
-- Super admin email constant via function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) = 'nikiemaandremarie@gmail.com'
  )
$$;

-- Any admin (full or read-only)
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','admin_readonly')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_any_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_any_admin(uuid) TO authenticated, service_role;

-- Add SELECT policies for read-only admins on all admin-readable tables
CREATE POLICY "Read-only admins view blocked_dates" ON public.blocked_dates FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view country_configs" ON public.country_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view custom_property_types" ON public.custom_property_types FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view favorites" ON public.favorites FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view locations" ON public.locations FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view pois" ON public.pois FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view property_media" ON public.property_media FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view public_reservations" ON public.public_reservations FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view reservations" ON public.reservations FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view saved_searches" ON public.saved_searches FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));
CREATE POLICY "Read-only admins view user_roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin_readonly'));

-- Protect super-admin: nobody can change/insert/delete his roles
CREATE OR REPLACE FUNCTION public.guard_super_admin_roles()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _target uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _target := OLD.user_id;
  ELSE
    _target := NEW.user_id;
  END IF;

  -- Allow service_role bypass (auth.uid() is NULL for service role calls)
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only the super admin themselves may touch their own roles
  IF public.is_super_admin(_target) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Le super administrateur est protégé. Ses rôles ne peuvent pas être modifiés.';
  END IF;

  -- Block anyone (except super admin themselves) from creating another super admin
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.role = 'admin'
     AND NOT public.is_super_admin(auth.uid())
     AND NOT public.is_super_admin(NEW.user_id) THEN
    -- a normal admin CAN still create another normal admin; uncomment to lock down further
    NULL;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_super_admin_roles ON public.user_roles;
CREATE TRIGGER trg_guard_super_admin_roles
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_super_admin_roles();

-- Protect super-admin profile from being deleted/altered by other admins
CREATE OR REPLACE FUNCTION public.guard_super_admin_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF TG_OP = 'DELETE' THEN
    IF public.is_super_admin(OLD.id) AND NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Le profil du super administrateur ne peut pas être supprimé.';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND public.is_super_admin(NEW.id)
     AND auth.uid() <> NEW.id AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Le profil du super administrateur ne peut être modifié que par lui-même.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_super_admin_profile ON public.profiles;
CREATE TRIGGER trg_guard_super_admin_profile
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_super_admin_profile();

-- Update handle_new_user to auto-assign admin_readonly to Adama and admin to super-admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'),''), public.profiles.full_name),
      phone     = COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'phone'),''), public.profiles.phone),
      updated_at = now();

  IF lower(NEW.email) = 'nikiemaandremarie@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSIF lower(NEW.email) = 'adama@gandyamligdi.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin_readonly') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- If Adama already has an account, grant the role now
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'adama@gandyamligdi.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin_readonly') ON CONFLICT DO NOTHING;
  END IF;
END $$;
