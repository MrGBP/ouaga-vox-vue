import { supabase } from '@/integrations/supabase/client';

export type LocationRow = {
  id: string;
  country_code: string;
  country_name: string;
  city: string;
  quartier: string;
  commune: string | null;
  arrondissement: number | null;
  lat: number | null;
  lng: number | null;
};

const _cache = new Map<string, LocationRow[]>();
const _pending = new Map<string, Promise<LocationRow[]>>();

export async function fetchLocations(countryCode = 'BF'): Promise<LocationRow[]> {
  const cc = countryCode.toUpperCase();
  if (_cache.has(cc)) return _cache.get(cc)!;
  if (_pending.has(cc)) return _pending.get(cc)!;
  const p = (async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id,country_code,country_name,city,quartier,commune,arrondissement,lat,lng')
      .eq('country_code', cc)
      .eq('active', true)
      .order('city')
      .order('quartier')
      .limit(2000);
    if (error) throw error;
    const rows = (data ?? []) as LocationRow[];
    _cache.set(cc, rows);
    return rows;
  })();
  _pending.set(cc, p);
  return p;
}

/** Renvoie toutes les localisations filtrées par sous-chaîne (city ou quartier ou commune). */
export function searchLocations(items: LocationRow[], query: string, limit = 500): LocationRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit);
  return items
    .filter(l =>
      l.quartier.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      (l.commune?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, limit);
}
