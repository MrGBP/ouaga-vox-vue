import { describe, it, expect } from 'bun:test';
import { buildTransferSyntax, DEFAULT_OPERATORS, canPayStay, canHaveFinalConfirmation } from './paymentLogic.ts';

const om = DEFAULT_OPERATORS.find(o => o.code === 'orange_money');
const moov = DEFAULT_OPERATORS.find(o => o.code === 'moov_money');

describe('simulated Mobile Money', () => {
  it('Orange Money receives on 57976660 and Moov Money on 50442595', () => {
    expect(om.receiver).toBe('57976660');
    expect(moov.receiver).toBe('50442595');
  });
  it('builds the Orange Money teaching syntax with amount and reference', () => {
    expect(buildTransferSyntax(om, 25000, 'TXOMAB12CD34')).toBe('TEST-OMENVOI5797666025000TXOMAB12CD34#');
  });
  it('builds the Moov Money teaching syntax with amount and reference', () => {
    expect(buildTransferSyntax(moov, 15000, 'TXMV00')).toBe('TEST-MOOVENVOI5044259515000TXMV00#');
  });
  it('always prefixes a custom syntax with TEST- so it is never executable', () => {
    expect(buildTransferSyntax({ syntax: '*144*{RECEIVER}*{AMOUNT}#', receiver: '1' }, 2, 'R')).toBe('TEST-*144*1*2#');
  });
  it('a 10-minute hold can be paid before expiry but not after', () => {
    const now = new Date('2026-11-07T10:00:00Z');
    expect(canPayStay('awaiting_payment', '2026-11-07T10:09:00Z', now)).toBe(true);
    expect(canPayStay('awaiting_payment', '2026-11-07T09:59:00Z', now)).toBe(false);
    expect(canPayStay('paid_awaiting_owner', '2026-11-07T10:09:00Z', now)).toBe(false);
  });
  it('a validated simulation alone does not make a final confirmation', () => {
    expect(canHaveFinalConfirmation('paid_awaiting_owner', 'simulated_validated')).toBe(false);
    expect(canHaveFinalConfirmation('confirmed', 'simulated_validated')).toBe(true);
  });
});
