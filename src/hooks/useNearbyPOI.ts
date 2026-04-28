import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOverpassPOI, type OverpassPOI } from './useOverpassPOI';

export interface NearbyPOI extends OverpassPOI {
  distance_m: number;
  source: 'supabase' | 'overpass' | 'mock';
}

/**
 * Haversine distance in meters
 */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Hybrid POI hook:
 *   1. Try Supabase `pois` table — either by property_id (curated POIs) or by bounding box.
 *   2. If empty, fall back to live Overpass (or mock as last resort, handled inside useOverpassPOI).
 *
 * @param propertyId  Optional. If provided, curated POIs linked to this property are preferred.
 * @param lat/lng     Reference point for distance calculation + Overpass fallback.
 * @param radiusM     Search radius in meters (default 1500).
 * @param enabled     Toggle the whole hook off (default true).
 */
export function useNearbyPOI(
  propertyId: string | undefined,
  lat: number | null,
  lng: number | null,
  radiusM: number = 1500,
  enabled: boolean = true
) {
  const [supabasePois, setSupabasePois] = useState<NearbyPOI[] | null>(null);
  const [supaLoading, setSupaLoading] = useState(false);
  const cacheRef = useRef<Map<string, NearbyPOI[]>>(new Map());

  // --- 1. Supabase fetch (curated) ---
  useEffect(() => {
    if (!enabled || lat === null || lng === null) {
      setSupabasePois(null);
      return;
    }

    const cacheKey = `${propertyId ?? 'box'}_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusM}`;
    if (cacheRef.current.has(cacheKey)) {
      setSupabasePois(cacheRef.current.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    setSupaLoading(true);

    (async () => {
      try {
        // Approx bounding box (1° lat ≈ 111 km)
        const dLat = radiusM / 111000;
        const dLng = radiusM / (111000 * Math.cos((lat * Math.PI) / 180));
        const minLat = lat - dLat;
        const maxLat = lat + dLat;
        const minLng = lng - dLng;
        const maxLng = lng + dLng;

        let query = supabase
          .from('pois')
          .select('id, name, type, latitude, longitude, property_id')
          .gte('latitude', minLat)
          .lte('latitude', maxLat)
          .gte('longitude', minLng)
          .lte('longitude', maxLng)
          .limit(50);

        // Prefer curated POIs for this property when present
        if (propertyId) {
          // We do an OR: either linked to this property OR no link (generic POI)
          query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
        }

        const { data, error } = await query;
        if (cancelled) return;
        if (error) {
          console.warn('Supabase POI query failed:', error.message);
          setSupabasePois([]); // triggers Overpass fallback
          return;
        }

        const enriched: NearbyPOI[] = (data || [])
          .map((p: any) => ({
            id: `sb_${p.id}`,
            name: p.name,
            type: p.type,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            distance_m: haversineM(lat, lng, Number(p.latitude), Number(p.longitude)),
            source: 'supabase' as const,
          }))
          .filter(p => p.distance_m <= radiusM)
          .sort((a, b) => a.distance_m - b.distance_m);

        cacheRef.current.set(cacheKey, enriched);
        setSupabasePois(enriched);
      } catch (e: any) {
        console.warn('useNearbyPOI Supabase error:', e?.message);
        if (!cancelled) setSupabasePois([]);
      } finally {
        if (!cancelled) setSupaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId, lat, lng, radiusM, enabled]);

  // --- 2. Overpass fallback (only fired when Supabase result is empty) ---
  const useOverpass = enabled && supabasePois !== null && supabasePois.length === 0;
  const { pois: overpassPois, loading: overpassLoading } = useOverpassPOI(
    useOverpass ? lat : null,
    useOverpass ? lng : null,
    useOverpass
  );

  // --- 3. Merge & decorate ---
  const finalPois: NearbyPOI[] =
    supabasePois && supabasePois.length > 0
      ? supabasePois
      : (overpassPois || [])
          .map(p => ({
            ...p,
            distance_m: lat !== null && lng !== null ? haversineM(lat, lng, p.latitude, p.longitude) : 0,
            source: 'overpass' as const,
          }))
          .filter(p => p.distance_m <= radiusM)
          .sort((a, b) => a.distance_m - b.distance_m);

  return {
    pois: finalPois,
    loading: supaLoading || overpassLoading,
    source:
      supabasePois && supabasePois.length > 0
        ? 'supabase'
        : finalPois.length > 0
        ? 'overpass'
        : 'none',
  };
}
