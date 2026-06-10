
-- 1) country_configs: restrict anon SELECT, expose safe listing via RPC
DROP POLICY IF EXISTS "Public reads enabled countries" ON public.country_configs;

CREATE POLICY "Authenticated reads enabled countries"
ON public.country_configs FOR SELECT
TO authenticated
USING (enabled = true);

CREATE OR REPLACE FUNCTION public.list_country_configs_public()
RETURNS TABLE(
  id uuid, code text, name text, flag_emoji text,
  currency text, currency_symbol text, language text,
  commission_rate numeric, enabled boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, code, name, flag_emoji, currency, currency_symbol, language, commission_rate, enabled
  FROM public.country_configs
  WHERE enabled = true
  ORDER BY name
$$;

REVOKE ALL ON FUNCTION public.list_country_configs_public() FROM public;
GRANT EXECUTE ON FUNCTION public.list_country_configs_public() TO anon, authenticated;

-- 2) notifications: remove user INSERT capability
DROP POLICY IF EXISTS "Users can create notifications for themselves" ON public.notifications;
REVOKE INSERT ON public.notifications FROM authenticated, anon;

-- 3) reservations: prevent owners from modifying admin-only fields
CREATE OR REPLACE FUNCTION public.guard_reservations_owner_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Admins and service_role can change anything
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- The booking client (user_id = auth.uid) is also allowed to modify their own row freely
  -- (existing "Users update own reservations" policy). Only restrict when the updater is the
  -- property owner but NOT the booking user.
  IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
    NEW.status        := OLD.status;
    NEW.admin_notes   := OLD.admin_notes;
    NEW.total_price   := OLD.total_price;
    NEW.payment_status:= OLD.payment_status;
    NEW.deposit_amount:= OLD.deposit_amount;
    NEW.user_id       := OLD.user_id;
    NEW.property_id   := OLD.property_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_reservations_owner_update ON public.reservations;
CREATE TRIGGER trg_guard_reservations_owner_update
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.guard_reservations_owner_update();
