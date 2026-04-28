// Service hybride : essaie Supabase, fallback sur les mocks pour ne rien casser.
import { supabase } from '@/integrations/supabase/client';
import { mockProperties, type Property } from '@/lib/mockData';

const FEATURE_KEYS = [
  'has_ac','has_guardian','has_generator','has_garden','has_water','has_internet',
  'has_kitchen','has_fridge','has_stove','has_tv','has_terrace','has_pool',
  'has_parking_int','has_parking_ext','has_fence','has_auto_gate','has_cameras',
  'has_paved_road','has_pmr','has_water_tower','is_new_build','is_renovated','pets_allowed',
] as const;

function rowToProperty(row: any): Property {
  const features = row.features ?? {};
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    type: row.type,
    price: Number(row.price),
    quartier: row.quartier,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    surface_area: row.surface_area ?? undefined,
    comfort_rating: row.comfort_rating ?? undefined,
    security_rating: row.security_rating ?? undefined,
    accessibility_rating: row.accessibility_rating ?? undefined,
    images: row.images ?? [],
    available: row.available ?? true,
    virtual_tour_url: row.virtual_tour_url ?? undefined,
    video_url: row.video_url ?? undefined,
    has_video: !!row.video_url,
    year_built: row.year_built ?? undefined,
    furnished: row.furnished ?? false,
    status: row.status ?? 'available',
    agent_name: row.agent_name ?? undefined,
    agent_phone: row.agent_phone ?? undefined,
    agent_photo: row.agent_photo ?? undefined,
    created_at: row.created_at,
    ...Object.fromEntries(FEATURE_KEYS.map(k => [k, !!features[k]])),
  } as Property;
}

export async function fetchPublishedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('admin_status', 'published')
    .neq('status', 'rented')
    .order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    // Fallback to mocks (keeps the public site working before any real data is added)
    return mockProperties.filter(p => p.status !== 'rented');
  }
  return data.map(rowToProperty);
}

export async function fetchAllPropertiesAdmin(): Promise<Property[]> {
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToProperty);
}

export async function adminCreateProperty(input: Partial<Property> & { features?: Record<string, boolean> }) {
  const { features, ...rest } = input as any;
  const payload: any = { ...rest, features: features ?? {} };
  // Move feature flags from flat into jsonb
  for (const k of FEATURE_KEYS) if (k in payload) { payload.features[k] = !!payload[k]; delete payload[k]; }
  const { data, error } = await supabase.from('properties').insert(payload).select().single();
  if (error) throw error;
  return rowToProperty(data);
}

export async function adminUpdateProperty(id: string, patch: Partial<Property> & { features?: Record<string, boolean> }) {
  const { features, ...rest } = patch as any;
  const payload: any = { ...rest };
  if (features) payload.features = features;
  for (const k of FEATURE_KEYS) if (k in payload) {
    payload.features = payload.features ?? {};
    payload.features[k] = !!payload[k];
    delete payload[k];
  }
  const { data, error } = await supabase.from('properties').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return rowToProperty(data);
}

export async function adminDeleteProperty(id: string) {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function adminSetStatus(id: string, admin_status: 'pending'|'published'|'rejected'|'rented'|'inactive'|'reviewing'|'corrections') {
  const patch: any = { admin_status };
  if (admin_status === 'published') patch.published_at = new Date().toISOString();
  const { error } = await supabase.from('properties').update(patch).eq('id', id);
  if (error) throw error;
}

// ─── MEDIA ────────────────────────────────────────────────────────────────
export async function uploadPropertyMedia(propertyId: string, file: File, kind: 'image'|'video'|'video_360' = 'image') {
  const ext = file.name.split('.').pop();
  const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from('property-media').upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from('property-media').getPublicUrl(path);
  const { data, error } = await supabase.from('property_media').insert({
    property_id: propertyId, kind, url: pub.publicUrl, storage_path: path,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function addPropertyMediaUrl(propertyId: string, url: string, kind: 'image'|'video'|'video_360' = 'image') {
  const { data, error } = await supabase.from('property_media').insert({
    property_id: propertyId, url, kind,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function listPropertyMedia(propertyId: string) {
  const { data, error } = await supabase.from('property_media').select('*').eq('property_id', propertyId).order('position');
  if (error) throw error;
  return data ?? [];
}

export async function deletePropertyMedia(mediaId: string, storagePath?: string | null) {
  if (storagePath) await supabase.storage.from('property-media').remove([storagePath]);
  const { error } = await supabase.from('property_media').delete().eq('id', mediaId);
  if (error) throw error;
}

export async function updateMediaPosition(mediaId: string, position: number) {
  const { error } = await supabase.from('property_media').update({ position }).eq('id', mediaId);
  if (error) throw error;
}

export async function reorderPropertyMedia(items: { id: string; position: number }[]) {
  await Promise.all(items.map(it => updateMediaPosition(it.id, it.position)));
}
