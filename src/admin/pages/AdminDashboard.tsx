import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Eye, Calendar, TrendingUp, Heart, Clock, MessageSquare, AlertTriangle, Check, X, Users, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminKPICard from '@/admin/components/AdminKPICard';
import { supabase } from '@/integrations/supabase/client';
import { adminSetStatus } from '@/lib/propertiesService';
import { isMockEnabled } from '@/lib/mockMode';

type DashStats = {
  total_properties: number;
  published: number;
  pending: number;
  paused: number;
  total_reservations: number;
  pending_reservations: number;
  confirmed_this_month: number;
  total_users: number;
  new_users_this_week: number;
};

type PendingRow = {
  id: string; title: string; type: string; quartier: string | null; city: string | null;
  country: string | null; price: number; created_at: string; owner_id: string | null;
};

type ResRow = {
  id: string; status: string; check_in: string | null; check_out: string | null;
  total_price: number | null; created_at: string; user_name: string | null;
  properties: { title: string | null; quartier: string | null } | null;
};

type FeedItem = { id: string; type: 'new_reservation' | 'new_property' | 'status_change'; text: string; time: string };

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [reservations, setReservations] = useState<ResRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, resRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.from('properties')
          .select('id, title, type, quartier, city, country, price, created_at, owner_id')
          .eq('admin_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('reservations')
          .select('id, status, check_in, check_out, total_price, created_at, user_name, properties(title, quartier)')
          .order('created_at', { ascending: false })
          .limit(15),
      ]);
      if (statsRes.error) throw statsRes.error;
      setStats(statsRes.data as unknown as DashStats);
      setPending((pendingRes.data ?? []) as PendingRow[]);
      setReservations((resRes.data ?? []) as ResRow[]);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur chargement dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Realtime feed
  useEffect(() => {
    const ch = supabase
      .channel('admin-live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (p) => {
        setFeed(prev => [{
          id: (p.new as any).id,
          type: 'new_reservation',
          text: `Nouvelle réservation reçue`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }, ...prev].slice(0, 20));
        load();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'properties' }, (p) => {
        setFeed(prev => [{
          id: (p.new as any).id,
          type: 'new_property',
          text: `Nouveau bien soumis : « ${(p.new as any).title ?? '—'} »`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }, ...prev].slice(0, 20));
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const decide = async (id: string, status: 'published' | 'rejected' | 'corrections') => {
    setBusyId(id);
    try {
      await adminSetStatus(id, status);
      toast.success(status === 'published' ? 'Bien publié' : status === 'rejected' ? 'Bien rejeté' : 'Corrections demandées');
      setPending(prev => prev.filter(p => p.id !== id));
      load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusyId(null); }
  };

  const reservationsByStatus = useMemo(() => {
    const buckets: Record<string, ResRow[]> = { pending: [], confirmed: [], in_progress: [], completed: [], cancelled: [] };
    reservations.forEach(r => { (buckets[r.status] ?? (buckets[r.status] = [])).push(r); });
    return buckets;
  }, [reservations]);

  if (loading && !stats) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const s = stats ?? { total_properties: 0, published: 0, pending: 0, paused: 0, total_reservations: 0, pending_reservations: 0, confirmed_this_month: 0, total_users: 0, new_users_this_week: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <AdminPageHeader title="Tableau de bord" subtitle="Données temps réel · Lovable Cloud" />
        <button onClick={load} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
        </button>
      </div>

      {isMockEnabled() && (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-xs px-3 py-2">
          ⚠ Mode démo (MOCK_MODE) actif — certains composants affichent des données simulées.
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Biens publiés" value={s.published} icon={Home} iconBg="#dcfce7" iconColor="#15803d" delta={`${s.total_properties} au total`} deltaColor="green" />
        <AdminKPICard title="À valider" value={s.pending} icon={Clock} iconBg={s.pending > 0 ? '#fef3c7' : '#f1f5f9'} iconColor={s.pending > 0 ? '#d97706' : '#64748b'} />
        <AdminKPICard title="Réservations actives" value={s.total_reservations} icon={Calendar} iconBg="#dbeafe" iconColor="#1d4ed8" delta={`${s.pending_reservations} en attente`} deltaColor="orange" />
        <AdminKPICard title="Utilisateurs" value={s.total_users} icon={Users} iconBg="#fce7f3" iconColor="#be185d" delta={`+${s.new_users_this_week} cette semaine`} deltaColor="green" />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Confirmées ce mois" value={s.confirmed_this_month} icon={Check} iconBg="#dcfce7" iconColor="#15803d" />
        <AdminKPICard title="En pause" value={s.paused} icon={AlertTriangle} iconBg="#f1f5f9" iconColor="#64748b" />
        <AdminKPICard title="Messages" value={0} icon={MessageSquare} iconBg="#dbeafe" iconColor="#2563eb" />
        <AdminKPICard title="Activité live" value={feed.length} icon={TrendingUp} iconBg="#fef3c7" iconColor="#d97706" />
      </div>

      {/* Activité live + à valider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activité en direct</h3>
          <div className="max-h-72 overflow-y-auto">
            {feed.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">En attente d'événements temps réel…</p>
            ) : feed.map(f => (
              <div key={f.id + f.time} className="flex items-start gap-3 py-2 border-b last:border-b-0 border-gray-100">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  {f.type === 'new_reservation' ? <Calendar size={14} /> : <Home size={14} />}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-gray-800">{f.text}</p>
                  <p className="text-[11px] text-gray-400">{f.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">À valider</h3>
            {s.pending > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">{s.pending}</span>
            )}
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium">Aucun bien en attente</p>
              <p className="text-xs">Tous les biens soumis ont été traités.</p>
            </div>
          ) : (
            <div>
              {pending.map((p, idx) => (
                <div key={p.id} className={`flex items-center gap-3 py-2.5 ${idx < pending.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Home size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">{[p.quartier, p.city].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button disabled={busyId === p.id} onClick={() => decide(p.id, 'published')} title="Publier" className="h-7 w-7 flex items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"><Check size={14} /></button>
                    <button disabled={busyId === p.id} onClick={() => decide(p.id, 'corrections')} title="Demander corrections" className="h-7 w-7 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50"><AlertTriangle size={14} /></button>
                    <button disabled={busyId === p.id} onClick={() => decide(p.id, 'rejected')} title="Rejeter" className="h-7 w-7 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/moderation" className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block font-medium">
            Voir toute la modération →
          </Link>
        </div>
      </div>

      {/* Réservations récentes — kanban condensé */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Réservations récentes</h3>
        {reservations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Aucune réservation pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['pending', 'confirmed', 'completed'] as const).map(col => (
              <div key={col}>
                <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
                  {col === 'pending' ? '⏳ En attente' : col === 'confirmed' ? '✅ Confirmées' : '🏁 Terminées'}
                  <span className="ml-1 text-gray-400">({reservationsByStatus[col]?.length ?? 0})</span>
                </div>
                <div className="space-y-1.5">
                  {(reservationsByStatus[col] ?? []).slice(0, 5).map(r => (
                    <div key={r.id} className="text-xs border border-gray-200 rounded-md p-2">
                      <div className="font-medium truncate">{r.properties?.title ?? '—'}</div>
                      <div className="text-gray-500">{r.user_name ?? 'Client'} · {r.check_in?.slice(0, 10) ?? '—'} → {r.check_out?.slice(0, 10) ?? '—'}</div>
                    </div>
                  ))}
                  {(reservationsByStatus[col] ?? []).length === 0 && (
                    <p className="text-[11px] text-gray-400 italic">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
