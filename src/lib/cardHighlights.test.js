import { describe, it, expect } from 'bun:test';
import { cardHighlights, shortPrice } from './cardHighlights.ts';

describe('cardHighlights', () => {
  it('never returns more than 3 characteristics', () => {
    const p = { bedrooms: 3, has_ac: true, has_internet: true, has_generator: true, has_pool: true, surface_area: 120 };
    expect(cardHighlights(p).length).toBe(3);
  });
  it('prioritises bedrooms, AC then Wi-Fi', () => {
    const p = { bedrooms: 2, has_pool: true, features: ['wifi', 'climatisation'] };
    expect(cardHighlights(p).map(h => h.key)).toEqual(['bedrooms', 'ac', 'wifi']);
  });
});

describe('shortPrice', () => {
  it('abbreviates thousands and millions', () => {
    expect(shortPrice(25000)).toBe('25k');
    expect(shortPrice(1200000)).toBe('1,2M');
  });
});
