-- Replace the restrictive update policy with one covering both reservation-scoped and property-scoped messages.
DROP POLICY IF EXISTS "Participants update read flags" ON public.messages;

CREATE POLICY "Participants update read flags"
ON public.messages
FOR UPDATE
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = messages.reservation_id AND r.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.reservations r
    JOIN public.properties p ON p.id = r.property_id
    WHERE r.id = messages.reservation_id AND p.owner_id = auth.uid()
  )
  OR (
    messages.property_id IS NOT NULL
    AND public.is_property_owner(auth.uid(), messages.property_id)
  )
);
