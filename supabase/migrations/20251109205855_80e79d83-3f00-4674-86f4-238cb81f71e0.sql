-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('maison', 'bureau', 'commerce')),
  price DECIMAL(10, 2) NOT NULL,
  quartier TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  surface_area DECIMAL(10, 2),
  comfort_rating DECIMAL(2, 1) CHECK (comfort_rating >= 0 AND comfort_rating <= 5),
  security_rating DECIMAL(2, 1) CHECK (security_rating >= 0 AND security_rating <= 5),
  images TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create POIs (Points of Interest) table
CREATE TABLE IF NOT EXISTS public.pois (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ecole', 'marche', 'hopital', 'maquis', 'banque', 'transport')),
  quartier TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quartiers table
CREATE TABLE IF NOT EXISTS public.quartiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quartiers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no auth required for browsing)
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Anyone can view POIs" ON public.pois FOR SELECT USING (true);
CREATE POLICY "Anyone can view quartiers" ON public.quartiers FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for properties
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample quartiers data
INSERT INTO public.quartiers (name, description, latitude, longitude) VALUES
  ('Ouaga 2000', 'Quartier moderne et résidentiel avec infrastructures de qualité', 12.3380, -1.4810),
  ('Karpala', 'Quartier populaire dynamique avec commerces et marchés', 12.3690, -1.5240),
  ('Gounghin', 'Quartier central animé proche du centre-ville', 12.3710, -1.5190),
  ('Cissin', 'Quartier résidentiel calme avec écoles', 12.3420, -1.5580),
  ('Somgandé', 'Quartier en développement avec bonnes routes', 12.4050, -1.4920),
  ('Dassasgho', 'Zone universitaire avec nombreux étudiants', 12.3980, -1.4580)
ON CONFLICT (name) DO NOTHING;

-- Insert sample POIs
INSERT INTO public.pois (name, type, quartier, latitude, longitude) VALUES
  ('Marché Central', 'marche', 'Gounghin', 12.3710, -1.5195),
  ('CHU Yalgado', 'hopital', 'Gounghin', 12.3680, -1.5240),
  ('Lycée Bogodogo', 'ecole', 'Cissin', 12.3450, -1.5590),
  ('Maquis Le Verdoyant', 'maquis', 'Ouaga 2000', 12.3390, -1.4820),
  ('École Française Saint-Exupéry', 'ecole', 'Ouaga 2000', 12.3410, -1.4790),
  ('Clinique Schiphra', 'hopital', 'Somgandé', 12.4060, -1.4930)
ON CONFLICT DO NOTHING;

-- Insert sample properties
INSERT INTO public.properties (title, description, type, price, quartier, address, latitude, longitude, bedrooms, bathrooms, surface_area, comfort_rating, security_rating, images, available) VALUES
  ('Villa Moderne 3 Chambres', 'Belle villa avec jardin dans quartier résidentiel calme', 'maison', 350000, 'Ouaga 2000', 'Avenue du Président Kennedy', 12.3390, -1.4825, 3, 2, 150, 4.5, 4.8, ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'], true),
  ('Bureau Équipé Centre-Ville', 'Espace bureau moderne avec climatisation et parking', 'bureau', 200000, 'Gounghin', 'Avenue Kwame N''Krumah', 12.3715, -1.5185, 0, 1, 80, 4.2, 4.5, ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'], true),
  ('Maison 4 Pièces Karpala', 'Grande maison familiale proche des commerces', 'maison', 280000, 'Karpala', 'Route de Karpala', 12.3700, -1.5250, 4, 2, 180, 4.0, 3.8, ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'], true),
  ('Commerce Bien Placé', 'Local commercial sur axe passant', 'commerce', 450000, 'Cissin', 'Boulevard Kadiogo', 12.3430, -1.5600, 0, 1, 120, 4.3, 4.0, ARRAY['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'], true)
ON CONFLICT DO NOTHING;