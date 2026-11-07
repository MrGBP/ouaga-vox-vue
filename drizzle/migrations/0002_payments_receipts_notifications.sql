-- ═════════ Réservations : colonnes de suivi ═════════
ALTER TABLE public.public_reservations
  ADD COLUMN IF NOT EXISTS owner_respond_by timestamptz,
  ADD COLUMN IF NOT EXISTS owner_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrival_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS refusal_reason text;

-- ═════════ Lecture de réglages avec valeur par défaut ═════════
CREATE OR REPLACE FUNCTION public.setting_value(_key text, _default jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((SELECT value FROM public.platform_settings WHERE key=_key), _default)
$$;

CREATE OR REPLACE FUNCTION public.payment_operators()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.setting_value('payment_operators', '[
    {"code":"orange_money","name":"Orange Money","receiver":"57976660","display_name":"SapSapHouse","syntax":"TEST-OMENVOI{RECEIVER}{AMOUNT}{REF}#","enabled":true},
    {"code":"moov_money","name":"Moov Money","receiver":"50442595","display_name":"SapSapHouse","syntax":"TEST-MOOVENVOI{RECEIVER}{AMOUNT}{REF}#","enabled":true}
  ]'::jsonb)
$$;

-- ═════════ Paiements (simulation Mobile Money) ═════════
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.public_reservations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  unit_id uuid,
  user_id uuid NOT NULL,
  payer_phone text NOT NULL,
  operator text NOT NULL,
  receiver_number text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  transaction_ref text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'initiated',
  mode text NOT NULL DEFAULT 'SIMULATION',
  otp_attempts integer NOT NULL DEFAULT 0,
  authorized_at timestamptz,
  funds_received_at timestamptz,
  verified_at timestamptz,
  validated_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_operator_check CHECK (operator IN ('orange_money','moov_money')),
  CONSTRAINT payments_amount_check CHECK (amount > 0),
  CONSTRAINT payments_mode_check CHECK (mode IN ('SIMULATION','LIVE')),
  CONSTRAINT payments_status_check CHECK (status IN ('not_initiated','initiated','awaiting_confirmation','otp_incorrect','simulated_validated','simulated_failed','cancelled','simulated_refunded','awaiting_real_verification'))
);
COMMENT ON COLUMN public.payments.unit_id IS 'Unité locative : réservé pour les biens à plusieurs unités (aujourd''hui un logement = une unité)';
CREATE UNIQUE INDEX payments_one_settled_per_reservation ON public.payments(reservation_id)
  WHERE status IN ('simulated_validated','simulated_refunded','awaiting_real_verification');
CREATE UNIQUE INDEX payments_one_open_per_reservation ON public.payments(reservation_id)
  WHERE status IN ('initiated','awaiting_confirmation','otp_incorrect');
CREATE INDEX payments_user_idx ON public.payments(user_id);
CREATE INDEX payments_property_idx ON public.payments(property_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners read payments of their properties" ON public.payments FOR SELECT TO authenticated USING (public.is_property_owner(auth.uid(), property_id));
CREATE POLICY "Admins read payments" ON public.payments FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

-- ═════════ Reçus (immuables, versionnés) ═════════
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  kind text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.receipts(id),
  correction_reason text,
  reservation_id uuid NOT NULL REFERENCES public.public_reservations(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES public.payments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'SIMULATION',
  content jsonb NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid,
  CONSTRAINT receipts_kind_check CHECK (kind IN ('payment_ack','booking_confirmation')),
  CONSTRAINT receipts_version_unique UNIQUE (reservation_id, kind, version)
);
CREATE INDEX receipts_user_idx ON public.receipts(user_id);
GRANT SELECT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own receipts" ON public.receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners read receipts of their properties" ON public.receipts FOR SELECT TO authenticated USING (public.is_property_owner(auth.uid(), property_id));
CREATE POLICY "Admins read receipts" ON public.receipts FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_receipts_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Un reçu émis ne peut pas être modifié ni supprimé : émettez une nouvelle version.';
END $$;
CREATE TRIGGER trg_receipts_immutable BEFORE UPDATE OR DELETE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.guard_receipts_immutable();

-- ═════════ Notifications : enrichissement ═════════
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS link text;

UPDATE public.notifications SET
  category = CASE WHEN type ILIKE '%reservation%' THEN 'reservations'
                  WHEN type ILIKE '%message%' THEN 'clients'
                  WHEN type ILIKE '%property%' OR type ILIKE '%custom_type%' THEN 'properties'
                  ELSE 'system' END,
  delivery_status = CASE WHEN read THEN 'read' ELSE 'sent' END,
  read_at = CASE WHEN read THEN created_at END,
  link = CASE WHEN type ILIKE '%reservation%' THEN '/proprietaire/reservations'
              WHEN type ILIKE '%property%' THEN '/proprietaire/biens' END;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_category_check CHECK (category IN ('reservations','payments','properties','owners','clients','admin','system')),
  ADD CONSTRAINT notifications_priority_check CHECK (priority IN ('low','normal','high','urgent')),
  ADD CONSTRAINT notifications_channel_check CHECK (channel IN ('in_app','whatsapp','sms','email','push')),
  ADD CONSTRAINT notifications_delivery_check CHECK (delivery_status IN ('created','pending','sent','delivered','read','failed','retry_needed'));
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

-- Les utilisateurs ne peuvent changer que l'état lu/non lu
CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _read boolean := NEW.read;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW := OLD; NEW.read := _read;
  END IF;
  IF NEW.read AND NOT OLD.read THEN NEW.read_at := now(); NEW.delivery_status := 'read'; END IF;
  IF NOT NEW.read AND OLD.read THEN NEW.read_at := NULL; NEW.delivery_status := 'sent'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_notification_update ON public.notifications;
CREATE TRIGGER trg_guard_notification_update BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.guard_notification_update();

-- Suivi des canaux externes (WhatsApp, SMS, email, push) — simulés tant qu'aucun service n'est branché
CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  simulated boolean NOT NULL DEFAULT true,
  detail text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliveries_channel_check CHECK (channel IN ('whatsapp','sms','email','push')),
  CONSTRAINT deliveries_status_check CHECK (status IN ('created','pending','sent','delivered','read','failed','retry_needed'))
);
CREATE INDEX notification_deliveries_notif_idx ON public.notification_deliveries(notification_id);
GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT ALL ON public.notification_deliveries TO service_role;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read deliveries" ON public.notification_deliveries FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Users read own deliveries" ON public.notification_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = notification_id AND n.user_id = auth.uid()));

-- ═════════ Émission centralisée ═════════
CREATE OR REPLACE FUNCTION public.emit_notification(
  _user uuid, _category text, _type text, _title text, _body text,
  _priority text DEFAULT 'normal', _entity_type text DEFAULT NULL, _entity_id text DEFAULT NULL,
  _link text DEFAULT NULL, _data jsonb DEFAULT NULL, _channels text[] DEFAULT '{}')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _id uuid; _c text;
BEGIN
  IF _user IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.notifications(user_id, type, title, body, data, category, priority, channel, delivery_status, entity_type, entity_id, link)
  VALUES (_user, _type, _title, _body, _data, _category, _priority, 'in_app', 'sent', _entity_type, _entity_id, _link)
  RETURNING id INTO _id;
  FOREACH _c IN ARRAY COALESCE(_channels, '{}') LOOP
    INSERT INTO public.notification_deliveries(notification_id, channel, status, simulated, detail)
    VALUES (_id, _c, 'pending', true, 'Canal non connecté — simulation, aucun message réellement envoyé');
  END LOOP;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admins(
  _category text, _type text, _title text, _body text,
  _priority text DEFAULT 'normal', _entity_type text DEFAULT NULL, _entity_id text DEFAULT NULL,
  _link text DEFAULT NULL, _data jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _u uuid;
BEGIN
  FOR _u IN SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','admin_readonly') LOOP
    PERFORM public.emit_notification(_u, _category, _type, _title, _body, _priority, _entity_type, _entity_id, _link, _data);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.notifications SET read = true WHERE user_id = auth.uid() AND read = false
$$;

-- ═════════ Alternatives ═════════
CREATE OR REPLACE FUNCTION public.suggest_alternatives(_property_id uuid, _check_in date, _check_out date, _limit integer DEFAULT 3)
RETURNS TABLE(id uuid, title text, quartier text, city text, price numeric, image text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH ref AS (SELECT city, quartier, country_code, price FROM public.properties WHERE id = _property_id)
  SELECT p.id, p.title, p.quartier, p.city, p.price, (p.images)[1]
  FROM public.properties p, ref
  WHERE p.id <> _property_id AND p.admin_status = 'published' AND p.status IS DISTINCT FROM 'rented'
    AND p.country_code = ref.country_code
    AND public.check_availability(p.id, _check_in, _check_out)
  ORDER BY (p.quartier = ref.quartier) DESC, (p.city IS NOT DISTINCT FROM ref.city) DESC, abs(p.price - ref.price) ASC
  LIMIT GREATEST(1, LEAST(_limit, 10))
$$;

-- ═════════ Reçus : émission ═════════
CREATE OR REPLACE FUNCTION public.issue_receipt(_reservation_id uuid, _kind text, _supersedes uuid DEFAULT NULL, _reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.public_reservations; p public.payments; pr record; op jsonb; _id uuid; _ver int; _num text;
BEGIN
  SELECT * INTO r FROM public.public_reservations WHERE id = _reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;
  IF _supersedes IS NULL THEN
    SELECT id INTO _id FROM public.receipts WHERE reservation_id = _reservation_id AND kind = _kind ORDER BY version DESC LIMIT 1;
    IF FOUND THEN RETURN _id; END IF;
  END IF;
  SELECT * INTO p FROM public.payments WHERE reservation_id = _reservation_id
    AND status IN ('simulated_validated','simulated_refunded','awaiting_real_verification') ORDER BY created_at DESC LIMIT 1;
  SELECT id, title, quartier, city INTO pr FROM public.properties WHERE id::text = r.property_id;
  SELECT x INTO op FROM jsonb_array_elements(public.payment_operators()) x WHERE x->>'code' = p.operator;
  SELECT COALESCE(max(version),0)+1 INTO _ver FROM public.receipts WHERE reservation_id = _reservation_id AND kind = _kind;
  _num := CASE WHEN _kind='payment_ack' THEN 'ACK-' ELSE 'CONF-' END || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
  INSERT INTO public.receipts(receipt_number, kind, version, supersedes_id, correction_reason, reservation_id, payment_id, user_id, property_id, mode, content, issued_by)
  VALUES (_num, _kind, _ver, _supersedes, _reason, r.id, p.id, r.user_id, COALESCE(pr.id, r.property_id::uuid), COALESCE(p.mode,'SIMULATION'),
    jsonb_build_object(
      'platform','SapSapHouse',
      'status_label', CASE WHEN COALESCE(p.mode,'SIMULATION')='SIMULATION' THEN 'JUSTIFICATIF DE PAIEMENT SIMULÉ — MODE TEST' ELSE 'JUSTIFICATIF DE PAIEMENT' END,
      'document_title', CASE WHEN _kind='payment_ack' THEN 'Accusé de paiement' ELSE 'Confirmation définitive de réservation' END,
      'reservation_ref', r.confirmation_number,
      'reservation_status', r.status,
      'property_id', COALESCE(pr.id::text, r.property_id),
      'property_title', COALESCE(pr.title, r.property_title),
      'quartier', COALESCE(pr.quartier, r.property_quartier),
      'city', pr.city,
      'client_name', r.user_name,
      'client_phone', r.user_phone,
      'check_in', r.check_in, 'check_out', r.check_out, 'nights', r.nights, 'guests', r.guests_count,
      'price_detail', r.price_snapshot,
      'subtotal', COALESCE((r.price_snapshot->>'subtotal')::numeric, r.total_price),
      'discount', COALESCE((r.price_snapshot->>'discount')::numeric, 0),
      'total', r.total_price,
      'currency','FCFA',
      'operator', p.operator,
      'operator_name', op->>'name',
      'receiver_number', p.receiver_number,
      'transaction_ref', p.transaction_ref,
      'payment_status', p.status,
      'payment_validated_at', p.validated_at,
      'owner_confirmed_at', CASE WHEN _kind='booking_confirmation' THEN r.owner_decision_at END
    ), auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.reissue_receipt(_receipt_id uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old public.receipts;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF length(trim(coalesce(_reason,''))) < 3 THEN RAISE EXCEPTION 'Motif de correction requis'; END IF;
  SELECT * INTO old FROM public.receipts WHERE id = _receipt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reçu introuvable'; END IF;
  RETURN public.issue_receipt(old.reservation_id, old.kind, old.id, trim(_reason));
END $$;

-- ═════════ Paiement simulé : initiation ═════════
CREATE OR REPLACE FUNCTION public.initiate_simulated_payment(_reservation_id uuid, _operator text, _phone text)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); r public.public_reservations; op jsonb; _row public.payments; _ref text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO r FROM public.public_reservations WHERE id = _reservation_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;
  IF r.status <> 'awaiting_payment' THEN RAISE EXCEPTION 'Cette réservation n''attend pas de paiement'; END IF;
  IF r.hold_expires_at IS NULL OR r.hold_expires_at <= now() THEN RAISE EXCEPTION 'La protection de vos dates a expiré. Recommencez la réservation.'; END IF;
  IF length(regexp_replace(coalesce(_phone,''),'\D','','g')) < 8 THEN RAISE EXCEPTION 'Numéro de téléphone invalide'; END IF;
  SELECT x INTO op FROM jsonb_array_elements(public.payment_operators()) x
    WHERE x->>'code' = _operator AND COALESCE((x->>'enabled')::boolean, true);
  IF op IS NULL THEN RAISE EXCEPTION 'Opérateur indisponible'; END IF;
  UPDATE public.payments SET status='cancelled', updated_at=now()
    WHERE reservation_id = r.id AND status IN ('initiated','awaiting_confirmation','otp_incorrect');
  _ref := 'TX' || CASE WHEN _operator='orange_money' THEN 'OM' ELSE 'MV' END || upper(substr(md5(random()::text || clock_timestamp()::text),1,8));
  INSERT INTO public.payments(reservation_id, property_id, user_id, payer_phone, operator, receiver_number, amount, transaction_ref, status, mode)
  VALUES (r.id, r.property_id::uuid, _uid, trim(_phone), _operator, op->>'receiver', r.total_price, _ref, 'awaiting_confirmation', 'SIMULATION')
  RETURNING * INTO _row;
  PERFORM public.emit_notification(_uid, 'payments', 'payment_initiated', 'Paiement simulé initié',
    (op->>'name') || ' · ' || r.total_price || ' FCFA · réf. ' || _ref || ' — mode test, aucun argent réel n''est transféré.',
    'normal', 'payment', _row.id::text, '/mon-compte', jsonb_build_object('reservation_id', r.id, 'transaction_ref', _ref));
  RETURN _row;
END $$;

-- ═════════ Paiement simulé : validation OTP ═════════
CREATE OR REPLACE FUNCTION public.confirm_simulated_payment(_payment_id uuid, _otp text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); p public.payments; r public.public_reservations; _expected text; _receipt uuid; _hours int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO p FROM public.payments WHERE id = _payment_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Paiement introuvable'; END IF;
  IF p.status = 'simulated_validated' THEN
    SELECT id INTO _receipt FROM public.receipts WHERE payment_id = p.id AND kind='payment_ack' ORDER BY version DESC LIMIT 1;
    RETURN jsonb_build_object('status','already_validated','payment_id',p.id,'receipt_id',_receipt);
  END IF;
  IF p.status NOT IN ('awaiting_confirmation','otp_incorrect') THEN RAISE EXCEPTION 'Ce paiement ne peut plus être validé'; END IF;
  SELECT * INTO r FROM public.public_reservations WHERE id = p.reservation_id FOR UPDATE;
  IF r.status <> 'awaiting_payment' OR r.hold_expires_at IS NULL OR r.hold_expires_at <= now() THEN
    UPDATE public.payments SET status='simulated_failed', updated_at=now() WHERE id = p.id;
    PERFORM public.emit_notification(_uid, 'payments', 'payment_failed', 'Paiement simulé échoué',
      'La protection de vos dates a expiré avant la validation (réf. ' || p.transaction_ref || ').', 'high', 'payment', p.id::text, '/mon-compte');
    RETURN jsonb_build_object('status','expired','payment_id',p.id);
  END IF;
  _expected := public.setting_value('payment_demo_otp', '"123456"'::jsonb) #>> '{}';
  IF trim(coalesce(_otp,'')) <> _expected THEN
    UPDATE public.payments SET otp_attempts = otp_attempts + 1,
      status = CASE WHEN otp_attempts + 1 >= 3 THEN 'simulated_failed' ELSE 'otp_incorrect' END, updated_at = now()
      WHERE id = p.id RETURNING * INTO p;
    IF p.status = 'simulated_failed' THEN
      PERFORM public.emit_notification(_uid, 'payments', 'payment_failed', 'Paiement simulé échoué',
        'Trop de codes incorrects (réf. ' || p.transaction_ref || '). Vous pouvez recommencer la simulation.', 'high', 'payment', p.id::text, '/mon-compte');
    END IF;
    RETURN jsonb_build_object('status', p.status, 'payment_id', p.id, 'attempts_left', GREATEST(0, 3 - p.otp_attempts));
  END IF;
  UPDATE public.payments SET status='simulated_validated', authorized_at=now(), validated_at=now(), updated_at=now() WHERE id = p.id;
  _hours := COALESCE((public.setting_value('owner_response_hours','24'::jsonb) #>> '{}')::int, 24);
  UPDATE public.public_reservations SET status='paid_awaiting_owner', hold_expires_at=NULL,
    owner_respond_by = now() + make_interval(hours => _hours), updated_at=now() WHERE id = r.id;
  _receipt := public.issue_receipt(r.id, 'payment_ack');
  PERFORM public.emit_notification(_uid, 'payments', 'payment_validated', 'Paiement simulé validé',
    'Réf. ' || p.transaction_ref || ' · ' || p.amount || ' FCFA. Mode test : aucun argent réel n''a été reçu. Votre accusé est disponible.',
    'normal', 'receipt', _receipt::text, '/recu/' || _receipt, jsonb_build_object('reservation_id', r.id, 'receipt_id', _receipt));
  RETURN jsonb_build_object('status','validated','payment_id',p.id,'receipt_id',_receipt);
END $$;

-- ═════════ Décision du propriétaire ═════════
CREATE OR REPLACE FUNCTION public.owner_decide_reservation(_id uuid, _accept boolean, _reason text DEFAULT NULL)
RETURNS public.public_reservations LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); r public.public_reservations;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO r FROM public.public_reservations WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;
  IF NOT (public.is_property_owner(_uid, r.property_id::uuid) OR public.has_role(_uid,'admin')) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF r.status <> 'paid_awaiting_owner' THEN RAISE EXCEPTION 'Cette réservation n''attend pas de décision'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payments WHERE reservation_id = r.id AND status = 'simulated_validated') THEN
    RAISE EXCEPTION 'Aucun paiement simulé validé pour cette réservation'; END IF;
  IF _accept THEN
    UPDATE public.public_reservations SET status='confirmed', owner_decision_at=now(), updated_at=now() WHERE id = r.id RETURNING * INTO r;
    PERFORM public.issue_receipt(r.id, 'booking_confirmation');
  ELSE
    UPDATE public.payments SET status='simulated_refunded', refunded_at=now(), updated_at=now()
      WHERE reservation_id = r.id AND status='simulated_validated';
    UPDATE public.public_reservations SET status='refused', owner_decision_at=now(), refusal_reason=NULLIF(trim(coalesce(_reason,'')),''), updated_at=now()
      WHERE id = r.id RETURNING * INTO r;
  END IF;
  RETURN r;
END $$;

-- ═════════ Annulation client (rembourse la simulation si besoin) ═════════
CREATE OR REPLACE FUNCTION public.cancel_my_reservation(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.public_reservations;
BEGIN
  SELECT * INTO r FROM public.public_reservations WHERE id=_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND OR NOT (r.status IN ('awaiting_payment','pending','paid_awaiting_owner') OR (r.status='confirmed' AND r.check_in > current_date)) THEN
    RAISE EXCEPTION 'Réservation introuvable ou non annulable'; END IF;
  UPDATE public.payments SET status='cancelled', updated_at=now()
    WHERE reservation_id=_id AND status IN ('initiated','awaiting_confirmation','otp_incorrect');
  UPDATE public.payments SET status='simulated_refunded', refunded_at=now(), updated_at=now()
    WHERE reservation_id=_id AND status='simulated_validated';
  UPDATE public.public_reservations SET status='cancelled', updated_at=now() WHERE id=_id;
END $$;

-- ═════════ Notifications liées au cycle de réservation ═════════
CREATE OR REPLACE FUNCTION public.notify_public_reservation_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _owner uuid; _title text; _pid uuid; _d jsonb; _when text; _alt jsonb; _first uuid;
BEGIN
  BEGIN _pid := NEW.property_id::uuid; EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
  SELECT owner_id, title INTO _owner, _title FROM public.properties WHERE id = _pid;
  _title := COALESCE(_title, NEW.property_title, 'le logement');
  _when := to_char(NEW.check_in,'DD/MM/YYYY') || ' → ' || to_char(NEW.check_out,'DD/MM/YYYY');
  _d := jsonb_build_object('reservation_id', NEW.id, 'property_id', _pid, 'confirmation_number', NEW.confirmation_number,
    'check_in', NEW.check_in, 'check_out', NEW.check_out, 'nights', NEW.nights, 'guests', NEW.guests_count, 'total_price', NEW.total_price);

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'awaiting_payment' THEN
      PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_requested', 'Demande de réservation enregistrée',
        _title || ' · ' || _when || '. Vos dates sont protégées temporairement : finalisez le paiement simulé.', 'normal',
        'reservation', NEW.id::text, '/mon-compte', _d);
    ELSIF NEW.status = 'pending' THEN
      PERFORM public.emit_notification(_owner, 'reservations', 'new_reservation', 'Nouvelle demande de réservation',
        _title || ' · ' || _when, 'normal', 'reservation', NEW.id::text, '/proprietaire/reservations', _d);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'paid_awaiting_owner' THEN
    PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_awaiting_owner', 'Réservation en attente de confirmation',
      'Paiement simulé validé. Le propriétaire doit confirmer la disponibilité de ' || _title || ' (' || _when || ').', 'normal',
      'reservation', NEW.id::text, '/mon-compte', _d);
    PERFORM public.emit_notification(_owner, 'reservations', 'owner_confirmation_required', 'Réservation à confirmer · ' || NEW.confirmation_number,
      _title || ' · ' || _when || ' · ' || NEW.guests_count || ' pers. · réponse attendue avant le '
        || to_char(NEW.owner_respond_by AT TIME ZONE 'UTC','DD/MM HH24:MI') || ' (UTC).', 'high',
      'reservation', NEW.id::text, '/proprietaire/reservations', _d || jsonb_build_object('respond_by', NEW.owner_respond_by), ARRAY['whatsapp','sms','email']);
    PERFORM public.notify_admins('payments', 'admin_payment_validated', 'Paiement simulé validé · ' || NEW.confirmation_number,
      _title || ' · ' || NEW.total_price || ' FCFA · en attente du propriétaire.', 'normal', 'reservation', NEW.id::text, '/admin/sejours', _d);
  ELSIF NEW.status = 'confirmed' THEN
    PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_confirmed', 'Réservation confirmée 🎉',
      _title || ' · ' || _when || '. Votre confirmation définitive est disponible.', 'high', 'reservation', NEW.id::text, '/mon-compte', _d);
    PERFORM public.emit_notification(_owner, 'reservations', 'reservation_confirmed_owner', 'Réservation confirmée · ' || NEW.confirmation_number,
      _title || ' · ' || _when, 'normal', 'reservation', NEW.id::text, '/proprietaire/reservations', _d);
    PERFORM public.notify_admins('reservations', 'admin_reservation_confirmed', 'Réservation confirmée · ' || NEW.confirmation_number,
      _title || ' · ' || _when, 'low', 'reservation', NEW.id::text, '/admin/sejours', _d);
  ELSIF NEW.status = 'refused' THEN
    PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_refused', 'Réservation non confirmée',
      'Le propriétaire n''a pas pu confirmer ' || _title || ' (' || _when || '). Le paiement simulé est marqué « remboursement simulé ».', 'high',
      'reservation', NEW.id::text, '/mon-compte', _d);
    SELECT jsonb_agg(to_jsonb(a)), (array_agg(a.id))[1] INTO _alt, _first FROM public.suggest_alternatives(_pid, NEW.check_in, NEW.check_out, 3) a;
    IF _first IS NOT NULL THEN
      PERFORM public.emit_notification(NEW.user_id, 'reservations', 'alternative_suggested', 'Logements alternatifs disponibles',
        'Nous avons trouvé ' || jsonb_array_length(_alt) || ' logement(s) libre(s) aux mêmes dates.', 'normal',
        'property', _first::text, '/property/' || _first, _d || jsonb_build_object('alternatives', _alt));
    END IF;
    PERFORM public.notify_admins('reservations', 'admin_reservation_refused', 'Réservation refusée · ' || NEW.confirmation_number,
      _title || ' · ' || _when || COALESCE(' · motif : ' || NEW.refusal_reason, ''), 'normal', 'reservation', NEW.id::text, '/admin/sejours', _d);
    PERFORM public.notify_admins('payments', 'admin_refund_pending', 'Remboursement simulé à suivre · ' || NEW.confirmation_number,
      NEW.total_price || ' FCFA (simulation).', 'high', 'reservation', NEW.id::text, '/admin/sejours', _d);
  ELSIF NEW.status = 'expired' THEN
    PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_expired', 'Protection des dates expirée',
      'Sans paiement dans le délai, les dates de ' || _title || ' ont été libérées.', 'normal', 'reservation', NEW.id::text, '/mon-compte', _d);
    PERFORM public.notify_admins('reservations', 'admin_reservation_expired', 'Réservation expirée · ' || NEW.confirmation_number,
      _title || ' · ' || _when, 'low', 'reservation', NEW.id::text, '/admin/sejours', _d);
  ELSIF NEW.status = 'cancelled' THEN
    PERFORM public.emit_notification(NEW.user_id, 'reservations', 'reservation_cancelled', 'Réservation annulée',
      _title || ' · ' || _when || CASE WHEN OLD.status IN ('paid_awaiting_owner','confirmed') THEN '. Remboursement simulé enregistré.' ELSE '.' END,
      'normal', 'reservation', NEW.id::text, '/mon-compte', _d);
    IF OLD.status IN ('paid_awaiting_owner','confirmed') THEN
      PERFORM public.emit_notification(_owner, 'reservations', 'reservation_cancelled_owner', 'Réservation annulée · ' || NEW.confirmation_number,
        _title || ' · ' || _when || ' : les dates sont de nouveau libres.', 'normal', 'reservation', NEW.id::text, '/proprietaire/reservations', _d);
      PERFORM public.notify_admins('reservations', 'admin_reservation_cancelled', 'Annulation · ' || NEW.confirmation_number,
        _title || ' · ' || _when || ' · remboursement simulé à suivre.', 'normal', 'reservation', NEW.id::text, '/admin/sejours', _d);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_owner_public_reservation ON public.public_reservations;
CREATE TRIGGER trg_notify_public_reservation_change AFTER INSERT OR UPDATE OF status ON public.public_reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_public_reservation_change();

-- Indisponibilités déclarées → administration
CREATE OR REPLACE FUNCTION public.notify_blocked_dates_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _title text;
BEGIN
  SELECT title INTO _title FROM public.properties WHERE id = NEW.property_id;
  PERFORM public.notify_admins('properties', 'admin_property_unavailable', 'Logement indisponible déclaré',
    COALESCE(_title,'Logement') || ' · ' || to_char(NEW.date_from,'DD/MM') || ' → ' || to_char(NEW.date_to,'DD/MM') || COALESCE(' · ' || NEW.reason, ''),
    'low', 'property', NEW.property_id::text, '/admin/sejours', jsonb_build_object('blocked_id', NEW.id, 'owner_id', NEW.owner_id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_blocked_dates_admin ON public.blocked_dates;
CREATE TRIGGER trg_notify_blocked_dates_admin AFTER INSERT ON public.blocked_dates
  FOR EACH ROW EXECUTE FUNCTION public.notify_blocked_dates_admin();

-- ═════════ Tâches périodiques (exécutées à la demande, idempotentes) ═════════
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n int := 0; r record; _title text;
BEGIN
  UPDATE public.payments p SET status='cancelled', updated_at=now()
    FROM public.public_reservations r
    WHERE p.reservation_id = r.id AND p.status IN ('initiated','awaiting_confirmation','otp_incorrect')
      AND r.status='awaiting_payment' AND r.hold_expires_at IS NOT NULL AND r.hold_expires_at <= now();
  UPDATE public.public_reservations SET status='expired', updated_at=now()
    WHERE status='awaiting_payment' AND hold_expires_at IS NOT NULL AND hold_expires_at <= now();
  GET DIAGNOSTICS _n = ROW_COUNT;
  -- Relance propriétaire : délai de réponse dépassé
  FOR r IN SELECT * FROM public.public_reservations WHERE status='paid_awaiting_owner' AND owner_respond_by < now() AND owner_reminder_at IS NULL LOOP
    UPDATE public.public_reservations SET owner_reminder_at = now() WHERE id = r.id;
    SELECT title INTO _title FROM public.properties WHERE id::text = r.property_id;
    PERFORM public.emit_notification((SELECT owner_id FROM public.properties WHERE id::text = r.property_id), 'reservations', 'owner_urgent_confirmation',
      'Confirmation urgente · ' || r.confirmation_number, COALESCE(_title,'Logement') || ' : le client attend votre réponse.', 'urgent',
      'reservation', r.id::text, '/proprietaire/reservations', jsonb_build_object('reservation_id', r.id), ARRAY['whatsapp','sms']);
    PERFORM public.notify_admins('reservations', 'admin_owner_overdue', 'Propriétaire sans réponse · ' || r.confirmation_number,
      COALESCE(_title,'Logement') || ' : délai de confirmation dépassé.', 'high', 'reservation', r.id::text, '/admin/sejours');
  END LOOP;
  -- Rappel la veille de l'arrivée
  FOR r IN SELECT * FROM public.public_reservations WHERE status='confirmed' AND check_in = current_date + 1 AND arrival_reminder_at IS NULL LOOP
    UPDATE public.public_reservations SET arrival_reminder_at = now() WHERE id = r.id;
    PERFORM public.emit_notification(r.user_id, 'reservations', 'arrival_reminder', 'Votre arrivée, c''est demain',
      r.property_title || ' · arrivée le ' || to_char(r.check_in,'DD/MM') || '. Pensez à votre pièce d''identité ; les informations pratiques sont dans vos messages.',
      'normal', 'reservation', r.id::text, '/mon-compte', jsonb_build_object('reservation_id', r.id));
  END LOOP;
  RETURN _n;
END $$;

-- ═════════ Droits d'exécution ═════════
REVOKE EXECUTE ON FUNCTION public.emit_notification(uuid,text,text,text,text,text,text,text,text,jsonb,text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins(text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.issue_receipt(uuid,text,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setting_value(text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initiate_simulated_payment(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_simulated_payment(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owner_decide_reservation(uuid,boolean,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reissue_receipt(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_stale_reservations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initiate_simulated_payment(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_simulated_payment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_decide_reservation(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reissue_receipt(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_operators() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_alternatives(uuid,date,date,integer) TO anon, authenticated;