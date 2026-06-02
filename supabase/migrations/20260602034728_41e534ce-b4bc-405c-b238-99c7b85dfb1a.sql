ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_type_check CHECK (type = ANY (ARRAY[
  'maison_villa_meublee','maison_villa_simple',
  'appartement_meuble','appartement_simple',
  'studio_meuble','bureau','local_commercial',
  'maison','villa','villa_meublee','appartement','chambre_meublee','duplex','commerce'
]));