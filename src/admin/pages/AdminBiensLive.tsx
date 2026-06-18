import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Check, Database, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllPropertiesAdmin, adminDeleteProperty, adminSetStatus,
} from '@/lib/propertiesService';
import type { Property } from '@/lib/mockData';
import PropertyReviewPanel from '@/admin/components/PropertyReviewPanel';
import OwnerPropertyFormModal from '@/owner/components/OwnerPropertyFormModal';
import type { OwnerPropertyRow } from '@/owner/lib/ownerService';
import { useAuth } from '@/hooks/useAuth';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'reviewing', label: 'En révision' },
  { value: 'corrections', label: 'À corriger' },
  { value: 'published', label: 'Publié' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'paused', label: 'Suspendu' },
  { value: 'rented', label: 'Loué' },
  { value: 'inactive', label: 'Archivé' },
];

/**
 * Page admin "Biens (production)" — utilise désormais le formulaire complet du
 * propriétaire (wizard 4 étapes, médias, POI, OSM, IA…) en mode `adminMode` :
 *   • sélecteur du pays de publication (BF, GH, ML…)
 *   • statut initial direct (publié / en révision / en attente)
 *   • bypass de la case "informations exactes" (cocher reste possible)
 *   • le bien est rattaché au compte SapSapHouse connecté (owner_id = admin)
 */
export default function AdminBiensLive() {
  const { user } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OwnerPropertyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    try { setItems(await fetchAllPropertiesAdmin()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const startEdit = (p: Property) => {
    // OwnerPropertyFormModal recharge la fiche complète via supabase à l'ouverture.
    setEditing({
      id: p.id,
      title: p.title,
      type: p.type,
      quartier: p.quartier,
      address: p.address,
      price: p.price,
      images: p.images ?? [],
      admin_status: ((p as any).admin_status ?? 'pending') as any,
      status: (p as any).status ?? null,
      view_count: (p as any).view_count ?? 0,
      favorite_count: (p as any).favorite_count ?? 0,
      created_at: (p as any).created_at ?? new Date().toISOString(),
      published_at: (p as any).published_at ?? null,
      reviewed_at: (p as any).reviewed_at ?? null,
      owner_updated_at: (p as any).owner_updated_at ?? null,
      last_correction_note: (p as any).last_correction_note ?? null,
      last_correction_at: (p as any).last_correction_at ?? null,
      correction_round: (p as any).correction_round ?? 0,
    });
  };

  const remove = async (p: Property) => {
    if (!confirm(`Supprimer "${p.title}" ?`)) return;
    try { await adminDeleteProperty(p.id); toast.success('Supprimé'); await reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const applyStatus = async (p: Property) => {
    const target = pendingStatus[p.id] ?? ((p as any).admin_status ?? 'pending');
    try {
      await adminSetStatus(p.id, target as any);
      toast.success(`Statut → ${STATUS_OPTIONS.find(s => s.value === target)?.label ?? target}`);
      setPendingStatus(prev => { const n = { ...prev }; delete n[p.id]; return n; });
      await reload();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Database size={20} /> Biens (production)</h1>
          <p className="text-xs text-muted-foreground">
            Formulaire complet propriétaire + super-pouvoirs admin : publication directe dans n'importe quel pays.
          </p>
        </div>
        <button
          onClick={() => {
            if (!user?.id) { toast.error('Connecte-toi en tant qu\'admin pour publier un bien.'); return; }
            setCreating(true);
          }}
          className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} /> Nouveau bien
        </button>
      </div>

      {loading ? <p className="text-xs text-muted-foreground">Chargement…</p> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2.5">Titre</th>
                <th className="text-left p-2.5">Pays</th>
                <th className="text-left p-2.5">Quartier</th>
                <th className="text-right p-2.5">Prix</th>
                <th className="text-left p-2.5 min-w-[260px]">Statut → Appliquer</th>
                <th className="text-right p-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucun bien en base. Crée le premier !</td></tr>
              )}
              {items.map(p => {
                const current = (p as any).admin_status ?? 'pending';
                const selected = pendingStatus[p.id] ?? current;
                const dirty = selected !== current;
                const cc = ((p as any).country_code || (p as any).country || '—').toString().toUpperCase();
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/40">
                    <td className="p-2.5 font-medium">{p.title}</td>
                    <td className="p-2.5 text-muted-foreground">{cc}</td>
                    <td className="p-2.5 text-muted-foreground">{p.quartier}</td>
                    <td className="p-2.5 text-right">{p.price.toLocaleString('fr-FR')}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <select value={selected}
                          onChange={e => setPendingStatus(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="rounded border border-border bg-background px-1.5 py-1 text-[11px] flex-1">
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <button onClick={() => applyStatus(p)} disabled={!dirty}
                          className={`px-2 h-7 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                            dirty ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}>
                          <Check size={11} /> Appliquer
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => setReviewId(p.id)} title="Examiner"
                          className="px-2 h-7 rounded text-[11px] font-semibold border border-primary text-primary bg-primary/5 hover:bg-primary/10 flex items-center gap-1">
                          <Eye size={12} /> Examiner
                        </button>
                        <button onClick={() => startEdit(p)} title="Modifier" className="p-1.5 rounded hover:bg-muted"><Edit size={13} /></button>
                        <button onClick={() => remove(p)} title="Supprimer" className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire complet (mêmes capacités que le propriétaire + admin mode) */}
      {creating && user?.id && (
        <OwnerPropertyFormModal
          open={true}
          ownerId={user.id}
          adminMode
          onClose={(didChange) => { setCreating(false); if (didChange) reload(); }}
        />
      )}
      {editing && user?.id && (
        <OwnerPropertyFormModal
          open={true}
          ownerId={user.id}
          initial={editing}
          adminMode
          onClose={(didChange) => { setEditing(null); if (didChange) reload(); }}
        />
      )}

      {reviewId && (
        <PropertyReviewPanel propertyId={reviewId} onClose={() => setReviewId(null)} onChanged={reload} />
      )}
    </div>
  );
}
