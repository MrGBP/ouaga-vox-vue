
-- Supprimer la contrainte de type sur pois pour autoriser tous les types
ALTER TABLE public.pois DROP CONSTRAINT IF EXISTS pois_type_check;

-- Ajouter une contrainte plus large
ALTER TABLE public.pois ADD CONSTRAINT pois_type_check 
CHECK (type IN ('ecole', 'marche', 'hopital', 'maquis', 'banque', 'transport', 'restaurant', 'gym', 'parc', 'universite', 'autre'));
