CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('sapsap-booking-maintenance', '0 * * * *', $$SELECT public.expire_stale_reservations()$$);