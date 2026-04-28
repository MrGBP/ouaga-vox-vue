-- Switch validation function to SECURITY INVOKER (it's a pure trigger function, no privilege escalation needed)
CREATE OR REPLACE FUNCTION public.validate_reservation_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
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

-- Lock down execute rights (trigger calls don't need EXECUTE grants)
REVOKE EXECUTE ON FUNCTION public.validate_reservation_dates() FROM PUBLIC, anon, authenticated;