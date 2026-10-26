import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerNotifications {
  unreadMessages: number;
  pendingReservations: number;
  total: number;
}

export function useOwnerNotifications(userId: string | undefined) {
  const [data, setData] = useState<OwnerNotifications>({ unreadMessages: 0, pendingReservations: 0, total: 0 });

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: props } = await supabase
        .from('properties').select('id').eq('owner_id', userId);
      const ids = (props ?? []).map(p => p.id);
      if (ids.length === 0) {
        setData({ unreadMessages: 0, pendingReservations: 0, total: 0 });
        return;
      }
      const [{ data: msgCount, error: msgError }, { count: resCount, error: resError }] = await Promise.all([
        supabase.rpc('owner_unread_message_count'),
        supabase.from('reservations')
          .select('id', { count: 'exact', head: true })
          .in('property_id', ids)
          .eq('status', 'pending'),
      ]);
      if (msgError || resError) return;
      const unreadMessages = msgCount ?? 0;
      const pendingReservations = resCount ?? 0;
      setData({ unreadMessages, pendingReservations, total: unreadMessages + pendingReservations });
    } catch {
      // silent
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: rafraîchir dès qu'un message ou une réservation change
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`owner-notif-${userId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => refresh())
      .subscribe();
    const poll = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(poll); window.removeEventListener('focus', refresh); supabase.removeChannel(ch); };
  }, [userId, refresh]);

  return { ...data, refresh };
}
