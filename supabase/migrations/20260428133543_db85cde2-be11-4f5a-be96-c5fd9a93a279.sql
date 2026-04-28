-- ── FAVORITES ──
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage favorites" ON public.favorites
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_property ON public.favorites(property_id);

-- ── SAVED SEARCHES ──
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  alert_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own searches" ON public.saved_searches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own searches" ON public.saved_searches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own searches" ON public.saved_searches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own searches" ON public.saved_searches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage saved searches" ON public.saved_searches
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_saved_searches_updated
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id);

-- ── MESSAGES ──
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL,
  sender_id UUID,
  sender_role TEXT NOT NULL DEFAULT 'client', -- 'client' | 'admin' | 'owner'
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  read_by_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admins manage all
CREATE POLICY "Admins manage all messages" ON public.messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Reservation owner (client) reads messages of own reservation
CREATE POLICY "Reservation client reads messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = messages.reservation_id AND r.user_id = auth.uid())
  );

-- Reservation client inserts messages
CREATE POLICY "Reservation client sends messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = messages.reservation_id AND r.user_id = auth.uid())
    AND sender_id = auth.uid()
  );

-- Property owner reads/sends on their property reservations
CREATE POLICY "Property owner reads messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = messages.reservation_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owner sends messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = messages.reservation_id AND p.owner_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

-- Allow updating read flags by participants
CREATE POLICY "Participants update read flags" ON public.messages
  FOR UPDATE TO authenticated USING (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = messages.reservation_id AND r.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = messages.reservation_id AND p.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_messages_reservation ON public.messages(reservation_id, created_at);

-- ── REALTIME ──
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;