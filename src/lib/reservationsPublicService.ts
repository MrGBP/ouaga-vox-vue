import { supabase } from '@/integrations/supabase/client';

export interface PublicReservationInput {
  property_id: string;
  property_title: string;
  property_quartier: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  message?: string | null;
  check_in: string; // YYYY-MM-DD
  check_out: string;
  nights: number;
  guests_count: number;
  price_per_night: number;
  total_price: number;
}

export interface PublicReservationRow extends PublicReservationInput {
  id: string;
  confirmation_number: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

/** Récupère les dates réservées via RPC sécurisée (ne renvoie que les dates, pas de PII). */
export async function getReservedDates(propertyId: string): Promise<{ check_in: string; check_out: string }[]> {
  const { data, error } = await (supabase as any)
    .rpc('get_reserved_dates', { _property_id: propertyId });
  if (error) {
    console.warn('[getReservedDates] error', error);
    return [];
  }
  return (data as any) || [];
}

/** Étend en un Set<YYYY-MM-DD> de toutes les nuits réservées (check_in inclus, check_out exclu). */
export function expandReservedNights(rows: { check_in: string; check_out: string }[]): Set<string> {
  const set = new Set<string>();
  for (const r of rows) {
    const start = new Date(r.check_in + 'T00:00:00');
    const end = new Date(r.check_out + 'T00:00:00');
    const cur = new Date(start);
    while (cur < end) {
      set.add(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

export async function createPublicReservation(input: PublicReservationInput): Promise<{ row: PublicReservationRow | null; error: any }> {
  const { data, error } = await supabase
    .from('public_reservations' as any)
    .insert({ ...input, status: 'pending' })
    .select()
    .single();
  return { row: (data as any) ?? null, error };
}

// ───────── Calendrier & réservations temporaires (vérifiés côté serveur) ─────────

export type OccupancyState = 'awaiting_payment' | 'awaiting_owner' | 'confirmed' | 'external' | 'maintenance' | 'cleaning';

export interface OccupancyRange {
  date_from: string; // inclus
  date_to: string;   // exclu (jour de départ)
  state: OccupancyState;
  source_id: string | null;
}

export const OCCUPANCY_LEGEND: Array<{ state: OccupancyState | 'available'; label: string; className: string }> = [
  { state: 'available', label: 'Disponible', className: 'bg-card border border-border' },
  { state: 'awaiting_payment', label: 'En attente de paiement', className: 'bg-secondary/25 border border-secondary/50' },
  { state: 'awaiting_owner', label: 'Payé · attente propriétaire', className: 'bg-secondary/60' },
  { state: 'confirmed', label: 'Réservation confirmée', className: 'bg-primary' },
  { state: 'external', label: 'Indisponibilité externe', className: 'bg-muted-foreground/40' },
  { state: 'maintenance', label: 'Maintenance / entretien', className: 'bg-destructive/40' },
  { state: 'cleaning', label: 'Nettoyage / transition', className: 'bg-accent border border-border' },
];

export async function getCalendarOccupancy(propertyId: string): Promise<OccupancyRange[]> {
  const { data, error } = await (supabase as any).rpc('get_calendar_occupancy', { _property_id: propertyId });
  if (error) { console.warn('[getCalendarOccupancy]', error); return []; }
  return (data as OccupancyRange[]) || [];
}

/** Map YYYY-MM-DD (nuit) → état. */
export function occupancyByNight(rows: OccupancyRange[]): Map<string, OccupancyState> {
  const map = new Map<string, OccupancyState>();
  for (const r of rows) {
    const cur = new Date(r.date_from + 'T00:00:00');
    const end = new Date(r.date_to + 'T00:00:00');
    while (cur < end) {
      const y = cur.getFullYear(), m = String(cur.getMonth() + 1).padStart(2, '0'), d = String(cur.getDate()).padStart(2, '0');
      const k = `${y}-${m}-${d}`;
      if (!map.has(k) || r.state === 'confirmed') map.set(k, r.state);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

export interface StayQuote {
  base_per_night: number;
  nights: number;
  subtotal: number;
  discount: number;
  total: number;
  detail: Array<{ date: string; price: number; base: number; rule: string | null; label: string | null }>;
}

export async function quoteStay(propertyId: string, checkIn: string, checkOut: string): Promise<StayQuote | null> {
  const { data, error } = await (supabase as any).rpc('quote_stay', { _property_id: propertyId, _check_in: checkIn, _check_out: checkOut });
  if (error) { console.warn('[quoteStay]', error); return null; }
  return data as StayQuote;
}

export async function checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc('check_availability', { _property_id: propertyId, _check_in: checkIn, _check_out: checkOut });
  if (error) return false;
  return !!data;
}

export async function createReservationHold(args: {
  propertyId: string; checkIn: string; checkOut: string; guests: number; name: string; phone: string; message?: string | null;
}): Promise<{ row: (PublicReservationRow & { hold_expires_at: string; price_snapshot: StayQuote }) | null; error: any }> {
  const { data, error } = await (supabase as any).rpc('create_reservation_hold', {
    _property_id: args.propertyId, _check_in: args.checkIn, _check_out: args.checkOut,
    _guests: args.guests, _name: args.name, _phone: args.phone, _message: args.message ?? null,
  });
  return { row: data ?? null, error };
}

export async function availablePropertyIds(checkIn: string, checkOut: string): Promise<Set<string> | null> {
  const { data, error } = await (supabase as any).rpc('available_property_ids', { _check_in: checkIn, _check_out: checkOut });
  if (error) return null;
  return new Set(((data as any[]) || []).map((x: any) => (typeof x === 'string' ? x : x.available_property_ids)));
}
