import { supabase } from '@/integrations/supabase/client';

const LS_KEY = 'sapsap_favorites_v1';

export interface FavoriteRow {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

const readLocal = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const writeLocal = (ids: string[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...new Set(ids)])); } catch {}
};

export async function listFavoriteIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readLocal();
  const { data, error } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
  if (error) return readLocal();
  return (data ?? []).map(r => r.property_id);
}

export async function addFavorite(propertyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    writeLocal([...readLocal(), propertyId]);
    return;
  }
  await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
}

export async function removeFavorite(propertyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    writeLocal(readLocal().filter(id => id !== propertyId));
    return;
  }
  await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
}

export async function toggleFavorite(propertyId: string): Promise<boolean> {
  const ids = await listFavoriteIds();
  if (ids.includes(propertyId)) {
    await removeFavorite(propertyId);
    return false;
  }
  await addFavorite(propertyId);
  return true;
}

/** Sync localStorage favorites into Supabase after sign-in (one-shot merge). */
export async function syncLocalFavoritesToCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const local = readLocal();
  if (local.length === 0) return;
  const rows = local.map(property_id => ({ user_id: user.id, property_id }));
  await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,property_id', ignoreDuplicates: true });
  writeLocal([]);
}
