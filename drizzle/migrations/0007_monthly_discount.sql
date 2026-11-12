ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS monthly_discount_pct numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_monthly_discount() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.monthly_discount_pct < 0 OR NEW.monthly_discount_pct > 50 THEN
    RAISE EXCEPTION 'La réduction mensuelle doit être comprise entre 0 et 50 %%';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_monthly_discount ON public.properties;
CREATE TRIGGER trg_validate_monthly_discount BEFORE INSERT OR UPDATE OF monthly_discount_pct ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.validate_monthly_discount();

CREATE OR REPLACE FUNCTION public.quote_stay(_property_id uuid, _check_in date, _check_out date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _base numeric; _d date; _p numeric; _rule record; _nights jsonb := '[]'::jsonb; _total numeric := 0; _full numeric := 0; _mpct numeric := 0; _mdisc numeric := 0;
BEGIN
  SELECT GREATEST(500, round((price/30)/500)*500), COALESCE(monthly_discount_pct,0) INTO _base, _mpct FROM public.properties WHERE id=_property_id;
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
  IF (_check_out - _check_in) >= 28 AND _mpct > 0 THEN
    _mdisc := round(_total * _mpct / 100);
    _total := _total - _mdisc;
  ELSE
    _mpct := 0;
  END IF;
  RETURN jsonb_build_object('base_per_night',_base,'nights',_check_out-_check_in,'subtotal',_full,'discount',_full-_total,'total',_total,'monthly_discount_pct',_mpct,'monthly_discount',_mdisc,'detail',_nights,'quoted_at',now());
END $function$;