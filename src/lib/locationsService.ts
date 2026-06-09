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

let _cache: LocationRow[] | null = null;
let _cachePromise: Promise<LocationRow[]> | null = null;

export async function fetchLocations(countryCode = 'BF'): Promise<LocationRow[]> {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  _cachePromise = (async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id,country_code,country_name,city,quartier,commune,arrondissement,lat,lng')
      .eq('country_code', countryCode)
      .eq('active', true)
      .order('city')
      .order('quartier');
    if (error) throw error;
    _cache = (data ?? []) as LocationRow[];
    return _cache;
  })();
  return _cachePromise;
}

export function searchLocations(items: LocationRow[], query: string, limit = 8): LocationRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit);
  return items
    .filter(l => l.quartier.toLowerCase().includes(q) || l.city.toLowerCase().includes(q))
    .slice(0, limit);
}
