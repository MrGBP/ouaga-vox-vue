ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmation_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS reservations_confirmation_number_key
  ON public.reservations(confirmation_number)
  WHERE confirmation_number IS NOT NULL;

DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "reservation_insert" ON public.reservations;
DROP POLICY IF EXISTS "authenticated_can_reserve" ON public.reservations;

CREATE POLICY "authenticated_can_reserve"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());