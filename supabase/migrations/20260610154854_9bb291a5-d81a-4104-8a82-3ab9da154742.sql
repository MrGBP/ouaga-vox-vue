REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.activate_owner_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_owner_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.activate_owner_role() TO authenticated;