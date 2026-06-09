import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, Loader2, Plus, ExternalLink, Trash2, Pencil, Pause, Play, CalendarOff, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyProperties, ADMIN_STATUS_LABEL, ownerSetPause, ownerResubmitForReview, type OwnerPropertyRow } from '../lib/ownerService';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import OwnerPropertyFormModal from '../components/OwnerPropertyFormModal';
import BlockedDatesModal from '../components/BlockedDatesModal';
import PropertyImage from '@/components/PropertyImage';
import { isTypeFurnished } from '@/lib/mockData';

export default function OwnerProperties() {
  const { user } = useAuth();
  const [items, setItems] = useState<OwnerPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerPropertyRow | null>(null);
  const [blockedFor, setBlockedFor] = useState<OwnerPropertyRow | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const reload = () => {
    if (!user) return;
    setLoading(true);
    fetchMyProperties(user.id)
      .then(setItems)
      .catch(e => toast.error(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [user]);

  // Auto-open the create modal when arriving with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const onDelete = async (p: OwnerPropertyRow) => {
    if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    try {
      const { error } = await supabase.from('properties').delete().eq('id', p.id);
      if (error) throw error;
      setItems(prev => prev.filter(x => x.id !== p.id));
      toast.success('Bien supprimé');
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  const togglePause = async (p: OwnerPropertyRow) => {
    if (!user) return;
    const wantPause = p.admin_status === 'published';
    try {
      await ownerSetPause(p.id, user.id, wantPause);
      toast.success(wantPause ? 'Bien mis en pause (masqué des recherches)' : 'Bien réactivé');
      setItems(prev => prev.map(x => x.id === p.id ? { ...x, admin_status: wantPause ? 'paused' : 'published' } : x));
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: OwnerPropertyRow) => { setEditing(p); setModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mes biens</h2>
          <p className="text-sm text-muted-foreground">Gère tes annonces et leurs statistiques.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Publier un bien
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">Tu n'as encore aucun bien publié.</p>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Publier mon premier bien
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(p => (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                <PropertyImage src={p.images?.[0]} alt={p.title}
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
                <div className="mt-1.5 text-[10px] text-muted-foreground space-y-0.5">
                  <div>Soumis : {new Date(p.owner_updated_at ?? p.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  {p.reviewed_at && (
                    <div className={p.admin_status === 'published' ? 'text-green-700' : p.admin_status === 'rejected' ? 'text-red-700' : ''}>
                      Examiné par l'admin : {new Date(p.reviewed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                  {p.admin_status === 'published' && (
                    <Link to={`/property/${p.id}`} target="_blank" className="flex-1 min-w-[80px]">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                        <ExternalLink className="h-3 w-3" /> Voir
                      </Button>
                    </Link>
                  )}
                  {(p.admin_status === 'published' || p.admin_status === 'paused') && (
                    <Button size="sm" variant="outline" className="flex-1 min-w-[90px] text-xs gap-1.5" onClick={() => togglePause(p)}>
                      {p.admin_status === 'published'
                        ? <><Pause className="h-3 w-3" /> Pause</>
                        : <><Play className="h-3 w-3" /> Réactiver</>}
                    </Button>
                  )}
                  {p.admin_status === 'published' && isTypeFurnished(p.type) && (
                    <Button size="sm" variant="outline" className="flex-1 min-w-[90px] text-xs gap-1.5" onClick={() => setBlockedFor(p)} title="Bloquer des dates">
                      <CalendarOff className="h-3 w-3" /> Calendrier
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1 min-w-[90px] text-xs gap-1.5" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(p)} title="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {user && (
        <OwnerPropertyFormModal
          open={modalOpen}
          initial={editing}
          ownerId={user.id}
          onClose={(didChange) => {
            setModalOpen(false);
            setEditing(null);
            if (didChange) reload();
          }}
        />
      )}
      {user && blockedFor && (
        <BlockedDatesModal
          open={!!blockedFor}
          propertyId={blockedFor.id}
          propertyTitle={blockedFor.title}
          ownerId={user.id}
          onClose={() => setBlockedFor(null)}
        />
      )}
    </div>
  );
}
