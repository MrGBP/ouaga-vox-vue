-- POIs: only generic POIs or POIs of published, non-rented properties
DROP POLICY IF EXISTS "Anyone can view POIs" ON public.pois;
CREATE POLICY "Public views POIs of visible properties" ON public.pois
FOR SELECT TO anon, authenticated
USING (
  property_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = pois.property_id
      AND p.admin_status = 'published'::property_admin_status
      AND COALESCE(p.status, '') <> 'rented'
  )
);

-- Quartiers: no client reads; restrict to admins
DROP POLICY IF EXISTS "Anyone can view quartiers" ON public.quartiers;
CREATE POLICY "Admins view quartiers" ON public.quartiers
FOR SELECT TO authenticated
USING (public.is_any_admin(auth.uid()));

-- Calendar rules: owners/admins only (public quotes go through server functions)
DROP POLICY IF EXISTS "Anyone reads calendar rules" ON public.property_calendar_rules;
CREATE POLICY "Owners and admins read calendar rules" ON public.property_calendar_rules
FOR SELECT TO authenticated
USING (public.is_property_owner(auth.uid(), property_id) OR public.is_any_admin(auth.uid()));

-- Price rules: owners/admins only
DROP POLICY IF EXISTS "Anyone reads price rules" ON public.property_price_rules;
CREATE POLICY "Owners and admins read price rules" ON public.property_price_rules
FOR SELECT TO authenticated
USING (public.is_property_owner(auth.uid(), property_id) OR public.is_any_admin(auth.uid()));

-- Platform settings: admins read all; signed-in users read only whitelisted public keys
DROP POLICY IF EXISTS "Anyone reads settings" ON public.platform_settings;
CREATE POLICY "Admins read all settings" ON public.platform_settings
FOR SELECT TO authenticated
USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Signed-in users read public settings" ON public.platform_settings
FOR SELECT TO authenticated
USING (key IN ('booking_hold_minutes', 'owner_response_hours', 'payment_operators', 'payment_demo_otp'));