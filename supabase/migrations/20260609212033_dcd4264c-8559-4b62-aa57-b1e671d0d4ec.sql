
-- Étendre l'enum admin_status pour autoriser 'paused'
ALTER TYPE public.property_admin_status ADD VALUE IF NOT EXISTS 'paused';

-- pg_trgm pour recherche floue quartiers
CREATE EXTENSION IF NOT EXISTS pg_trgm;
