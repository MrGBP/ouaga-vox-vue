export const normalizeCity = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function burkinaCityId(city: string): string | undefined {
  const value = normalizeCity(city);
  if (value === 'ouaga' || value === 'ouagadougou') return 'ouagadougou';
  if (value === 'bobo' || value === 'bobodioulasso') return 'bobo-dioulasso';
  if (value === 'manga') return 'manga';
  return undefined;
}

export function prioritizeCity<T extends { city?: string }>(items: T[], city: string): T[] {
  const target = burkinaCityId(city) || normalizeCity(city);
  const match = (item: T) => (burkinaCityId(item.city || '') || normalizeCity(item.city || '')) === target;
  return [...items.filter(match), ...items.filter(item => !match(item))];
}