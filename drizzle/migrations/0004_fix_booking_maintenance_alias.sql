CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n int := 0; rec record; _title text;
BEGIN
  UPDATE public.payments pay SET status='cancelled', updated_at=now()
    FROM public.public_reservations res
    WHERE pay.reservation_id = res.id AND pay.status IN ('initiated','awaiting_confirmation','otp_incorrect')
      AND res.status='awaiting_payment' AND res.hold_expires_at IS NOT NULL AND res.hold_expires_at <= now();
  UPDATE public.public_reservations SET status='expired', updated_at=now()
    WHERE status='awaiting_payment' AND hold_expires_at IS NOT NULL AND hold_expires_at <= now();
  GET DIAGNOSTICS _n = ROW_COUNT;
  FOR rec IN SELECT * FROM public.public_reservations WHERE status='paid_awaiting_owner' AND owner_respond_by < now() AND owner_reminder_at IS NULL LOOP
    UPDATE public.public_reservations SET owner_reminder_at = now() WHERE id = rec.id;
    SELECT title INTO _title FROM public.properties WHERE id::text = rec.property_id;
    PERFORM public.emit_notification((SELECT owner_id FROM public.properties WHERE id::text = rec.property_id), 'reservations', 'owner_urgent_confirmation',
      'Confirmation urgente · ' || rec.confirmation_number, COALESCE(_title,'Logement') || ' : le client attend votre réponse.', 'urgent',
      'reservation', rec.id::text, '/proprietaire/reservations', jsonb_build_object('reservation_id', rec.id), ARRAY['whatsapp','sms']);
    PERFORM public.notify_admins('reservations', 'admin_owner_overdue', 'Propriétaire sans réponse · ' || rec.confirmation_number,
      COALESCE(_title,'Logement') || ' : délai de confirmation dépassé.', 'high', 'reservation', rec.id::text, '/admin/sejours');
  END LOOP;
  FOR rec IN SELECT * FROM public.public_reservations WHERE status='confirmed' AND check_in = current_date + 1 AND arrival_reminder_at IS NULL LOOP
    UPDATE public.public_reservations SET arrival_reminder_at = now() WHERE id = rec.id;
    PERFORM public.emit_notification(rec.user_id, 'reservations', 'arrival_reminder', 'Votre arrivée, c''est demain',
      rec.property_title || ' · arrivée le ' || to_char(rec.check_in,'DD/MM') || '. Pensez à votre pièce d''identité ; les informations pratiques sont dans vos messages.',
      'normal', 'reservation', rec.id::text, '/mon-compte', jsonb_build_object('reservation_id', rec.id));
  END LOOP;
  RETURN _n;
END $$;