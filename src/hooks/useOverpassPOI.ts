import { useState, useEffect, useRef } from 'react';
import { mockPois, POI_CATALOG } from '@/lib/mockData';

export interface OverpassPOI {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = (lat: number, lon: number, radius: number) => `
[out:json][timeout:25];
(
  node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
  node["amenity"="marketplace"](around:${radius},${lat},${lon});
  node["shop"~"supermarket|convenience|mall"](around:${radius},${lat},${lon});
  node["amenity"~"fuel|gas_station"](around:${radius},${lat},${lon});
  node["amenity"~"school|university|college"](around:${radius},${lat},${lon});
  node["amenity"~"hospital|clinic|pharmacy|doctors"](around:${radius},${lat},${lon});
  node["amenity"~"bus_station|taxi"](around:${radius},${lat},${lon});
  node["amenity"~"restaurant|cafe|fast_food|bar"](around:${radius},${lat},${lon});
  node["amenity"="bank"](around:${radius},${lat},${lon});
  node["amenity"="atm"](around:${radius},${lat},${lon});
  node["amenity"~"police|fire_station"](around:${radius},${lat},${lon});
  node["leisure"~"park|playground|sports_centre"](around:${radius},${lat},${lon});
  node["tourism"~"hotel|attraction"](around:${radius},${lat},${lon});
);
out body 25;
`;

function mapOsmType(tags: Record<string, string>): string {
  if (tags.amenity) {
    if (tags.amenity === 'place_of_worship') return 'place_of_worship';
    if (tags.amenity === 'marketplace') return 'marketplace';
    if (['hospital', 'clinic', 'pharmacy', 'doctors'].includes(tags.amenity)) return tags.amenity;
    if (['school', 'university', 'college'].includes(tags.amenity)) return tags.amenity;
    if (['restaurant', 'cafe', 'fast_food', 'bar'].includes(tags.amenity)) return tags.amenity;
    if (tags.amenity === 'fuel') return 'fuel';
    if (tags.amenity === 'bank') return 'bank';
    if (tags.amenity === 'atm') return 'atm';
    if (tags.amenity === 'police') return 'police';
    if (tags.amenity === 'fire_station') return 'fire_station';
    if (tags.amenity === 'bus_station') return 'bus_station';
    if (tags.amenity === 'taxi') return 'taxi';
    return tags.amenity;
  }
  if (tags.shop) {
    if (tags.shop === 'supermarket') return 'supermarket';
    if (tags.shop === 'convenience') return 'convenience';
    if (tags.shop === 'mall') return 'mall';
    return 'convenience';
  }
  if (tags.leisure) {
    if (tags.leisure === 'park') return 'park';
    if (tags.leisure === 'playground') return 'playground';
    if (tags.leisure === 'sports_centre') return 'sports_centre';
    return tags.leisure;
  }
  if (tags.tourism) {
    if (tags.tourism === 'hotel') return 'hotel';
    if (tags.tourism === 'attraction') return 'attraction';
    return tags.tourism;
  }
  return 'unknown';
}

export function useOverpassPOI(lat: number | null, lon: number | null, enabled: boolean = true) {
  const [pois, setPois] = useState<OverpassPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, OverpassPOI[]>>(new Map());

  useEffect(() => {
    if (!enabled || lat === null || lon === null) {
      setPois([]);
      return;
    }

    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (cacheRef.current.has(key)) {
      setPois(cacheRef.current.get(key)!);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchPOIs = async () => {
      try {
        const query = OVERPASS_QUERY(lat, lon, 1000);
        const res = await fetch(OVERPASS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
        const data = await res.json();

        const results: OverpassPOI[] = (data.elements || [])
          .filter((el: any) => el.lat && el.lon && el.tags)
          .map((el: any, i: number) => ({
            id: `op_${el.id || i}`,
            name: el.tags.name || el.tags['name:fr'] || POI_CATALOG[mapOsmType(el.tags)]?.label || 'Lieu',
            type: mapOsmType(el.tags),
            latitude: el.lat,
            longitude: el.lon,
          }))
          .filter((p: OverpassPOI) => p.type !== 'unknown')
          .slice(0, 25);

        if (!cancelled) {
          cacheRef.current.set(key, results);
          setPois(results);
        }
      } catch (err: any) {
        console.warn('Overpass fallback to mock POIs:', err.message);
        if (!cancelled) {
          setError('POI indisponibles pour le moment');
          // Fallback: use mock POIs near the coordinates
          const fallback = mockPois
            .filter(p => {
              const dist = Math.sqrt(Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lon, 2));
              return dist < 0.015; // ~1.5km
            })
            .slice(0, 25)
            .map(p => ({ ...p }));
          setPois(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPOIs();
    return () => { cancelled = true; };
  }, [lat, lon, enabled]);

  return { pois, loading, error };
}
