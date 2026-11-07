import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_OPERATORS, type PaymentOperator, type PaymentStatus } from '@/lib/paymentLogic';

const db = supabase as any;

export interface PaymentRow {
  id: string;
  reservation_id: string;
  property_id: string;
  user_id: string;
  payer_phone: string;
  operator: 'orange_money' | 'moov_money';
  receiver_number: string;
  amount: number;
  currency: string;
  transaction_ref: string;
  status: PaymentStatus;
  mode: string;
  otp_attempts: number;
  validated_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface ReceiptRow {
  id: string;
  receipt_number: string;
  kind: 'payment_ack' | 'booking_confirmation';
  version: number;
  supersedes_id: string | null;
  correction_reason: string | null;
  reservation_id: string;
  payment_id: string | null;
  user_id: string;
  property_id: string;
  mode: string;
  content: Record<string, any>;
  issued_at: string;
}

export interface StayRow {
  id: string;
  confirmation_number: string;
  property_id: string;
  property_title: string;
  property_quartier: string;
  user_id: string | null;
  user_name: string;
  user_phone: string;
  user_email: string;
  message: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  price_per_night: number;
  total_price: number;
  status: string;
  hold_expires_at: string | null;
  owner_respond_by: string | null;
  owner_decision_at: string | null;
  refusal_reason: string | null;
  price_snapshot: any;
  created_at: string;
}

export interface StayBundle extends StayRow {
  payments: PaymentRow[];
  receipts: ReceiptRow[];
}

export const RECEIPT_KIND_LABEL: Record<ReceiptRow['kind'], string> = {
  payment_ack: 'Accusé de paiement',
  booking_confirmation: 'Confirmation de réservation',
};

/** Opérateurs configurés par l'administration (repli sur les valeurs par défaut). */
export async function getPaymentOperators(): Promise<PaymentOperator[]> {
  const { data, error } = await db.rpc('payment_operators');
  if (error || !Array.isArray(data)) return DEFAULT_OPERATORS;
  return data as PaymentOperator[];
}

export async function initiateSimulatedPayment(reservationId: string, operator: string, phone: string): Promise<PaymentRow> {
  const { data, error } = await db.rpc('initiate_simulated_payment', { _reservation_id: reservationId, _operator: operator, _phone: phone });
  if (error) throw new Error(error.message);
  return data as PaymentRow;
}

export type ConfirmResult =
  | { status: 'validated' | 'already_validated'; payment_id: string; receipt_id: string | null }
  | { status: 'otp_incorrect' | 'simulated_failed'; payment_id: string; attempts_left: number }
  | { status: 'expired'; payment_id: string };

export async function confirmSimulatedPayment(paymentId: string, otp: string): Promise<ConfirmResult> {
  const { data, error } = await db.rpc('confirm_simulated_payment', { _payment_id: paymentId, _otp: otp });
  if (error) throw new Error(error.message);
  return data as ConfirmResult;
}

export async function ownerDecideReservation(id: string, accept: boolean, reason?: string) {
  const { data, error } = await db.rpc('owner_decide_reservation', { _id: id, _accept: accept, _reason: reason ?? null });
  if (error) throw new Error(error.message);
  return data as StayRow;
}

export async function cancelMyStay(id: string) {
  const { error } = await db.rpc('cancel_my_reservation', { _id: id });
  if (error) throw new Error(error.message);
}

export async function reissueReceipt(receiptId: string, reason: string): Promise<string> {
  const { data, error } = await db.rpc('reissue_receipt', { _receipt_id: receiptId, _reason: reason });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Libère les protections expirées et déclenche les relances dues (idempotent). */
export async function runBookingMaintenance() {
  try { await db.rpc('expire_stale_reservations'); } catch { /* noop */ }
}

async function attach(stays: StayRow[]): Promise<StayBundle[]> {
  if (stays.length === 0) return [];
  const ids = stays.map(s => s.id);
  const [{ data: pays }, { data: recs }] = await Promise.all([
    db.from('payments').select('*').in('reservation_id', ids).order('created_at', { ascending: false }),
    db.from('receipts').select('*').in('reservation_id', ids).order('issued_at', { ascending: false }),
  ]);
  return stays.map(s => ({
    ...s,
    payments: ((pays as PaymentRow[]) || []).filter(p => p.reservation_id === s.id),
    receipts: ((recs as ReceiptRow[]) || []).filter(r => r.reservation_id === s.id),
  }));
}

/** Séjours du client connecté (les règles d'accès limitent aux siens). */
export async function listMyStays(userId: string): Promise<StayBundle[]> {
  const { data, error } = await db.from('public_reservations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return attach((data as StayRow[]) || []);
}

/** Séjours des biens d'un propriétaire. */
export async function listOwnerStays(propertyIds: string[]): Promise<StayBundle[]> {
  if (propertyIds.length === 0) return [];
  const { data, error } = await db.from('public_reservations').select('*').in('property_id', propertyIds).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return attach((data as StayRow[]) || []);
}

/** Tous les séjours (administration). */
export async function listAllStays(limit = 300): Promise<StayBundle[]> {
  const { data, error } = await db.from('public_reservations').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return attach((data as StayRow[]) || []);
}

export async function getReceipt(id: string): Promise<ReceiptRow | null> {
  const { data, error } = await db.from('receipts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ReceiptRow) ?? null;
}

export async function getReceiptVersions(reservationId: string, kind: string): Promise<ReceiptRow[]> {
  const { data } = await db.from('receipts').select('*').eq('reservation_id', reservationId).eq('kind', kind).order('version', { ascending: false });
  return (data as ReceiptRow[]) || [];
}

// ───────── Réglages administrables ─────────
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await db.from('platform_settings').select('value').eq('key', key).maybeSingle();
  return (data?.value ?? fallback) as T;
}

export async function saveSetting(key: string, value: unknown) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await db.from('platform_settings').upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user?.id ?? null });
  if (error) throw new Error(error.message);
}

export function subscribeStays(key: string, onChange: () => void) {
  const ch = supabase
    .channel(`stays-${key}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'public_reservations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
