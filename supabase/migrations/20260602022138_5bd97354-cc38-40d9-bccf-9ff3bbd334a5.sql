-- Enable Realtime Authorization: restrict who can subscribe to each channel topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Owner notification channels: owner-notif-{userId}
CREATE POLICY "Users subscribe to own owner-notif topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('owner-notif-' || auth.uid()::text)
);

-- Per-reservation message channels: messages-{reservationId}
-- Only the reservation client or the property owner can subscribe
CREATE POLICY "Reservation participants subscribe to messages topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'messages-%'
  AND EXISTS (
    SELECT 1
    FROM public.reservations r
    LEFT JOIN public.properties p ON p.id = r.property_id
    WHERE r.id::text = substring(realtime.topic() from 10)
      AND (r.user_id = auth.uid() OR p.owner_id = auth.uid())
  )
);

-- Admin-only channels
CREATE POLICY "Admins subscribe to admin channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IN ('reservations-live', 'admin-users-live', 'admin-notif')
  AND private.has_role(auth.uid(), 'admin'::public.app_role)
);