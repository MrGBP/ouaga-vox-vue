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
    .insert({ ...input, status: 'confirmed' })
    .select()
    .single();
  return { row: (data as any) ?? null, error };
}
