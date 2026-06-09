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
  reply_to_id?: string | null;
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
  reply_to_id?: string | null;
}): Promise<PropertyMessageRow> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload: any = {
    property_id: args.property_id,
    sender_id: user?.id ?? null,
    sender_role: args.sender_role,
    sender_name: (args.sender_name || 'Anonyme').trim(),
    content: args.content.trim(),
  };
  if (args.reply_to_id) payload.reply_to_id = args.reply_to_id;
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

/**
 * Liste, pour l'admin, toutes les conversations groupées par bien.
 * Renvoie chaque bien ayant au moins un message, ou tous les biens si pas encore d'échange.
 */
export async function listAllAdminConversations() {
  // 1. tous les messages property-scope (non-réservation)
  const { data: msgs, error: mErr } = await supabase
    .from('messages')
    .select('*')
    .not('property_id', 'is', null)
    .order('created_at', { ascending: false });
  if (mErr) throw mErr;

  const propIds = Array.from(new Set((msgs ?? []).map((m: any) => m.property_id))).filter(Boolean);
  if (propIds.length === 0) return [];

  const { data: props, error: pErr } = await supabase
    .from('properties')
    .select('id,title,admin_status,images,owner_id,quartier')
    .in('id', propIds);
  if (pErr) throw pErr;

  // 2. récupère les profils owner pour le nom
  const ownerIds = Array.from(new Set((props ?? []).map((p: any) => p.owner_id).filter(Boolean)));
  let owners: Record<string, { full_name: string | null; phone: string | null }> = {};
  if (ownerIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id,full_name,phone').in('id', ownerIds);
    owners = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, phone: p.phone }]));
  }

  return (props ?? []).map((p: any) => {
    const propMsgs = (msgs ?? []).filter((m: any) => m.property_id === p.id);
    const owner = p.owner_id ? owners[p.owner_id] : null;
    return {
      property: p,
      owner,
      lastMessage: propMsgs[0] ?? null,
      unread: propMsgs.filter((m: any) => m.sender_role !== 'admin' && !m.read_by_admin).length,
      count: propMsgs.length,
    };
  }).sort((a, b) => {
    const at = a.lastMessage?.created_at ?? '';
    const bt = b.lastMessage?.created_at ?? '';
    return bt.localeCompare(at);
  });
}

export async function markPropertyMessagesReadByAdmin(propertyId: string) {
  await supabase.from('messages').update({ read_by_admin: true })
    .eq('property_id', propertyId).neq('sender_role', 'admin');
}
