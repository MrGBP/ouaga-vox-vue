import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Home, Loader2, Calendar, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchOwnerStats, fetchMyProperties, ADMIN_STATUS_LABEL, type OwnerStats, type OwnerPropertyRow } from '../lib/ownerService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [topProps, setTopProps] = useState<OwnerPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [s, props] = await Promise.all([
          fetchOwnerStats(user.id),
          fetchMyProperties(user.id),
        ]);
        setStats(s);
        setTopProps([...props].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5));
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur');
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Bonjour 👋</h2>
          <p className="text-sm text-muted-foreground">Voici un aperçu de votre activité.</p>
        </div>
        <Link to="/proprietaire/biens">
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
            Aucun bien pour le moment. <Link to="/proprietaire/biens" className="text-primary underline">Publier mon premier bien</Link>
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
