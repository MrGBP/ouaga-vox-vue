ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by_owner boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.sync_favorite_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.properties SET favorite_count = favorite_count + 1 WHERE id = NEW.property_id;
    RETURN NEW;
  ELSE
    UPDATE public.properties SET favorite_count = GREATEST(0, favorite_count - 1) WHERE id = OLD.property_id;
    RETURN OLD;
  END IF;
END; $$;
CREATE TRIGGER favorites_sync_count AFTER INSERT OR DELETE ON public.favorites FOR EACH ROW EXECUTE FUNCTION public.sync_favorite_count();
REVOKE ALL ON FUNCTION public.sync_favorite_count() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.increment_property_view(_property_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.properties SET view_count = view_count + 1
  WHERE id = _property_id AND admin_status = 'published'
    AND available IS DISTINCT FROM false AND status IS DISTINCT FROM 'rented'
    AND (auth.uid() IS NULL OR owner_id IS DISTINCT FROM auth.uid());
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(_reservation_id uuid DEFAULT NULL, _property_id uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _owner uuid; _client uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _reservation_id IS NOT NULL THEN
    SELECT p.owner_id, r.user_id INTO _owner, _client FROM public.reservations r JOIN public.properties p ON p.id=r.property_id WHERE r.id=_reservation_id;
  ELSIF _property_id IS NOT NULL THEN
    SELECT owner_id INTO _owner FROM public.properties WHERE id=_property_id;
  ELSE RAISE EXCEPTION 'Conversation required'; END IF;
  IF _uid IS DISTINCT FROM _owner AND _uid IS DISTINCT FROM _client AND NOT public.has_role(_uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.messages m SET
    read_by_owner = CASE WHEN _uid=_owner THEN true ELSE m.read_by_owner END,
    read_by_client = CASE WHEN _uid=_client OR (_reservation_id IS NULL AND _uid=_owner) THEN true ELSE m.read_by_client END,
    read_by_admin = CASE WHEN public.has_role(_uid,'admin') AND _uid IS DISTINCT FROM _owner AND _uid IS DISTINCT FROM _client THEN true ELSE m.read_by_admin END
  WHERE ((_reservation_id IS NOT NULL AND m.reservation_id=_reservation_id) OR (_reservation_id IS NULL AND m.property_id=_property_id AND m.reservation_id IS NULL)) AND m.sender_id IS DISTINCT FROM _uid;
  UPDATE public.notifications SET read=true WHERE user_id=_uid AND type='message' AND NOT read
    AND ((_reservation_id IS NOT NULL AND data->>'reservation_id'=_reservation_id::text) OR (_reservation_id IS NULL AND data->>'property_id'=_property_id::text));
END; $$;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_unread_message_count() RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT count(*)::integer FROM public.messages m
  LEFT JOIN public.reservations r ON r.id=m.reservation_id
  JOIN public.properties p ON p.id=COALESCE(r.property_id,m.property_id)
  WHERE p.owner_id=auth.uid() AND m.sender_id IS DISTINCT FROM auth.uid() AND NOT m.read_by_owner;
$$;
REVOKE ALL ON FUNCTION public.owner_unread_message_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_unread_message_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _owner uuid; _client uuid; _recipient uuid; _pid uuid;
BEGIN
  IF NEW.reservation_id IS NOT NULL THEN
    SELECT r.property_id,r.user_id,p.owner_id INTO _pid,_client,_owner FROM public.reservations r JOIN public.properties p ON p.id=r.property_id WHERE r.id=NEW.reservation_id;
    FOR _recipient IN SELECT DISTINCT uid FROM unnest(ARRAY[_owner,_client]) uid WHERE uid IS NOT NULL AND uid IS DISTINCT FROM NEW.sender_id LOOP
      INSERT INTO public.notifications(user_id,type,title,body,data) VALUES (_recipient,'message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',jsonb_build_object('reservation_id',NEW.reservation_id,'property_id',_pid,'message_id',NEW.id,'url','/mon-compte?tab=reservations'));
    END LOOP;
  ELSE
    SELECT owner_id INTO _owner FROM public.properties WHERE id=NEW.property_id;
    IF NEW.sender_id IS DISTINCT FROM _owner AND _owner IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,type,title,body,data) VALUES (_owner,'message','Nouveau message','Vous avez reçu un nouveau message concernant votre bien.',jsonb_build_object('property_id',NEW.property_id,'message_id',NEW.id,'url','/proprietaire/messages'));
    ELSE
      FOR _recipient IN SELECT user_id FROM public.user_roles WHERE role='admin' AND user_id IS DISTINCT FROM NEW.sender_id LOOP
        INSERT INTO public.notifications(user_id,type,title,body,data) VALUES (_recipient,'message','Nouveau message','Un propriétaire vous a envoyé un message.',jsonb_build_object('property_id',NEW.property_id,'message_id',NEW.id,'url','/admin/messages'));
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_new_message() FROM PUBLIC;
CREATE TRIGGER messages_notify_recipients AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.properties, public.favorites;
