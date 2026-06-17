
-- 1) country_configs: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated reads enabled countries" ON public.country_configs;

-- 2) notifications: explicit RESTRICTIVE deny on client INSERTs
DROP POLICY IF EXISTS "Block client notification inserts" ON public.notifications;
CREATE POLICY "Block client notification inserts"
ON public.notifications
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3) public_reservations: explicit RESTRICTIVE deny on client SELECTs
DROP POLICY IF EXISTS "Block client public_reservations selects" ON public.public_reservations;
CREATE POLICY "Block client public_reservations selects"
ON public.public_reservations
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 4) reservations: remove owner UPDATE policy (only admin + booking client can update)
DROP POLICY IF EXISTS "Property owners update property reservations" ON public.reservations;
