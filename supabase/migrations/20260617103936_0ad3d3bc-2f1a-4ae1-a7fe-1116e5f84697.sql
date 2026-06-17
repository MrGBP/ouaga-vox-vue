
-- 1) Lock down sensitive contact columns on country_configs so direct table SELECT cannot leak them.
REVOKE SELECT (support_email, support_whatsapp) ON public.country_configs FROM anon, authenticated;
-- Admins (service_role) keep full access; the get_country_support() SECURITY DEFINER RPC still returns these for authenticated users.

-- 2) Ensure the column-guard trigger that prevents property owners from editing privileged reservation fields is attached.
DROP TRIGGER IF EXISTS guard_reservations_owner_update ON public.reservations;
CREATE TRIGGER guard_reservations_owner_update
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservations_owner_update();
