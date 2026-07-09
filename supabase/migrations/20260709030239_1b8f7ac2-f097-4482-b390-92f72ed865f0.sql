-- Consolidate public_reservations SELECT into a single admin-only PERMISSIVE model.
-- Drop the fragile RESTRICTIVE gate; admins already have PERMISSIVE SELECT via
-- "Admins manage public reservations" (ALL) and "Read-only admins view public_reservations".
-- With no PERMISSIVE SELECT for anon/authenticated, they remain fully denied by default.
DROP POLICY IF EXISTS "Block client public_reservations selects" ON public.public_reservations;