
CREATE TABLE public.public_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  confirmation_number TEXT UNIQUE NOT NULL DEFAULT ('SSH-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  property_id TEXT NOT NULL,
  property_title TEXT NOT NULL,
  property_quartier TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  message TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  price_per_night INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.public_reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_reservations TO authenticated;
GRANT ALL ON public.public_reservations TO service_role;

ALTER TABLE public.public_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reservation dates" ON public.public_reservations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reservation" ON public.public_reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins manage public reservations" ON public.public_reservations
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_public_reservations_property ON public.public_reservations(property_id, status);
