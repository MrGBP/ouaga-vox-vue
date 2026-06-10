CREATE OR REPLACE FUNCTION public.ensure_user_profile(_full_name text DEFAULT NULL, _phone text DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile public.profiles;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (_uid, NULLIF(trim(_full_name), ''), NULLIF(trim(_phone), ''))
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(NULLIF(trim(_full_name), ''), public.profiles.full_name),
    phone = COALESCE(NULLIF(trim(_phone), ''), public.profiles.phone),
    updated_at = now()
  RETURNING * INTO _profile;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _profile;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(text, text) TO authenticated;