-- Enums for reservation kind & status
DO $$ BEGIN
  CREATE TYPE public.reservation_kind AS ENUM ('visit', 'booking', 'rental_request');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id         UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  kind            public.reservation_kind NOT NULL DEFAULT 'visit',
  status          public.reservation_status NOT NULL DEFAULT 'pending',

  -- Stay-related (booking) or rental-request period
  start_date      DATE NULL,
  end_date        DATE NULL,
  -- Visit-specific
  visit_at        TIMESTAMPTZ NULL,

  guests_count    INTEGER NOT NULL DEFAULT 1,
  total_price     NUMERIC(12, 2) NULL,

  -- Guest contact (always required so we can reach back)
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT NULL,
  message         TEXT NULL,

  admin_notes     TEXT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id     ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status      ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at  ON public.reservations(created_at DESC);

-- Validation trigger (date sanity)
CREATE OR REPLACE FUNCTION public.validate_reservation_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL
     AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  IF NEW.guests_count < 1 THEN
    RAISE EXCEPTION 'guests_count must be at least 1';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_reservation_dates ON public.reservations;
CREATE TRIGGER trg_validate_reservation_dates
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_dates();

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anon) can submit a reservation request.
-- We require contact info via NOT NULL constraints, so guests are still reachable.
DROP POLICY IF EXISTS "Anyone can create a reservation" ON public.reservations;
CREATE POLICY "Anyone can create a reservation"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- If user_id is provided, it must match the caller's identity
  user_id IS NULL OR user_id = auth.uid()
);

-- Owners (the user who created it) can read their own reservations
DROP POLICY IF EXISTS "Users read own reservations" ON public.reservations;
CREATE POLICY "Users read own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Property owners can read reservations on their properties
DROP POLICY IF EXISTS "Property owners read property reservations" ON public.reservations;
CREATE POLICY "Property owners read property reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reservations.property_id
      AND p.owner_id = auth.uid()
  )
);

-- Property owners can update reservations on their properties (confirm/cancel)
DROP POLICY IF EXISTS "Property owners update property reservations" ON public.reservations;
CREATE POLICY "Property owners update property reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reservations.property_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reservations.property_id
      AND p.owner_id = auth.uid()
  )
);

-- Users can cancel their own reservation (status -> cancelled)
DROP POLICY IF EXISTS "Users update own reservations" ON public.reservations;
CREATE POLICY "Users update own reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins manage everything
DROP POLICY IF EXISTS "Admins manage all reservations" ON public.reservations;
CREATE POLICY "Admins manage all reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime so admin Kanban can stream new reservations live
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;