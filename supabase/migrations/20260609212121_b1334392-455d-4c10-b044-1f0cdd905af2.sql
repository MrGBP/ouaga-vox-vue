
-- 1) RPC dashboard admin
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_properties',     (SELECT count(*) FROM public.properties),
    'published',            (SELECT count(*) FROM public.properties WHERE admin_status='published'),
    'pending',              (SELECT count(*) FROM public.properties WHERE admin_status='pending'),
    'paused',               (SELECT count(*) FROM public.properties WHERE admin_status='paused'),
    'total_reservations',   (SELECT count(*) FROM public.reservations),
    'pending_reservations', (SELECT count(*) FROM public.reservations WHERE status='pending'),
    'confirmed_this_month', (SELECT count(*) FROM public.reservations
                              WHERE status='confirmed'
                                AND created_at >= date_trunc('month', now())),
    'total_users',          (SELECT count(*) FROM public.profiles),
    'new_users_this_week',  (SELECT count(*) FROM public.profiles
                              WHERE created_at >= now() - interval '7 days')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- 2) blocked_dates
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  reason text CHECK (reason IN ('personal','maintenance','external_booking','renovation','unavailable')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (date_to >= date_from)
);
GRANT SELECT ON public.blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;
GRANT ALL ON public.blocked_dates TO service_role;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages own blocks"
  ON public.blocked_dates FOR ALL
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads blocks for availability"
  ON public.blocked_dates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS blocked_dates_property_idx ON public.blocked_dates(property_id, date_from, date_to);

DROP TRIGGER IF EXISTS trg_blocked_dates_updated_at ON public.blocked_dates;
CREATE TRIGGER trg_blocked_dates_updated_at
BEFORE UPDATE ON public.blocked_dates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3) notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user updates own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user deletes own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "system inserts notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- 4) Triggers de notifications
CREATE OR REPLACE FUNCTION public.notify_owner_on_new_reservation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _title text;
BEGIN
  SELECT owner_id, title INTO _owner, _title FROM public.properties WHERE id = NEW.property_id;
  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, data)
    VALUES (_owner, 'new_reservation', 'Nouvelle demande de réservation',
            'Un client a demandé à réserver « ' || COALESCE(_title,'votre bien') || ' ».',
            jsonb_build_object('reservation_id', NEW.id, 'property_id', NEW.property_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_reservation ON public.reservations;
CREATE TRIGGER trg_notify_new_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_new_reservation();

CREATE OR REPLACE FUNCTION public.notify_owner_on_admin_status_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.admin_status IS DISTINCT FROM OLD.admin_status AND NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, data)
    VALUES (
      NEW.owner_id,
      CASE NEW.admin_status::text
        WHEN 'published' THEN 'property_published'
        WHEN 'corrections' THEN 'property_correction'
        WHEN 'rejected' THEN 'property_rejected'
        ELSE 'property_status_change'
      END,
      CASE NEW.admin_status::text
        WHEN 'published' THEN 'Votre bien est en ligne 🎉'
        WHEN 'corrections' THEN 'Corrections demandées'
        WHEN 'rejected' THEN 'Bien refusé'
        WHEN 'paused' THEN 'Bien mis en pause'
        ELSE 'Statut mis à jour'
      END,
      'Bien « ' || COALESCE(NEW.title,'') || ' » : ' || NEW.admin_status::text,
      jsonb_build_object('property_id', NEW.id, 'status', NEW.admin_status::text)
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_status_change ON public.properties;
CREATE TRIGGER trg_notify_status_change
AFTER UPDATE OF admin_status ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_admin_status_change();

-- 5) locations
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  city text NOT NULL,
  quartier text NOT NULL,
  commune text,
  arrondissement integer,
  lat double precision,
  lng double precision,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, city, quartier)
);
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active locations"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin manages locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS locations_city_idx ON public.locations(country_code, city, active);
CREATE INDEX IF NOT EXISTS locations_quartier_trgm ON public.locations USING gin (quartier gin_trgm_ops);

-- Seed Ouagadougou
INSERT INTO public.locations (country_code, country_name, city, quartier, arrondissement, active) VALUES
  ('BF','Burkina Faso','Ouagadougou','Koulouba',1,true),
  ('BF','Burkina Faso','Ouagadougou','Kamsaonghin',1,true),
  ('BF','Burkina Faso','Ouagadougou','Gounghin',2,true),
  ('BF','Burkina Faso','Ouagadougou','Paspanga',2,true),
  ('BF','Burkina Faso','Ouagadougou','Dapoya',3,true),
  ('BF','Burkina Faso','Ouagadougou','Hamdalaye',3,true),
  ('BF','Burkina Faso','Ouagadougou','Cissin',4,true),
  ('BF','Burkina Faso','Ouagadougou','Pissy',4,true),
  ('BF','Burkina Faso','Ouagadougou','Karpala',5,true),
  ('BF','Burkina Faso','Ouagadougou','Wemtenga',5,true),
  ('BF','Burkina Faso','Ouagadougou','Zogona',6,true),
  ('BF','Burkina Faso','Ouagadougou','Patte d''Oie',6,true),
  ('BF','Burkina Faso','Ouagadougou','Ouaga 2000',6,true),
  ('BF','Burkina Faso','Ouagadougou','Tampouy',7,true),
  ('BF','Burkina Faso','Ouagadougou','Nioko',7,true),
  ('BF','Burkina Faso','Ouagadougou','Dassasgho',8,true),
  ('BF','Burkina Faso','Ouagadougou','Pissy Nord',9,true),
  ('BF','Burkina Faso','Ouagadougou','Bissighin',10,true),
  ('BF','Burkina Faso','Ouagadougou','Tanghin',11,true),
  ('BF','Burkina Faso','Ouagadougou','Saaba',12,true)
ON CONFLICT (country_code, city, quartier) DO NOTHING;

INSERT INTO public.locations (country_code, country_name, city, quartier, commune, active) VALUES
  ('ML','Mali','Bamako','Bamako Coura','Commune III',true),
  ('ML','Mali','Bamako','Niarela','Commune II',true),
  ('ML','Mali','Bamako','Hamdallaye','Commune IV',true),
  ('ML','Mali','Bamako','Badalabougou','Commune V',true),
  ('ML','Mali','Bamako','Sogoniko','Commune VI',true),
  ('ML','Mali','Bamako','Djelibougou','Commune I',true)
ON CONFLICT (country_code, city, quartier) DO NOTHING;

INSERT INTO public.locations (country_code, country_name, city, quartier, active) VALUES
  ('GH','Ghana','Accra','Osu',false)
ON CONFLICT (country_code, city, quartier) DO NOTHING;
