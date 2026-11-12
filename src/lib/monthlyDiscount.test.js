import { describe, it, expect } from 'bun:test';
import { monthlyBreakdown, pctFromDiscountedPrice, clampDiscount } from './monthlyDiscount.ts';

describe('monthly discount', () => {
  it('10 000 F à 10 % => client paie 9 000 F', () => {
    const b = monthlyBreakdown(10000, 10, 6);
    expect(b.clientPrice).toBe(9000);
    expect(b.saving).toBe(1000);
  });
  it('hôte reçoit le prix remisé moins la commission', () => {
    expect(monthlyBreakdown(10000, 10, 6).net).toBe(8460);
  });
  it('taper 9 000 F sur 10 000 F donne 10 %', () => {
    expect(pctFromDiscountedPrice(10000, 9000)).toBe(10);
  });
  it('réduction limitée entre 0 et 50 %', () => {
    expect(clampDiscount(80)).toBe(50);
    expect(clampDiscount(-5)).toBe(0);
  });
});
