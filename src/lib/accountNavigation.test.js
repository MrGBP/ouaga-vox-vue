import { describe, it, expect } from 'bun:test';
import { accountNavigation } from './accountNavigation.ts';

describe('account navigation', () => {
  it('keeps the personal account alongside the owner workspace', () => {
    expect(accountNavigation(true).map(item => item.path)).toEqual([
      '/mon-compte', '/proprietaire', '/proprietaire/biens',
      '/proprietaire/reservations', '/proprietaire/messages',
    ]);
  });
  it('does not offer owner-only destinations to a regular account', () => {
    expect(accountNavigation(false).map(item => item.path)).toEqual(['/mon-compte']);
  });
});