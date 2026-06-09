// CRUD léger pour les POIs liés à un bien (table public.pois avec property_id).
import { supabase } from '@/integrations/supabase/client';

export interface PropertyPoi {
  id: string;
  name: string;
  type: string;
  quartier?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  property_id?: string | null;
  distance_m?: number | null;
}

export const POI_TYPES = [
  { value: 'school', label: 'École / Université', emoji: '🏫' },
  { value: 'hospital', label: 'Hôpital / Clinique', emoji: '🏥' },
  { value: 'pharmacy', label: 'Pharmacie', emoji: '💊' },
  { value: 'market', label: 'Marché', emoji: '🛒' },
  { value: 'supermarket', label: 'Supermarché', emoji: '🏬' },
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'bank', label: 'Banque / ATM', emoji: '🏦' },
  { value: 'transport', label: 'Arrêt transport', emoji: '🚌' },
  { value: 'mosque', label: 'Mosquée', emoji: '🕌' },
  { value: 'church', label: 'Église', emoji: '⛪' },
  { value: 'admin', label: 'Administration', emoji: '🏛️' },
  { value: 'park', label: 'Parc / Loisirs', emoji: '🌳' },
] as const;

export async function listPoisForProperty(propertyId: string): Promise<PropertyPoi[]> {
  const { data, error } = await supabase
    .from('pois')
    .select('*')
    .eq('property_id', propertyId)
    .order('distance_m', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as PropertyPoi[];
}

export async function addPoiToProperty(
  propertyId: string,
  poi: { name: string; type: string; quartier?: string; latitude?: number; longitude?: number; distance_m?: number },
): Promise<PropertyPoi> {
  const payload = {
    name: poi.name.trim(),
    type: poi.type,
    quartier: poi.quartier ?? null,
    latitude: poi.latitude ?? null,
    longitude: poi.longitude ?? null,
    distance_m: poi.distance_m ?? null,
    property_id: propertyId,
  };
  const { data, error } = await supabase.from('pois').insert(payload).select().single();
  if (error) throw error;
  return data as PropertyPoi;
}

export async function removePoi(poiId: string): Promise<void> {
  const { error } = await supabase.from('pois').delete().eq('id', poiId);
  if (error) throw error;
}
