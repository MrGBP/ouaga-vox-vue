GRANT EXECUTE ON FUNCTION public.is_property_owner(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_reserved_dates(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_country_support(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated, service_role;