import { test, expect } from 'bun:test';
import { furnishedSuggestionProperties } from './furnishedSuggestions';

test('suggestions only contain furnished homes, including legacy furnished villas', () => {
  const properties = [
    { type: 'studio_meuble' }, { type: 'appartement_meuble' }, { type: 'chambre_meublee' },
    { type: 'villa_meublee' }, { type: 'maison', furnished: true },
    { type: 'bureau' }, { type: 'local_commercial' }, { type: 'appartement_simple' },
  ];
  expect(furnishedSuggestionProperties(properties).map(p => p.type)).toEqual([
    'studio_meuble', 'appartement_meuble', 'chambre_meublee', 'villa_meublee', 'maison',
  ]);
});

test('rented and unavailable furnished homes never appear in suggestions', () => {
  expect(furnishedSuggestionProperties([
    { type: 'studio_meuble', status: 'rented' },
    { type: 'appartement_meuble', available: false },
    { type: 'chambre_meublee', available: true },
  ])).toEqual([{ type: 'chambre_meublee', available: true }]);
});