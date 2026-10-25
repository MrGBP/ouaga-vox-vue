// Vignettes : 3 caractéristiques max, ordonnées selon ce que les locataires
// regardent en premier (chambres, clim, Wi-Fi, groupe, parking, piscine, surface).
export interface Highlight { key: string; label: string }

const has = (p: Record<string, any>, key: string, flag?: string) =>
  (Array.isArray(p.features) && p.features.includes(key)) || (flag ? !!p[flag] : false);

export function cardHighlights(p: Record<string, any>, max = 3): Highlight[] {
  const out: Highlight[] = [];
  if (typeof p.bedrooms === 'number' && p.bedrooms > 0) out.push({ key: 'bedrooms', label: `${p.bedrooms} ch.` });
  if (has(p, 'climatisation', 'has_ac')) out.push({ key: 'ac', label: 'Clim' });
  if (has(p, 'wifi', 'has_internet')) out.push({ key: 'wifi', label: 'Wi-Fi' });
  if (has(p, 'groupe_electrogene', 'has_generator')) out.push({ key: 'generator', label: 'Groupe' });
  if (has(p, 'parking_int', 'has_parking_int') || has(p, 'parking_ext', 'has_parking_ext')) out.push({ key: 'parking', label: 'Parking' });
  if (has(p, 'piscine', 'has_pool')) out.push({ key: 'pool', label: 'Piscine' });
  if (typeof p.surface_area === 'number' && p.surface_area > 0) out.push({ key: 'surface', label: `${p.surface_area} m²` });
  return out.slice(0, max);
}

/** Prix abrégé pour la carte : 25000 → 25k, 1200000 → 1,2M */
export function shortPrice(n: number): string {
  if (n >= 1_000_000) return `${(Math.round(n / 100_000) / 10).toString().replace('.', ',')}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}
