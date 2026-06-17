CREATE OR REPLACE FUNCTION public.notify_owner_on_new_public_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
  _title text;
  _pid uuid;
BEGIN
  BEGIN
    _pid := NEW.property_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  SELECT owner_id, title INTO _owner, _title
  FROM public.properties
  WHERE id = _pid;

  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, data)
    VALUES (
      _owner,
      'new_reservation',
      'Nouvelle demande de réservation',
      COALESCE(NEW.user_name,'Un client')
        || ' souhaite réserver « '
        || COALESCE(_title, NEW.property_title, 'votre bien')
        || ' » du ' || NEW.check_in::text
        || ' au ' || NEW.check_out::text
        || ' (' || NEW.nights || ' nuit' || CASE WHEN NEW.nights > 1 THEN 's' ELSE '' END || ').',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'property_id', _pid,
        'confirmation_number', NEW.confirmation_number,
        'check_in', NEW.check_in,
        'check_out', NEW.check_out,
        'nights', NEW.nights,
        'total_price', NEW.total_price,
        'guest_name', NEW.user_name,
        'guest_phone', NEW.user_phone,
        'guest_email', NEW.user_email
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_owner_public_reservation ON public.public_reservations;
CREATE TRIGGER notify_owner_public_reservation
AFTER INSERT ON public.public_reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_new_public_reservation();