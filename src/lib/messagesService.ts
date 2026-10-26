import { supabase } from '@/integrations/supabase/client';

export interface MessageRow {
  id: string;
  reservation_id: string;
  sender_id: string | null;
  sender_role: 'client' | 'admin' | 'owner';
  sender_name: string;
  content: string;
  read_by_admin: boolean;
  read_by_client: boolean;
  read_by_owner?: boolean;
  created_at: string;
}

export async function listMessages(reservationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(args: {
  reservation_id: string;
  content: string;
  sender_role: 'client' | 'admin' | 'owner';
  sender_name: string;
}): Promise<MessageRow> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    reservation_id: args.reservation_id,
    sender_id: user?.id ?? null,
    sender_role: args.sender_role,
    sender_name: args.sender_name.trim() || 'Anonyme',
    content: args.content.trim(),
  };
  const { data, error } = await supabase.from('messages').insert(payload).select().single();
  if (error) throw error;
  return data as MessageRow;
}

export async function markRead(reservationId: string, by: 'admin' | 'client' | 'owner'): Promise<void> {
  void by;
  const { error } = await supabase.rpc('mark_conversation_read', { _reservation_id: reservationId });
  if (error) throw error;
}

export function subscribeMessages(
  reservationId: string,
  onInsert: (row: MessageRow) => void,
  onUpdate?: (row: MessageRow) => void,
): () => void {
  const channel = supabase
    .channel(`messages-${reservationId}-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `reservation_id=eq.${reservationId}` },
      (payload) => onInsert(payload.new as MessageRow)
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `reservation_id=eq.${reservationId}` }, payload => onUpdate?.(payload.new as MessageRow))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
