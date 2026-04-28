import { supabase } from '@/integrations/supabase/client';

export type ReservationKind = 'visit' | 'booking' | 'rental_request';
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ReservationRow {
  id: string;
  property_id: string;
  user_id: string | null;
  kind: ReservationKind;
  status: ReservationStatus;
  start_date: string | null;
  end_date: string | null;
  visit_at: string | null;
  guests_count: number;
  total_price: number | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  message: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationInput {
  property_id: string;
  kind: ReservationKind;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null;
  visit_at?: string | null;   // ISO timestamptz
  guests_count?: number;
  total_price?: number | null;
  contact_name: string;
  contact_phone: string;
  contact_email?: string | null;
  message?: string | null;
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const KIND_LABELS: Record<ReservationKind, string> = {
  visit: 'Visite',
  booking: 'Court séjour',
  rental_request: 'Demande de location',
};

export const reservationStatusLabel = (s: ReservationStatus) => STATUS_LABELS[s] ?? s;
export const reservationKindLabel = (k: ReservationKind) => KIND_LABELS[k] ?? k;

/**
 * Create a new reservation. If the user is signed in, user_id is set to their id.
 * Guests can submit anonymously (user_id stays null).
 */
export async function createReservation(input: CreateReservationInput): Promise<ReservationRow> {
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    property_id: input.property_id,
    user_id: user?.id ?? null,
    kind: input.kind,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    visit_at: input.visit_at ?? null,
    guests_count: input.guests_count ?? 1,
    total_price: input.total_price ?? null,
    contact_name: input.contact_name.trim(),
    contact_phone: input.contact_phone.trim(),
    contact_email: input.contact_email?.trim() || null,
    message: input.message?.trim() || null,
  };

  const { data, error } = await supabase
    .from('reservations')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as ReservationRow;
}

/**
 * List reservations the current user can see (RLS handles filtering).
 * Returns user's own reservations + reservations on properties they own.
 */
export async function listMyReservations(): Promise<ReservationRow[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ReservationRow[];
}

/**
 * Admin/owner-only: update reservation status.
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  admin_notes?: string
): Promise<void> {
  const patch: Partial<ReservationRow> = { status };
  if (admin_notes !== undefined) patch.admin_notes = admin_notes;

  const { error } = await supabase
    .from('reservations')
    .update(patch)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Cancel own reservation.
 */
export async function cancelReservation(id: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Admin-only: delete a reservation.
 */
export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from('reservations').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Subscribe to realtime changes on reservations.
 * Returns an unsubscribe function.
 */
export function subscribeReservations(
  onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; row: ReservationRow }) => void
): () => void {
  const channel = supabase
    .channel('reservations-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      (payload) => {
        const row = (payload.new ?? payload.old) as ReservationRow;
        onChange({ type: payload.eventType as any, row });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
