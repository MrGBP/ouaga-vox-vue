// Messages liés à un bien (canal admin <-> propriétaire), sans réservation.
// Utilise la table `messages` existante avec la colonne `property_id`.
import { supabase } from '@/integrations/supabase/client';

export interface PropertyMessageRow {
  id: string;
  property_id: string;
  sender_id: string | null;
  sender_role: 'admin' | 'owner' | 'client';
  sender_name: string;
  content: string;
  read_by_admin: boolean;
  read_by_client: boolean;
  created_at: string;
}

export async function listPropertyMessages(propertyId: string): Promise<PropertyMessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PropertyMessageRow[];
}

export async function sendPropertyMessage(args: {
  property_id: string;
  content: string;
  sender_role: 'admin' | 'owner';
  sender_name: string;
}): Promise<PropertyMessageRow> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    property_id: args.property_id,
    sender_id: user?.id ?? null,
    sender_role: args.sender_role,
    sender_name: (args.sender_name || 'Anonyme').trim(),
    content: args.content.trim(),
  };
  const { data, error } = await supabase.from('messages').insert(payload).select().single();
  if (error) throw error;
  return data as PropertyMessageRow;
}

export async function listMyOwnerConversations(userId: string) {
  // Liste les biens de l'owner + dernier message éventuel pour chacun.
  const { data: props, error: pErr } = await supabase
    .from('properties')
    .select('id,title,admin_status,images')
    .eq('owner_id', userId);
  if (pErr) throw pErr;
  if (!props || props.length === 0) return [];

  const ids = props.map(p => p.id);
  const { data: msgs, error: mErr } = await supabase
    .from('messages')
    .select('*')
    .in('property_id', ids)
    .order('created_at', { ascending: false });
  if (mErr) throw mErr;

  return props.map(p => {
    const propMsgs = (msgs ?? []).filter((m: any) => m.property_id === p.id);
    return {
      property: p,
      lastMessage: propMsgs[0] ?? null,
      unread: propMsgs.filter((m: any) => m.sender_role === 'admin' && !m.read_by_client).length,
      count: propMsgs.length,
    };
  }).sort((a, b) => {
    const at = a.lastMessage?.created_at ?? '';
    const bt = b.lastMessage?.created_at ?? '';
    return bt.localeCompare(at);
  });
}
