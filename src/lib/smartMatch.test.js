import { test, expect } from 'bun:test';
import { parseQuery, smartFilter } from './smartMatch';

test('furnished searches do not also require unfurnished homes', () => {
  expect(parseQuery('studio meublé', []).criteria).toEqual(['Studio', 'Meublé']);
  const source = [
    { id: 'furnished', type: 'studio_meuble', furnished: true, quartier: 'Zogona', title: 'Studio', price: 150000 },
    { id: 'empty', type: 'studio', furnished: false, quartier: 'Zogona', title: 'Studio', price: 150000 },
  ];
  expect(smartFilter(source, 'studio meublé à Zogona', ['Zogona']).map(p => p.id)).toEqual(['furnished']);
});