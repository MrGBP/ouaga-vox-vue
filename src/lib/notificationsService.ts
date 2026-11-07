import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read: boolean;
  created_at: string;
  category?: string;
  priority?: string;
  channel?: string;
  delivery_status?: string;
  read_at?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  link?: string | null;
}

export const NOTIFICATION_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'reservations', label: 'Réservations' },
  { value: 'payments', label: 'Paiements' },
  { value: 'properties', label: 'Propriétés' },
  { value: 'owners', label: 'Propriétaires' },
  { value: 'clients', label: 'Clients' },
  { value: 'admin', label: 'Administration' },
  { value: 'system', label: 'Alertes système' },
];

export const NOTIFICATION_PRIORITY_LABEL: Record<string, string> = { low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente' };

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  created: 'Créée', pending: 'En attente', sent: 'Envoyée', delivered: 'Livrée', read: 'Lue', failed: 'Échec', retry_needed: 'Nouvelle tentative nécessaire',
};

export async function fetchNotifications(userId: string, limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId: string) {
  const { error } = await (supabase as any).rpc('mark_all_notifications_read');
  if (error) {
    const { error: e2 } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    if (e2) throw e2;
  }
}

export async function fetchNotificationDeliveries(ids: string[]) {
  if (ids.length === 0) return [] as Array<{ notification_id: string; channel: string; status: string; simulated: boolean; detail: string | null }>;
  const { data } = await (supabase as any).from('notification_deliveries').select('notification_id,channel,status,simulated,detail').in('notification_id', ids);
  return (data ?? []) as Array<{ notification_id: string; channel: string; status: string; simulated: boolean; detail: string | null }>;
}

export function subscribeToNotifications(
  userId: string,
  onInsert: (n: AppNotification) => void,
  onUpdate?: (n: AppNotification) => void,
) {
  const channel = supabase
    .channel(`notif-${userId}-${crypto.randomUUID()}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as AppNotification)
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onUpdate?.(payload.new as AppNotification)
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
