import type { Property } from '@/lib/mockData';
import { getTypeLabel, CHAR_CHECKS } from '@/lib/mockData';
import type { FilterState } from '@/components/FilterBar';

const OR_GROUPS = [
  ['bed_1', 'bed_2', 'bed_3', 'bed_4plus'],
  ['bath_1', 'bath_2plus'],
];

/**
 * Shared property filtering — single source of truth used by both the home
 * controller (Index.tsx) and the dedicated results page (Resultats.tsx).
 * Keep the logic here in sync if you ever need to tweak how filters work.
 */
export function filterProperties(
  source: Property[],
  query: string,
  f: FilterState,
  favsOnly: boolean = false,
  favSet: Set<string> = new Set()
): Property[] {
  let result = source.filter(p => p.status !== 'rented' && p.available !== false);
  if (favsOnly) result = result.filter(p => favSet.has(p.id));

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.quartier.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      getTypeLabel(p.type).toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.price.toString().includes(q)
    );
  }

  if (f.type !== 'all') result = result.filter(p => p.type === f.type);
  if (f.quartier !== 'all') result = result.filter(p => p.quartier === f.quartier);
  result = result.filter(p => p.price >= f.minPrice && p.price <= f.maxPrice);
  if (f.minBedrooms > 0) result = result.filter(p => (p.bedrooms || 0) >= f.minBedrooms);
  if (f.hasVirtualTour) result = result.filter(p => !!p.virtual_tour_url);

  if (f.surfaceRange && f.surfaceRange !== 'all') {
    const sr = f.surfaceRange;
    if (sr === '<50') result = result.filter(p => (p.surface_area || 0) < 50);
    else if (sr === '50-150') result = result.filter(p => (p.surface_area || 0) >= 50 && (p.surface_area || 0) <= 150);
    else if (sr === '150-300') result = result.filter(p => (p.surface_area || 0) >= 150 && (p.surface_area || 0) <= 300);
    else if (sr === '>300') result = result.filter(p => (p.surface_area || 0) > 300);
  }

  if (f.characteristics.length > 0) {
    const orGroupChecks: ((p: Property) => boolean)[] = [];
    const andKeys: string[] = [];
    const assignedToGroup = new Set<string>();
    OR_GROUPS.forEach(group => {
      const activeInGroup = f.characteristics.filter(c => group.includes(c));
      if (activeInGroup.length > 0) {
        activeInGroup.forEach(k => assignedToGroup.add(k));
        orGroupChecks.push((p: Property) => activeInGroup.some(c => CHAR_CHECKS[c]?.(p as any)));
      }
    });
    f.characteristics.forEach(c => {
      if (!assignedToGroup.has(c)) andKeys.push(c);
    });
    result = result.filter(p => {
      const orPass = orGroupChecks.every(check => check(p));
      const andPass = andKeys.every(c => CHAR_CHECKS[c]?.(p as any));
      return orPass && andPass;
    });
  }

  if (f.minSurface > 0) {
    result = result.filter(p => (p.surface_area || 0) >= f.minSurface);
  }

  return result;
}
