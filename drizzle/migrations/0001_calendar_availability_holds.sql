-- Réglages plateforme (clé/valeur), lisibles publiquement pour les clés non sensibles
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins write settings" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_settings(key,value) VALUES ('booking_hold_minutes','10'::jsonb) ON CONFLICT DO NOTHING;

-- Règles de calendrier par logement
CREATE TABLE public.property_calendar_rules (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  check_in_time time NOT NULL DEFAULT '14:00',
  check_out_time time NOT NULL DEFAULT '11:00',
  cleaning_minutes integer NOT NULL DEFAULT 120,
  buffer_nights integer NOT NULL DEFAULT 0,
  same_day_turnover boolean NOT NULL DEFAULT true,
  early_late_policy text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.property_calendar_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_calendar_rules TO authenticated;
GRANT ALL ON public.property_calendar_rules TO service_role;
ALTER TABLE public.property_calendar_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads calendar rules" ON public.property_calendar_rules FOR SELECT USING (true);
CREATE POLICY "Owners manage calendar rules" ON public.property_calendar_rules FOR ALL TO authenticated
  USING (public.is_property_owner(auth.uid(), property_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(auth.uid(), property_id) OR public.has_role(auth.uid(),'admin'));

-- Tarifs spécifiques
CREATE TABLE public.property_price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'period',
  label text,
  date_from date NOT NULL,
  date_to date NOT NULL,
  price_per_night numeric,
  discount_pct numeric,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT price_rule_kind CHECK (kind IN ('day','period','promotion','exceptional','last_minute')),
  CONSTRAINT price_rule_dates CHECK (date_to >= date_from),
  CONSTRAINT price_rule_value CHECK (price_per_night IS NOT NULL OR discount_pct IS NOT NULL)
);
GRANT SELECT ON public.property_price_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_price_rules TO authenticated;
GRANT ALL ON public.property_price_rules TO service_role;
ALTER TABLE public.property_price_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads price rules" ON public.property_price_rules FOR SELECT USING (true);
CREATE POLICY "Owners manage price rules" ON public.property_price_rules FOR ALL TO authenticated
  USING (public.is_property_owner(auth.uid(), property_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_property_owner(auth.uid(), property_id) OR public.has_role(auth.uid(),'admin'));

-- Réservations : compte obligatoire, protection temporaire, photo du prix
ALTER TABLE public.public_reservations
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS owner_decision_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.public_reservations DROP CONSTRAINT IF EXISTS public_reservations_status_check;
ALTER TABLE public.public_reservations ADD CONSTRAINT public_reservations_status_check
  CHECK (status IN ('awaiting_payment','paid_awaiting_owner','pending','confirmed','refused','expired','cancelled'));
CREATE INDEX IF NOT EXISTS idx_pubres_property_dates ON public.public_reservations(property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_pubres_user ON public.public_reservations(user_id);

DROP POLICY IF EXISTS "Anyone can create reservation" ON public.public_reservations;
GRANT SELECT ON public.public_reservations TO authenticated;
CREATE POLICY "Clients read own reservations" ON public.public_reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owners read reservations of their properties" ON public.public_reservations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id::text = property_id AND p.owner_id = auth.uid()));

-- Une réservation "occupe" les dates si confirmée, en attente propriétaire, ou protection non expirée
CREATE OR REPLACE FUNCTION public.reservation_is_active(_status text, _hold timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _status IN ('confirmed','paid_awaiting_owner','pending')
      OR (_status = 'awaiting_payment' AND _hold IS NOT NULL AND _hold > now())
$$;
-- (now() n'est pas immutable : on la redéclare STABLE)
CREATE OR REPLACE FUNCTION public.reservation_is_active(_status text, _hold timestamptz)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT _status IN ('confirmed','paid_awaiting_owner','pending')
      OR (_status = 'awaiting_payment' AND _hold IS NOT NULL AND _hold > now())
$$;

-- Vérification serveur de la disponibilité (nuits [check_in, check_out[)
CREATE OR REPLACE FUNCTION public.check_availability(_property_id uuid, _check_in date, _check_out date, _ignore uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _buf int := 0; _same boolean := true;
BEGIN
  IF _check_out <= _check_in OR _check_in < current_date THEN RETURN false; END IF;
  SELECT buffer_nights, same_day_turnover INTO _buf, _same FROM public.property_calendar_rules WHERE property_id=_property_id;
  _buf := COALESCE(_buf,0) + CASE WHEN COALESCE(_same,true) THEN 0 ELSE 1 END;
  IF EXISTS (
    SELECT 1 FROM public.public_reservations r
    WHERE r.property_id = _property_id::text AND (_ignore IS NULL OR r.id <> _ignore)
      AND public.reservation_is_active(r.status, r.hold_expires_at)
      AND r.check_in < _check_out + _buf AND (r.check_out + _buf) > _check_in
  ) THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates b
    WHERE b.property_id = _property_id AND b.date_from < _check_out AND b.date_to >= _check_in
  ) THEN RETURN false; END IF;
  RETURN true;
END $$;

-- Devis serveur : tarif par nuit, règles spécifiques appliquées
CREATE OR REPLACE FUNCTION public.quote_stay(_property_id uuid, _check_in date, _check_out date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _base numeric; _d date; _p numeric; _rule record; _nights jsonb := '[]'::jsonb; _total numeric := 0; _full numeric := 0;
BEGIN
  SELECT GREATEST(500, round((price/30)/500)*500) INTO _base FROM public.properties WHERE id=_property_id;
  IF _base IS NULL THEN RAISE EXCEPTION 'Logement introuvable'; END IF;
  _d := _check_in;
  WHILE _d < _check_out LOOP
    _p := _base;
    SELECT * INTO _rule FROM public.property_price_rules
      WHERE property_id=_property_id AND _d BETWEEN date_from AND date_to
        AND (kind <> 'last_minute' OR _check_in - current_date <= 3)
      ORDER BY CASE kind WHEN 'exceptional' THEN 1 WHEN 'day' THEN 2 WHEN 'last_minute' THEN 3 WHEN 'promotion' THEN 4 ELSE 5 END, created_at DESC
      LIMIT 1;
    IF FOUND THEN
      IF _rule.price_per_night IS NOT NULL THEN _p := _rule.price_per_night; END IF;
      IF _rule.discount_pct IS NOT NULL THEN _p := round(_p * (1 - _rule.discount_pct/100)); END IF;
    END IF;
    _nights := _nights || jsonb_build_object('date',_d,'price',_p,'base',_base,'rule',CASE WHEN FOUND THEN _rule.kind END,'label',CASE WHEN FOUND THEN _rule.label END);
    _total := _total + _p; _full := _full + _base;
    _d := _d + 1;
  END LOOP;
  RETURN jsonb_build_object('base_per_night',_base,'nights',_check_out-_check_in,'subtotal',_full,'discount',_full-_total,'total',_total,'detail',_nights,'quoted_at',now());
END $$;

-- Création serveur d'une réservation temporaire (compte obligatoire, verrou anti double réservation)
CREATE OR REPLACE FUNCTION public.create_reservation_hold(_property_id uuid, _check_in date, _check_out date, _guests int, _name text, _phone text, _message text DEFAULT NULL)
RETURNS public.public_reservations LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _q jsonb; _prop record; _mins int; _row public.public_reservations; _email text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise pour réserver'; END IF;
  IF length(trim(coalesce(_name,''))) < 2 OR length(regexp_replace(coalesce(_phone,''),'\D','','g')) < 8 THEN
    RAISE EXCEPTION 'Nom et téléphone requis'; END IF;
  SELECT * INTO _prop FROM public.properties WHERE id=_property_id AND admin_status='published' AND status IS DISTINCT FROM 'rented';
  IF NOT FOUND THEN RAISE EXCEPTION 'Logement indisponible'; END IF;
  IF _prop.owner_id = _uid THEN RAISE EXCEPTION 'Vous ne pouvez pas réserver votre propre logement'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('booking:'||_property_id::text));
  IF NOT public.check_availability(_property_id, _check_in, _check_out) THEN
    RAISE EXCEPTION 'Ces dates ne sont plus disponibles'; END IF;
  _q := public.quote_stay(_property_id, _check_in, _check_out);
  SELECT COALESCE((value)::text::int,10) INTO _mins FROM public.platform_settings WHERE key='booking_hold_minutes';
  SELECT email INTO _email FROM auth.users WHERE id=_uid;
  INSERT INTO public.public_reservations(property_id, property_title, property_quartier, user_name, user_email, user_phone, message,
    check_in, check_out, nights, guests_count, price_per_night, total_price, status, user_id, hold_expires_at, price_snapshot)
  VALUES (_property_id::text, _prop.title, _prop.quartier, trim(_name), _email, trim(_phone), NULLIF(trim(coalesce(_message,'')),''),
    _check_in, _check_out, _check_out-_check_in, GREATEST(1,coalesce(_guests,1)), (_q->>'base_per_night')::numeric::int,
    (_q->>'total')::numeric::int, 'awaiting_payment', _uid, now() + make_interval(mins => COALESCE(_mins,10)), _q)
  RETURNING * INTO _row;
  RETURN _row;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_reservation_hold(uuid,date,date,int,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_reservation_hold(uuid,date,date,int,text,text,text) TO authenticated;

-- Le client peut annuler sa propre réservation temporaire
CREATE OR REPLACE FUNCTION public.cancel_my_reservation(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.public_reservations SET status='cancelled', updated_at=now()
  WHERE id=_id AND user_id=auth.uid() AND status IN ('awaiting_payment','pending','paid_awaiting_owner');
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable ou non annulable'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.cancel_my_reservation(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation(uuid) TO authenticated;

-- Occupation du calendrier sans données personnelles
CREATE OR REPLACE FUNCTION public.get_calendar_occupancy(_property_id uuid)
RETURNS TABLE(date_from date, date_to date, state text, source_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.check_in, r.check_out,
    CASE WHEN r.status='confirmed' THEN 'confirmed'
         WHEN r.status='awaiting_payment' THEN 'awaiting_payment'
         ELSE 'awaiting_owner' END, NULL::uuid
  FROM public.public_reservations r
  WHERE r.property_id=_property_id::text AND public.reservation_is_active(r.status, r.hold_expires_at) AND r.check_out >= current_date
  UNION ALL
  SELECT b.date_from, b.date_to + 1,
    CASE WHEN b.reason IN ('maintenance','renovation') THEN 'maintenance'
         WHEN b.reason='cleaning' THEN 'cleaning' ELSE 'external' END,
    CASE WHEN public.is_property_owner(auth.uid(), _property_id) OR public.is_any_admin(auth.uid()) THEN b.id END
  FROM public.blocked_dates b
  WHERE b.property_id=_property_id AND b.date_to >= current_date
$$;

-- Logements disponibles pour une période (recherche)
CREATE OR REPLACE FUNCTION public.available_property_ids(_check_in date, _check_out date)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id FROM public.properties p
  WHERE p.admin_status='published' AND p.status IS DISTINCT FROM 'rented'
    AND public.check_availability(p.id, _check_in, _check_out)
$$;

-- get_reserved_dates : inclut désormais protections et attentes
CREATE OR REPLACE FUNCTION public.get_reserved_dates(_property_id text)
RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT check_in, check_out FROM public.public_reservations
  WHERE property_id=_property_id AND public.reservation_is_active(status, hold_expires_at)
$$;

-- Un propriétaire ne peut pas bloquer par-dessus une réservation SapSapHouse active
CREATE OR REPLACE FUNCTION public.guard_blocked_dates_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.date_to < NEW.date_from THEN RAISE EXCEPTION 'Période invalide'; END IF;
  IF EXISTS (SELECT 1 FROM public.public_reservations r
             WHERE r.property_id=NEW.property_id::text AND public.reservation_is_active(r.status, r.hold_expires_at)
               AND r.check_in <= NEW.date_to AND r.check_out > NEW.date_from) THEN
    RAISE EXCEPTION 'Cette période contient une réservation SapSapHouse : elle ne peut pas être bloquée.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_blocked_dates_overlap ON public.blocked_dates;
CREATE TRIGGER trg_guard_blocked_dates_overlap BEFORE INSERT OR UPDATE ON public.blocked_dates
  FOR EACH ROW EXECUTE FUNCTION public.guard_blocked_dates_overlap();

-- Historique des actions importantes
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_public_reservations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.audit_log(actor_id,entity,entity_id,action,details) VALUES (auth.uid(),'reservation',NEW.id::text,'created',jsonb_build_object('status',NEW.status,'check_in',NEW.check_in,'check_out',NEW.check_out));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_log(actor_id,entity,entity_id,action,details) VALUES (auth.uid(),'reservation',NEW.id::text,'status_changed',jsonb_build_object('from',OLD.status,'to',NEW.status));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_audit_public_reservations AFTER INSERT OR UPDATE ON public.public_reservations
  FOR EACH ROW EXECUTE FUNCTION public.audit_public_reservations();

CREATE OR REPLACE FUNCTION public.audit_blocked_dates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log(actor_id,entity,entity_id,action,details)
  VALUES (auth.uid(),'blocked_dates',COALESCE(NEW.id,OLD.id)::text,lower(TG_OP),to_jsonb(COALESCE(NEW,OLD)));
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_audit_blocked_dates AFTER INSERT OR UPDATE OR DELETE ON public.blocked_dates
  FOR EACH ROW EXECUTE FUNCTION public.audit_blocked_dates();