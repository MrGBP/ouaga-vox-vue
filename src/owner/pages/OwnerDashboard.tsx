import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Home, Loader2, Calendar, Plus, ArrowRight, AlertCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchOwnerStats, fetchMyProperties, fetchMyPropertyReservations,
  ADMIN_STATUS_LABEL, type OwnerStats, type OwnerPropertyRow,
} from '../lib/ownerService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type PropPerf = OwnerPropertyRow & { reservationCount: number; pendingCount: number };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [perf, setPerf] = useState<PropPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [s, props, { reservations }] = await Promise.all([
          fetchOwnerStats(user.id),
          fetchMyProperties(user.id),
          fetchMyPropertyReservations(user.id),
        ]);
        setStats(s);
        const merged: PropPerf[] = props.map(p => {
          const propRes = (reservations as any[]).filter(r => r.property_id === p.id);
          return {
            ...p,
            reservationCount: propRes.length,
            pendingCount: propRes.filter(r => r.status === 'pending').length,
          };
        });
        setPerf(merged);
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur');
      } finally { setLoading(false); }
    })();
  }, [user]);

  const topProps = useMemo(
    () => [...perf].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5),
    [perf]
  );
  const maxViews = Math.max(1, ...perf.map(p => p.view_count ?? 0));
  const maxFavs = Math.max(1, ...perf.map(p => p.favorite_count ?? 0));
  const maxRes = Math.max(1, ...perf.map(p => p.reservationCount));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Bonjour 👋</h2>
          <p className="text-sm text-muted-foreground">Voici un aperçu de votre activité.</p>
        </div>
        <Link to="/proprietaire/biens?new=1">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Publier un bien
          </Button>
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Home className="h-4 w-4" />} label="Mes biens" value={stats?.totalProperties ?? 0} hint={`${stats?.publishedProperties ?? 0} publié(s)`} />
        <KPI icon={<Eye className="h-4 w-4" />} label="Vues totales" value={stats?.totalViews ?? 0} hint="tous biens" />
        <KPI icon={<Heart className="h-4 w-4" />} label="Favoris" value={stats?.totalFavorites ?? 0} hint="tous biens" />
        <KPI icon={<Calendar className="h-4 w-4" />} label="En attente" value={stats?.pendingReservations ?? 0} hint="demandes à traiter" highlight={(stats?.pendingReservations ?? 0) > 0} />
      </div>

      {/* Pending validation banner */}
      {stats && stats.pendingProperties > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-amber-900">{stats.pendingProperties} bien(s) en attente de validation</p>
              <p className="text-xs text-amber-800 mt-0.5">Nos équipes les vérifient. Tu seras notifié dès leur publication.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Performance par bien (mini barres) */}
      {perf.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" /> Performance par bien
            </h3>
          </div>
          <Card className="p-3 space-y-3">
            {perf.map(p => (
              <div key={p.id} className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium truncate flex-1 mr-2">{p.title}</span>
                  <Badge variant="outline" className={`${ADMIN_STATUS_LABEL[p.admin_status].color} text-[10px]`}>
                    {ADMIN_STATUS_LABEL[p.admin_status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Bar icon={<Eye className="h-3 w-3" />} label="Vues" value={p.view_count ?? 0} max={maxViews} color="bg-primary" />
                  <Bar icon={<Heart className="h-3 w-3" />} label="Favoris" value={p.favorite_count ?? 0} max={maxFavs} color="bg-pink-500" />
                  <Bar icon={<Calendar className="h-3 w-3" />} label="Demandes" value={p.reservationCount} max={maxRes} color="bg-amber-500" highlight={p.pendingCount > 0 ? `${p.pendingCount} en attente` : undefined} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Top properties by views */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Biens les plus vus</h3>
          <Link to="/proprietaire/biens" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {topProps.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Aucun bien pour le moment. <Link to="/proprietaire/biens?new=1" className="text-primary underline">Publier mon premier bien</Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {topProps.map(p => (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <img src={p.images?.[0] ?? '/placeholder.svg'} alt={p.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{p.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{p.quartier} · {p.type}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={ADMIN_STATUS_LABEL[p.admin_status].color}>
                    {ADMIN_STATUS_LABEL[p.admin_status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.view_count ?? 0}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, hint, highlight }: { icon: React.ReactNode; label: string; value: number | string; hint?: string; highlight?: boolean }) {
  return (
    <Card className={`p-3 ${highlight ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </Card>
  );
}

function Bar({ icon, label, value, max, color, highlight }: {
  icon: React.ReactNode; label: string; value: number; max: number; color: string; highlight?: string;
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-muted-foreground w-20 shrink-0">{icon}{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-semibold tabular-nums w-8 text-right">{value}</span>
      {highlight && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">{highlight}</span>}
    </div>
  );
}
