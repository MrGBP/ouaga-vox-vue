-- Permettre à un user de s'auto-attribuer le rôle 'owner' (et SEULEMENT ce rôle)
CREATE POLICY "Users can self-assign owner role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND role = 'owner'::app_role
);

-- Permettre à un user de retirer son propre rôle 'owner'
CREATE POLICY "Users can remove own owner role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() AND role = 'owner'::app_role
);