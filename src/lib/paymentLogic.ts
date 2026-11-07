// Pure helpers for the simulated Mobile Money flow — no network, safe to unit-test.

export type PaymentOperatorCode = 'orange_money' | 'moov_money';

export interface PaymentOperator {
  code: PaymentOperatorCode;
  name: string;
  receiver: string;
  display_name: string;
  syntax: string;
  enabled: boolean;
}

export type PaymentStatus =
  | 'not_initiated' | 'initiated' | 'awaiting_confirmation' | 'otp_incorrect'
  | 'simulated_validated' | 'simulated_failed' | 'cancelled' | 'simulated_refunded' | 'awaiting_real_verification';

export type StayStatus =
  | 'awaiting_payment' | 'paid_awaiting_owner' | 'pending' | 'confirmed' | 'refused' | 'expired' | 'cancelled';

/** Fallback only — the source of truth is the admin-editable `payment_operators` setting. */
export const DEFAULT_OPERATORS: PaymentOperator[] = [
  { code: 'orange_money', name: 'Orange Money', receiver: '57976660', display_name: 'SapSapHouse', syntax: 'TEST-OMENVOI{RECEIVER}{AMOUNT}{REF}#', enabled: true },
  { code: 'moov_money', name: 'Moov Money', receiver: '50442595', display_name: 'SapSapHouse', syntax: 'TEST-MOOVENVOI{RECEIVER}{AMOUNT}{REF}#', enabled: true },
];

/** Non-executable teaching string. Always prefixed with TEST- so it can never be a real operator code. */
export function buildTransferSyntax(op: Pick<PaymentOperator, 'syntax' | 'receiver'>, amount: number, reference: string): string {
  const raw = (op.syntax || 'TEST-ENVOI{RECEIVER}{AMOUNT}{REF}#')
    .replace('{RECEIVER}', op.receiver)
    .replace('{AMOUNT}', String(Math.round(amount)))
    .replace('{REF}', reference);
  return raw.startsWith('TEST-') ? raw : `TEST-${raw}`;
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  not_initiated: 'Non initié',
  initiated: 'Initié',
  awaiting_confirmation: 'En attente de confirmation',
  otp_incorrect: 'OTP incorrect',
  simulated_validated: 'Simulation validée',
  simulated_failed: 'Simulation échouée',
  cancelled: 'Annulé',
  simulated_refunded: 'Remboursement simulé',
  awaiting_real_verification: 'En attente de vérification réelle',
};

export const STAY_STATUS_LABEL: Record<StayStatus, string> = {
  awaiting_payment: 'En attente de paiement',
  paid_awaiting_owner: 'Payé · confirmation en cours',
  pending: 'En attente',
  confirmed: 'Confirmée',
  refused: 'Non disponible',
  expired: 'Expirée',
  cancelled: 'Annulée',
};

/** A hold can be paid only while it is awaiting payment and not expired. */
export function canPayStay(status: string, holdExpiresAt: string | null, now: Date = new Date()): boolean {
  return status === 'awaiting_payment' && !!holdExpiresAt && new Date(holdExpiresAt).getTime() > now.getTime();
}

/** The final booking confirmation exists only after simulated payment AND owner confirmation. */
export function canHaveFinalConfirmation(stayStatus: string, paymentStatus: string | null | undefined): boolean {
  return stayStatus === 'confirmed' && paymentStatus === 'simulated_validated';
}

export function secondsLeft(holdExpiresAt: string | null, now: Date = new Date()): number {
  if (!holdExpiresAt) return 0;
  return Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - now.getTime()) / 1000));
}
