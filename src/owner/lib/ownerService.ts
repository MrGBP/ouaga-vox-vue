// Owner-side data service. Relies on RLS: an authenticated owner sees only their own rows.
import { supabase } from '@/integrations/supabase/client';

export type OwnerPropertyRow = {
  id: string;
  title: string;
  type: string;
  quartier: string;
  address: string;
  price: number;
  images: string[] | null;
  admin_status: 'pending' | 'reviewing' | 'corrections' | 'published' | 'rejected' | 'rented' | 'inactive';
  status: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
  published_at: string | null;
};

export async function fetchMyProperties(userId: string): Promise<OwnerPropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id,title,type,quartier,address,price,images,admin_status,status,view_count,favorite_count,created_at,published_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerPropertyRow[];
}

export async function fetchMyPropertyReservations(userId: string) {
  // RLS already restricts to reservations on properties the user owns,
  // but we filter explicitly to avoid mixing with personal reservations.
  const { data: props, error: pErr } = await supabase
    .from('properties').select('id,title').eq('owner_id', userId);
  if (pErr) throw pErr;
  const ids = (props ?? []).map(p => p.id);
  if (ids.length === 0) return { reservations: [], propertyTitleById: {} as Record<string, string> };

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .in('property_id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const propertyTitleById = Object.fromEntries((props ?? []).map(p => [p.id, p.title]));
  return { reservations: data ?? [], propertyTitleById };
}

export type OwnerStats = {
  totalProperties: number;
  publishedProperties: number;
  pendingProperties: number;
  totalViews: number;
  totalFavorites: number;
  pendingReservations: number;
  upcomingVisits: number;
};

export async function fetchOwnerStats(userId: string): Promise<OwnerStats> {
  const props = await fetchMyProperties(userId);
  const { reservations } = await fetchMyPropertyReservations(userId);

  const now = new Date();
  return {
    totalProperties: props.length,
    publishedProperties: props.filter(p => p.admin_status === 'published').length,
    pendingProperties: props.filter(p => p.admin_status === 'pending' || p.admin_status === 'reviewing' || p.admin_status === 'corrections').length,
    totalViews: props.reduce((s, p) => s + (p.view_count ?? 0), 0),
    totalFavorites: props.reduce((s, p) => s + (p.favorite_count ?? 0), 0),
    pendingReservations: reservations.filter((r: any) => r.status === 'pending').length,
    upcomingVisits: reservations.filter((r: any) =>
      r.kind === 'visit' && r.visit_at && new Date(r.visit_at) >= now && r.status !== 'cancelled'
    ).length,
  };
}

export const ADMIN_STATUS_LABEL: Record<OwnerPropertyRow['admin_status'], { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  reviewing: { label: 'En revue', color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  corrections: { label: 'À corriger', color: 'bg-orange-500/10 text-orange-700 border-orange-500/30' },
  published: { label: 'Publié', color: 'bg-green-500/10 text-green-700 border-green-500/30' },
  rejected: { label: 'Refusé', color: 'bg-red-500/10 text-red-700 border-red-500/30' },
  rented: { label: 'Loué', color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  inactive: { label: 'Inactif', color: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
};
