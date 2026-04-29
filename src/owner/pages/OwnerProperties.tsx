import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, Loader2, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyProperties, ADMIN_STATUS_LABEL, type OwnerPropertyRow } from '../lib/ownerService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function OwnerProperties() {
  const { user } = useAuth();
  const [items, setItems] = useState<OwnerPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyProperties(user.id)
      .then(setItems)
      .catch(e => toast.error(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mes biens</h2>
          <p className="text-sm text-muted-foreground">Gère tes annonces et leurs statistiques.</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled title="Disponible à l'étape 4">
          <Plus className="h-4 w-4" /> Publier un bien
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">Tu n'as encore aucun bien publié.</p>
          <Button size="sm" className="gap-1.5" disabled title="Disponible à l'étape 4">
            <Plus className="h-4 w-4" /> Publier mon premier bien
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(p => (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                <img src={p.images?.[0] ?? '/placeholder.svg'} alt={p.title}
                  className="w-full h-full object-cover" />
                <Badge variant="outline" className={`absolute top-2 left-2 ${ADMIN_STATUS_LABEL[p.admin_status].color} backdrop-blur`}>
                  {ADMIN_STATUS_LABEL[p.admin_status].label}
                </Badge>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm truncate">{p.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.quartier} · {p.type}</p>
                <p className="text-sm font-bold text-primary mt-1">{Number(p.price).toLocaleString('fr-FR')} FCFA</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.view_count ?? 0}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.favorite_count ?? 0}</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {p.admin_status === 'published' && (
                    <Link to={`/property/${p.id}`} target="_blank" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                        <ExternalLink className="h-3 w-3" /> Voir
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" variant="outline" className="flex-1 text-xs" disabled title="Disponible à l'étape 4">
                    Modifier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
