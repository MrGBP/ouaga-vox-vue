import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Eye, Heart, Calendar, TrendingUp, AlertCircle, BarChart3,
  CheckCircle2, Clock, XCircle, Wallet, Home,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchMyProperties, fetchMyPropertyReservations,
  ADMIN_STATUS_LABEL, type OwnerPropertyRow,
} from '../lib/ownerService';
import { useCountryConfig } from '@/hooks/useCountryConfig';

type Reservation = {
  id: string;
  property_id: string;
  status: string;
  total_price: number | null;
  start_date: string | null;
  end_date: string | null;
  kind?: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  published: '#16a34a',
  pending: '#f59e0b',
  reviewing: '#3b82f6',
  corrections: '#f97316',
  rejected: '#dc2626',
  rented: '#64748b',
  paused: '#71717a',
  inactive: '#71717a',
};

const RES_STATUS_COLORS: Record<string, string> = {
  confirmed: '#16a34a',
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#0ea5e9',
  cancelled: '#dc2626',
};

const RES_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmées',
  in_progress: 'En cours',
  completed: 'Terminées',
  cancelled: 'Annulées',
};

const fmtMoney = (n: number, cur: string) =>
  `${Math.round(n).toLocaleString('fr-FR')} ${cur}`;

const dayKey = (iso: string) => iso.slice(0, 10);

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const country = useCountryConfig();
  const cur = country.currency_symbol || 'FCFA';
  // Le propriétaire conserve 100 - commission % du chiffre d'affaires confirmé
  const commissionRate = Number(country.commission_rate ?? 6);
  const ownerShare = Math.max(0, 100 - commissionRate) / 100;

  const [loading, setLoading] = useState(true);
  const [props, setProps] = useState<OwnerPropertyRow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [p, { reservations: r }] = await Promise.all([
          fetchMyProperties(user.id),
          fetchMyPropertyReservations(user.id),
        ]);
        setProps(p);
        setReservations((r ?? []) as Reservation[]);
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur de chargement');
      } finally { setLoading(false); }
    })();
  }, [user]);

  // ─── KPI ────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalViews = props.reduce((s, p) => s + (p.view_count ?? 0), 0);
    const totalFavs = props.reduce((s, p) => s + (p.favorite_count ?? 0), 0);
    const totalRes = reservations.length;
    const confirmed = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed');
    const revenueGross = confirmed.reduce((s, r) => s + (Number(r.total_price) || 0), 0);
    const conv = totalViews > 0 ? (totalRes / totalViews) * 100 : 0;
    return {
      totalViews, totalFavs, totalRes,
      confirmedCount: confirmed.length,
      pendingCount: reservations.filter(r => r.status === 'pending').length,
      revenueGross,
      revenueOwner: revenueGross * ownerShare,
      conversionPct: conv,
    };
  }, [props, reservations, ownerShare]);

  // ─── Statut des biens (donut) ───────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    props.forEach(p => { map[p.admin_status] = (map[p.admin_status] ?? 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({
      name: ADMIN_STATUS_LABEL[k as keyof typeof ADMIN_STATUS_LABEL]?.label ?? k,
      value: v,
      color: STATUS_COLORS[k] ?? '#94a3b8',
    }));
  }, [props]);

  // ─── Top biens (vues / favoris / revenus) ───────────────────────────────
  const topByViews = useMemo(
    () => [...props].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5),
    [props]
  );
  const revenuePerProperty = useMemo(() => {
    const map: Record<string, number> = {};
    reservations.forEach(r => {
      if (r.status !== 'confirmed' && r.status !== 'completed') return;
      map[r.property_id] = (map[r.property_id] ?? 0) + (Number(r.total_price) || 0);
    });
    return props
      .map(p => ({
        id: p.id,
        title: p.title,
        revenue: map[p.id] ?? 0,
        ownerRevenue: (map[p.id] ?? 0) * ownerShare,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [reservations, props, ownerShare]);

  // ─── Évolution des réservations (line chart sur range jours) ────────────
  const series = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const buckets: { date: string; label: string; count: number; revenue: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      buckets.push({
        date: k,
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count: 0, revenue: 0,
      });
    }
    const idx = Object.fromEntries(buckets.map((b, i) => [b.date, i]));
    reservations.forEach(r => {
      const k = dayKey(r.created_at);
      const i = idx[k];
      if (i === undefined) return;
      buckets[i].count++;
      if (r.status === 'confirmed' || r.status === 'completed') {
        buckets[i].revenue += Number(r.total_price) || 0;
      }
    });
    return buckets;
  }, [reservations, range]);

  // ─── Statut des réservations ────────────────────────────────────────────
  const reservationStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    reservations.forEach(r => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({
      name: RES_STATUS_LABELS[k] ?? k,
      value: v,
      color: RES_STATUS_COLORS[k] ?? '#94a3b8',
    }));
  }, [reservations]);

  // ─── Actions recommandées ───────────────────────────────────────────────
  const actions = useMemo(() => {
    const out: { id: string; severity: 'warn' | 'info'; text: string; href: string }[] = [];
    props.forEach(p => {
      if (p.admin_status === 'corrections') {
        out.push({
          id: `corr-${p.id}`, severity: 'warn',
          text: `« ${p.title} » : corrections à apporter avant publication.`,
          href: '/proprietaire/biens',
        });
      }
      if (p.admin_status === 'published' && (p.view_count ?? 0) === 0) {
        out.push({
          id: `noview-${p.id}`, severity: 'info',
          text: `« ${p.title} » n'a encore aucune vue : enrichis les photos et la description.`,
          href: '/proprietaire/biens',
        });
      }
    });
    if (kpi.pendingCount > 0) {
      out.push({
        id: 'pending-res', severity: 'warn',
        text: `${kpi.pendingCount} demande${kpi.pendingCount > 1 ? 's' : ''} de réservation en attente de ta réponse.`,
        href: '/proprietaire/reservations',
      });
    }
    return out.slice(0, 5);
  }, [props, kpi]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analyses
          </h1>
          <p className="text-sm text-muted-foreground">
            Mesure la performance de tes biens et tes revenus nets ({100 - commissionRate}% après commission).
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d as 7 | 30 | 90)}
              className={`px-3 h-8 text-xs font-semibold rounded-md transition ${
                range === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >{d} j</button>
          ))}
        </div>
      </div>

      {/* État vide */}
      {props.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <Home className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Tu n'as encore aucun bien publié — les analyses apparaîtront ici.</p>
          <Link to="/proprietaire/biens">
            <Button>Ajouter mon premier bien</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi icon={<Eye size={16} />} label="Vues totales" value={kpi.totalViews.toLocaleString('fr-FR')} />
            <Kpi icon={<Heart size={16} />} label="Favoris" value={kpi.totalFavs.toLocaleString('fr-FR')} />
            <Kpi icon={<Calendar size={16} />} label="Réservations" value={kpi.totalRes.toLocaleString('fr-FR')}
                 sub={`${kpi.pendingCount} en attente`} />
            <Kpi icon={<CheckCircle2 size={16} />} label="Confirmées" value={kpi.confirmedCount.toLocaleString('fr-FR')} />
            <Kpi icon={<TrendingUp size={16} />} label="Conversion" value={`${kpi.conversionPct.toFixed(2)}%`}
                 sub="vues → demandes" />
            <Kpi icon={<Wallet size={16} />} label="Revenu net" value={fmtMoney(kpi.revenueOwner, cur)}
                 sub={`Brut : ${fmtMoney(kpi.revenueGross, cur)}`} />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Évolution */}
            <Card className="p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">Évolution des réservations · {range} derniers jours</h2>
                <span className="text-[11px] text-muted-foreground">Demandes & revenu confirmé</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(range / 10))} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      formatter={(v: any, name: any) =>
                        name === 'revenue' ? [fmtMoney(Number(v), cur), 'Revenu'] : [v, 'Demandes']
                      }
                    />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Statut des biens */}
            <Card className="p-4">
              <h2 className="text-sm font-bold mb-3">Statut de mon portefeuille</h2>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {statusBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                {statusBreakdown.map(s => (
                  <span key={s.name} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </Card>

            {/* Top biens par vues */}
            <Card className="p-4 lg:col-span-2">
              <h2 className="text-sm font-bold mb-3">Top 5 biens par vues</h2>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={topByViews.map(p => ({
                    name: p.title.length > 22 ? p.title.slice(0, 20) + '…' : p.title,
                    vues: p.view_count ?? 0,
                    favoris: p.favorite_count ?? 0,
                  }))} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Bar dataKey="vues" fill="#3b82f6" />
                    <Bar dataKey="favoris" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Statut des réservations */}
            <Card className="p-4">
              <h2 className="text-sm font-bold mb-3">Statut des réservations</h2>
              {reservationStatusData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">Aucune réservation pour l'instant.</p>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={reservationStatusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                          {reservationStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                    {reservationStatusData.map(s => (
                      <span key={s.name} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.name} ({s.value})
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Top revenus + actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-sm font-bold mb-3">Top 5 biens par revenu (confirmé)</h2>
              {revenuePerProperty.every(r => r.revenue === 0) ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Aucun revenu confirmé pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {revenuePerProperty.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-xs border-b border-border/60 last:border-0 pb-2 last:pb-0">
                      <span className="truncate flex-1">{r.title}</span>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{fmtMoney(r.ownerRevenue, cur)}</p>
                        <p className="text-[10px] text-muted-foreground">brut {fmtMoney(r.revenue, cur)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" /> Actions recommandées
              </h2>
              {actions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Tout est à jour 👌</p>
              ) : (
                <ul className="space-y-2">
                  {actions.map(a => (
                    <li key={a.id}>
                      <Link
                        to={a.href}
                        className={`flex items-start gap-2 rounded-lg p-2.5 text-xs border transition ${
                          a.severity === 'warn'
                            ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                            : 'border-border bg-muted/40 hover:bg-muted text-foreground'
                        }`}
                      >
                        {a.severity === 'warn' ? <Clock size={13} className="mt-0.5 shrink-0" /> : <Eye size={13} className="mt-0.5 shrink-0" />}
                        <span>{a.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Détail par bien */}
          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">Détail par bien</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Bien</th>
                    <th className="text-left p-2">Statut</th>
                    <th className="text-right p-2">Vues</th>
                    <th className="text-right p-2">Favoris</th>
                    <th className="text-right p-2">Réservations</th>
                    <th className="text-right p-2">Revenu net</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map(p => {
                    const propRes = reservations.filter(r => r.property_id === p.id);
                    const propRevenue = propRes
                      .filter(r => r.status === 'confirmed' || r.status === 'completed')
                      .reduce((s, r) => s + (Number(r.total_price) || 0), 0);
                    const meta = ADMIN_STATUS_LABEL[p.admin_status];
                    return (
                      <tr key={p.id} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="p-2 font-medium truncate max-w-[260px]">{p.title}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={meta?.color}>{meta?.label ?? p.admin_status}</Badge>
                        </td>
                        <td className="p-2 text-right">{(p.view_count ?? 0).toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-right">{(p.favorite_count ?? 0).toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-right">{propRes.length}</td>
                        <td className="p-2 text-right font-semibold">{fmtMoney(propRevenue * ownerShare, cur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <p className="text-lg font-bold leading-tight mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}
