import { supabase } from '@/integrations/supabase/client';

export type BlockedRange = {
  id: string;
  property_id: string;
  owner_id: string;
  date_from: string; // 'YYYY-MM-DD'
  date_to: string;
  reason: string | null;
  note: string | null;
};

export const BLOCK_REASONS: Array<{ value: string; label: string }> = [
  { value: 'personal', label: 'Usage personnel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'external_booking', label: 'Réservation externe' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'unavailable', label: 'Indisponible' },
];

export async function listBlockedDates(propertyId: string): Promise<BlockedRange[]> {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('id,property_id,owner_id,date_from,date_to,reason,note')
    .eq('property_id', propertyId)
    .order('date_from', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BlockedRange[];
}

export async function addBlockedRange(args: {
  property_id: string;
  owner_id: string;
  date_from: string;
  date_to: string;
  reason: string;
  note?: string;
}) {
  const { data, error } = await supabase.from('blocked_dates').insert(args).select('*').single();
  if (error) throw error;
  return data as BlockedRange;
}

export async function deleteBlockedRange(id: string) {
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
  if (error) throw error;
}

/** Vérifie si un intervalle entre en collision avec une plage bloquée. */
export async function hasBlockedConflict(propertyId: string, from: string, to: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('property_id', propertyId)
    .lte('date_from', to)
    .gte('date_to', from)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
