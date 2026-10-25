import { test, expect } from 'bun:test';
import { burkinaCityId, prioritizeCity } from './cityDiscovery';

test('Ouagadougou comes first without hiding Bobo or Manga', () => {
  const items = [{ city: 'Manga' }, { city: 'Bobo-Dioulasso' }, { city: 'Ouagadougou' }];
  expect(prioritizeCity(items, 'Ouaga').map(p => p.city)).toEqual(['Ouagadougou', 'Manga', 'Bobo-Dioulasso']);
  expect(items[0].city).toBe('Manga');
});
test('Burkina detection recognizes Bobo and Manga, not other countries', () => {
  expect(burkinaCityId('Bobo Dioulasso')).toBe('bobo-dioulasso');
  expect(burkinaCityId('Manga')).toBe('manga');
  expect(burkinaCityId('Accra')).toBeUndefined();
});