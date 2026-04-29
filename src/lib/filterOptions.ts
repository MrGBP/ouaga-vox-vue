/**
 * Computes filter option metadata directly from the live property dataset.
 * Single source of truth used by every screen that mounts <FilterBar /> so
 * the controls always reflect the *actual* data the user is browsing.
 *
 * - priceBounds: real min / max price across available properties (rounded to
 *   a clean step), so the slider never proposes empty ranges.
 * - quartiers: only quartier names that have at least one available property.
 * - types: only property types that have at least one available property.
 */
import { mockProperties, PROPERTY_TYPES } from '@/lib/mockData';
import type { Property } from '@/lib/mockData';

const STEP = 5000;
const roundDownTo = (n: number, step: number) => Math.floor(n / step) * step;
const roundUpTo = (n: number, step: number) => Math.ceil(n / step) * step;

const isVisible = (p: Property) => p.status !== 'rented' && p.available !== false;

export interface FilterOptions {
  priceMin: number;
  priceMax: number;
  quartiers: string[];
  typeValues: string[];
}

export function computeFilterOptions(source: Property[] = mockProperties): FilterOptions {
  const visible = source.filter(isVisible);

  // Price bounds — fall back to defaults if dataset is empty.
  let priceMin = 0;
  let priceMax = 2_000_000;
  if (visible.length > 0) {
    const prices = visible.map(p => p.price).filter(n => Number.isFinite(n));
    priceMin = roundDownTo(Math.min(...prices), STEP);
    priceMax = roundUpTo(Math.max(...prices), STEP);
    if (priceMax === priceMin) priceMax = priceMin + STEP;
  }

  const quartiers = Array.from(new Set(visible.map(p => p.quartier))).sort();

  const presentTypes = new Set(visible.map(p => p.type));
  const typeValues = PROPERTY_TYPES.map(t => t.value).filter(v => presentTypes.has(v));

  return { priceMin, priceMax, quartiers, typeValues };
}
