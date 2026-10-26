import { supabase } from '@/integrations/supabase/client';

// Clé partagée avec l'accueil, les résultats, la fiche et les Reels.
const LS_KEY = 'sapsap_favorites';

export interface FavoriteRow {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

const readLocal = (): string[] => {
  try {
    const legacy: string[] = JSON.parse(localStorage.getItem('sapsap_favorites_v1') || '[]');
    const cur: string[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return [...new Set([...cur, ...legacy])];
  } catch { return []; }
};
const writeLocal = (ids: string[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...new Set(ids)]));
    localStorage.removeItem('sapsap_favorites_v1');
    window.dispatchEvent(new Event('storage'));
  } catch {}
};

export async function listFavoriteIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readLocal();
  const { data, error } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
  if (error) return readLocal();
  return [...new Set([...(data ?? []).map(r => r.property_id), ...readLocal().filter(id => !/^[0-9a-f-]{36}$/i.test(id))])];
}

export async function addFavorite(propertyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    writeLocal([...readLocal(), propertyId]);
    return;
  }
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) { writeLocal([...readLocal(), propertyId]); return; }
  const { error } = await supabase.from('favorites').upsert({ user_id: user.id, property_id: propertyId }, { onConflict: 'user_id,property_id', ignoreDuplicates: true });
  if (error) throw error;
  window.dispatchEvent(new Event('sapsap-favorites-changed'));
}

export async function removeFavorite(propertyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    writeLocal(readLocal().filter(id => id !== propertyId));
    return;
  }
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) { writeLocal(readLocal().filter(id => id !== propertyId)); return; }
  const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
  if (error) throw error;
  window.dispatchEvent(new Event('sapsap-favorites-changed'));
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
  const realIds = local.filter(id => /^[0-9a-f-]{36}$/i.test(id));
  if (!realIds.length) return;
  const rows = realIds.map(property_id => ({ user_id: user.id, property_id }));
  const { error } = await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,property_id', ignoreDuplicates: true });
  if (error) throw error;
  writeLocal(local.filter(id => !realIds.includes(id)));
}
