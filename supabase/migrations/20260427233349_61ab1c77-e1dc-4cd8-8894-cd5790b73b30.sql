-- ─── ENUMS ────────────────────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.property_admin_status AS ENUM ('pending', 'reviewing', 'corrections', 'published', 'rented', 'inactive', 'rejected');
CREATE TYPE public.media_kind AS ENUM ('image', 'video', 'video_360');

-- ─── PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── USER ROLES ───────────────────────────────────────────────────────────
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── AUTO PROFILE ON SIGNUP ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── PROPERTIES ENRICHMENT ────────────────────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_status public.property_admin_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS year_built INTEGER,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_phone TEXT,
  ADD COLUMN IF NOT EXISTS agent_photo TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_properties_admin_status ON public.properties(admin_status);
CREATE INDEX IF NOT EXISTS idx_properties_quartier ON public.properties(quartier);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);

-- Replace old open SELECT policy with one that hides non-published unless admin/owner
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
CREATE POLICY "Public sees published properties" ON public.properties
  FOR SELECT USING (admin_status = 'published' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all properties" ON public.properties
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert their property" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update their pending property" ON public.properties
  FOR UPDATE USING (auth.uid() = owner_id);

-- ─── PROPERTY MEDIA ───────────────────────────────────────────────────────
CREATE TABLE public.property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  storage_path TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_media_property ON public.property_media(property_id);

CREATE POLICY "Public can view media of published properties" ON public.property_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
      AND (p.admin_status = 'published' OR auth.uid() = p.owner_id OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Admins manage all media" ON public.property_media
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners manage own property media" ON public.property_media
  FOR ALL USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));

-- ─── POIs ENRICHMENT ──────────────────────────────────────────────────────
ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS distance_m INTEGER;

CREATE POLICY "Admins manage POIs" ON public.pois
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── STORAGE BUCKET ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media', 'property-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read property media" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');
CREATE POLICY "Admins can upload property media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update property media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property media" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));