-- Permet aux propriétaires de gérer les POIs liés à leurs biens
GRANT INSERT, UPDATE, DELETE ON public.pois TO authenticated;

DROP POLICY IF EXISTS "Owners manage POIs of their properties" ON public.pois;
CREATE POLICY "Owners manage POIs of their properties"
ON public.pois
FOR ALL
TO authenticated
USING (
  property_id IS NOT NULL
  AND public.is_property_owner(auth.uid(), property_id)
)
WITH CHECK (
  property_id IS NOT NULL
  AND public.is_property_owner(auth.uid(), property_id)
);