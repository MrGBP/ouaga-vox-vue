import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, Home, User as UserIcon, RefreshCw } from 'lucide-react';
import AdminPageHeader from '@/admin/components/AdminPageHeader';

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RoleRow { user_id: string; role: 'admin' | 'owner' | 'user' }

interface UserAggregate {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  isAdmin: boolean;
  isOwner: boolean;
  propertyCount: number;
  reservationCount: number;
  favoriteCount: number;
  totalViews: number;
}

export default function AdminUsersLive() {
  const [users, setUsers] = useState<UserAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'owners' | 'tenants' | 'admins'>('all');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: roles }, { data: properties }, { data: reservations }, { data: favorites }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('properties').select('id, owner_id, view_count'),
        supabase.from('reservations').select('id, user_id'),
        supabase.from('favorites').select('id, user_id'),
      ]);

      const rolesByUser = new Map<string, Set<string>>();
      (roles ?? []).forEach((r: RoleRow) => {
        if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
        rolesByUser.get(r.user_id)!.add(r.role);
      });

      const propsByOwner = new Map<string, { count: number; views: number }>();
      (properties ?? []).forEach((p: any) => {
        if (!p.owner_id) return;
        const cur = propsByOwner.get(p.owner_id) ?? { count: 0, views: 0 };
        cur.count += 1;
        cur.views += p.view_count ?? 0;
        propsByOwner.set(p.owner_id, cur);
      });

      const resByUser = new Map<string, number>();
      (reservations ?? []).forEach((r: any) => {
        if (!r.user_id) return;
        resByUser.set(r.user_id, (resByUser.get(r.user_id) ?? 0) + 1);
      });

      const favByUser = new Map<string, number>();
      (favorites ?? []).forEach((f: any) => {
        if (!f.user_id) return;
        favByUser.set(f.user_id, (favByUser.get(f.user_id) ?? 0) + 1);
      });

      const aggregated: UserAggregate[] = (profiles ?? []).map((p: ProfileRow) => {
        const rs = rolesByUser.get(p.id) ?? new Set();
        const op = propsByOwner.get(p.id) ?? { count: 0, views: 0 };
        return {
          id: p.id,
          name: p.full_name || 'Sans nom',
          phone: p.phone || '—',
          createdAt: p.created_at,
          isAdmin: rs.has('admin'),
          isOwner: rs.has('owner'),
          propertyCount: op.count,
          totalViews: op.views,
          reservationCount: resByUser.get(p.id) ?? 0,
          favoriteCount: favByUser.get(p.id) ?? 0,
        };
      });

      setUsers(aggregated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel('admin-users-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    let l = users;
    if (tab === 'owners') l = l.filter(u => u.isOwner);
    else if (tab === 'admins') l = l.filter(u => u.isAdmin);
    else if (tab === 'tenants') l = l.filter(u => !u.isOwner && !u.isAdmin);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(u => u.name.toLowerCase().includes(s) || u.phone.toLowerCase().includes(s));
    }
    return l;
  }, [users, tab, q]);

  const counts = useMemo(() => ({
    all: users.length,
    owners: users.filter(u => u.isOwner).length,
    tenants: users.filter(u => !u.isOwner && !u.isAdmin).length,
    admins: users.filter(u => u.isAdmin).length,
  }), [users]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <AdminPageHeader title="Utilisateurs (production)" subtitle={`${counts.all} comptes inscrits · données live`} />
        <button onClick={load} className="h-9 px-3 rounded-lg bg-card border border-border text-xs flex items-center gap-1.5 hover:bg-muted">
          <RefreshCw size={13} /> Rafraîchir
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'owners', 'tenants', 'admins'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}
          >
            {t === 'all' && `Tous (${counts.all})`}
            {t === 'owners' && `Propriétaires (${counts.owners})`}
            {t === 'tenants' && `Locataires (${counts.tenants})`}
            {t === 'admins' && `Admins (${counts.admins})`}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher nom ou téléphone..."
            className="h-9 w-64 pl-9 pr-3 rounded-lg bg-card border border-border text-xs"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Rôles</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Biens</th>
              <th className="px-4 py-3">Vues</th>
              <th className="px-4 py-3">Réservations</th>
              <th className="px-4 py-3">Favoris</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Chargement…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Aucun utilisateur</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#1a3560' }}>
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.phone}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {u.isAdmin && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700"><Shield size={10} /> Admin</span>}
                    {u.isOwner && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700"><Home size={10} /> Propriétaire</span>}
                    {!u.isAdmin && !u.isOwner && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600"><UserIcon size={10} /> Locataire</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{u.propertyCount}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.totalViews}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.reservationCount}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.favoriteCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
