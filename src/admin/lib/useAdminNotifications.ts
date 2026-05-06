import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminNotifications {
  pendingProperties: number;
  pendingReservations: number;
  unreadMessages: number;
  total: number;
}

export function useAdminNotifications(enabled: boolean) {
  const [data, setData] = useState<AdminNotifications>({
    pendingProperties: 0,
    pendingReservations: 0,
    unreadMessages: 0,
    total: 0,
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const [props, res, msgs] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('admin_status', 'pending'),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .in('sender_role', ['client', 'owner']).eq('read_by_admin', false),
      ]);
      const pendingProperties = props.count ?? 0;
      const pendingReservations = res.count ?? 0;
      const unreadMessages = msgs.count ?? 0;
      setData({
        pendingProperties,
        pendingReservations,
        unreadMessages,
        total: pendingProperties + pendingReservations + unreadMessages,
      });
    } catch {
      // silent
    }
  }, [enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel('admin-notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [enabled, refresh]);

  return { ...data, refresh };
}
