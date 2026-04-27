import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Check, X, Database } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  fetchAllPropertiesAdmin, adminCreateProperty, adminUpdateProperty,
  adminDeleteProperty, adminSetStatus,
} from '@/lib/propertiesService';
import { mockQuartiers, PROPERTY_TYPES, type Property } from '@/lib/mockData';
import MapPicker from '@/admin/components/MapPicker';
import MediaUploader from '@/admin/components/MediaUploader';

// All toggleable feature checkboxes (cocher à souhait)
const FEATURE_DEFS: { key: string; label: string; group: string }[] = [
  { key: 'has_ac', label: 'Climatisation', group: 'Confort' },
  { key: 'has_water', label: 'Eau courante', group: 'Confort' },
  { key: 'has_water_tower', label: 'Château d\'eau', group: 'Confort' },
  { key: 'has_internet', label: 'Internet/Fibre', group: 'Confort' },
  { key: 'has_kitchen', label: 'Cuisine équipée', group: 'Confort' },
  { key: 'has_fridge', label: 'Frigo', group: 'Confort' },
  { key: 'has_stove', label: 'Cuisinière', group: 'Confort' },
  { key: 'has_tv', label: 'TV', group: 'Confort' },
  { key: 'has_generator', label: 'Groupe électrogène', group: 'Énergie' },
  { key: 'has_guardian', label: 'Vigile / Gardien', group: 'Sécurité' },
  { key: 'has_fence', label: 'Clôture', group: 'Sécurité' },
  { key: 'has_auto_gate', label: 'Portail auto', group: 'Sécurité' },
  { key: 'has_cameras', label: 'Caméras', group: 'Sécurité' },
  { key: 'has_parking_int', label: 'Parking intérieur', group: 'Extérieur' },
  { key: 'has_parking_ext', label: 'Parking extérieur', group: 'Extérieur' },
  { key: 'has_garden', label: 'Jardin', group: 'Extérieur' },
  { key: 'has_pool', label: 'Piscine', group: 'Extérieur' },
  { key: 'has_terrace', label: 'Terrasse', group: 'Extérieur' },
  { key: 'has_paved_road', label: 'Voie pavée', group: 'Accès' },
  { key: 'has_pmr', label: 'Accessible PMR', group: 'Accès' },
  { key: 'is_new_build', label: 'Construction neuve', group: 'État' },
  { key: 'is_renovated', label: 'Rénové', group: 'État' },
  { key: 'pets_allowed', label: 'Animaux acceptés', group: 'Règles' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'reviewing', label: 'En révision' },
  { value: 'published', label: 'Publié' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'rented', label: 'Loué' },
  { value: 'inactive', label: 'Inactif' },
];

const propertySchema = z.object({
  title: z.string().trim().min(3, 'Titre trop court').max(120),
  description: z.string().max(2000).optional(),
  type: z.string().min(1),
  price: z.number().positive('Prix doit être > 0'),
  quartier: z.string().min(1),
  address: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type FormState = {
  id?: string; title: string; description: string; type: string; price: number;
  quartier: string; address: string; latitude: number; longitude: number;
  bedrooms: number; bathrooms: number; surface_area: number; furnished: boolean;
  year_built?: number; video_url?: string; virtual_tour_url?: string;
  agent_name?: string; agent_phone?: string;
  admin_status: string;
  features: Record<string, boolean>;
};

const emptyForm = (): FormState => ({
  title: '', description: '', type: PROPERTY_TYPES[0].value, price: 0,
  quartier: mockQuartiers[0].name, address: '',
  latitude: 12.3714, longitude: -1.5197,
  bedrooms: 1, bathrooms: 1, surface_area: 50, furnished: false,
  admin_status: 'pending', features: {},
});

export default function AdminBiensLive() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormState | null>(null);

  const reload = async () => {
    setLoading(true);
    try { setItems(await fetchAllPropertiesAdmin()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const startEdit = (p: Property) => {
    setEditing({
      id: p.id, title: p.title, description: p.description || '',
      type: p.type, price: p.price, quartier: p.quartier, address: p.address,
      latitude: p.latitude, longitude: p.longitude,
      bedrooms: p.bedrooms ?? 1, bathrooms: p.bathrooms ?? 1, surface_area: p.surface_area ?? 50,
      furnished: !!p.furnished, year_built: p.year_built, video_url: p.video_url,
      virtual_tour_url: p.virtual_tour_url, agent_name: p.agent_name, agent_phone: p.agent_phone,
      admin_status: (p as any).admin_status ?? 'pending',
      features: Object.fromEntries(FEATURE_DEFS.map(f => [f.key, !!(p as any)[f.key]])),
    });
  };

  const save = async () => {
    if (!editing) return;
    const parsed = propertySchema.safeParse(editing);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      const payload: any = { ...editing };
      delete payload.id;
      if (editing.id) {
        await adminUpdateProperty(editing.id, payload);
        toast.success('Bien mis à jour');
      } else {
        const created = await adminCreateProperty(payload);
        toast.success('Bien créé — tu peux maintenant ajouter les médias');
        setEditing({ ...editing, id: created.id });
        await reload();
        return;
      }
      setEditing(null);
      await reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (p: Property) => {
    if (!confirm(`Supprimer "${p.title}" ?`)) return;
    try { await adminDeleteProperty(p.id); toast.success('Supprimé'); await reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const setStatus = async (p: Property, status: any) => {
    try { await adminSetStatus(p.id, status); toast.success('Statut mis à jour'); await reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Database size={20} /> Biens (production)</h1>
          <p className="text-xs text-muted-foreground">Connecté à la base — création, médias, géolocalisation réels.</p>
        </div>
        <button onClick={() => setEditing(emptyForm())}
          className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
          <Plus size={14} /> Nouveau bien
        </button>
      </div>

      {loading ? <p className="text-xs text-muted-foreground">Chargement…</p> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2.5">Titre</th>
                <th className="text-left p-2.5">Quartier</th>
                <th className="text-right p-2.5">Prix</th>
                <th className="text-left p-2.5">Statut</th>
                <th className="text-right p-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun bien en base. Crée le premier !</td></tr>
              )}
              {items.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/40">
                  <td className="p-2.5 font-medium">{p.title}</td>
                  <td className="p-2.5 text-muted-foreground">{p.quartier}</td>
                  <td className="p-2.5 text-right">{p.price.toLocaleString('fr-FR')} F</td>
                  <td className="p-2.5">
                    <select value={(p as any).admin_status ?? 'pending'} onChange={e => setStatus(p, e.target.value)}
                      className="rounded border border-border bg-background px-1.5 py-1 text-[11px]">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-muted"><Edit size={13} /></button>
                      <button onClick={() => remove(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <FormModal state={editing} setState={setEditing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ─── Form modal ────────────────────────────────────────────────────────────
function FormModal({
  state, setState, onSave, onClose,
}: { state: FormState; setState: (s: FormState) => void; onSave: () => void; onClose: () => void }) {
  const set = (patch: Partial<FormState>) => setState({ ...state, ...patch });
  const setFeature = (k: string, v: boolean) => set({ features: { ...state.features, [k]: v } });
  const groups = Array.from(new Set(FEATURE_DEFS.map(f => f.group)));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b z-10">
          <h2 className="text-sm font-bold">{state.id ? 'Modifier le bien' : 'Nouveau bien'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <Field label="Titre *">
            <input value={state.title} onChange={e => set({ title: e.target.value })} className="form-input" />
          </Field>
          <Field label="Description">
            <textarea value={state.description} onChange={e => set({ description: e.target.value })} rows={3} className="form-input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type *">
              <select value={state.type} onChange={e => set({ type: e.target.value, furnished: PROPERTY_TYPES.find(t => t.value === e.target.value)?.furnished ?? false })} className="form-input">
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </Field>
            <Field label="Prix (FCFA) *">
              <input type="number" value={state.price || ''} onChange={e => set({ price: Number(e.target.value) })} className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quartier *">
              <select value={state.quartier} onChange={e => set({ quartier: e.target.value })} className="form-input">
                {mockQuartiers.map(q => <option key={q.id} value={q.name}>{q.name}</option>)}
              </select>
            </Field>
            <Field label="Adresse *">
              <input value={state.address} onChange={e => set({ address: e.target.value })} className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Chambres"><input type="number" min={0} value={state.bedrooms} onChange={e => set({ bedrooms: Number(e.target.value) })} className="form-input" /></Field>
            <Field label="SDB"><input type="number" min={0} value={state.bathrooms} onChange={e => set({ bathrooms: Number(e.target.value) })} className="form-input" /></Field>
            <Field label="Surface (m²)"><input type="number" min={0} value={state.surface_area} onChange={e => set({ surface_area: Number(e.target.value) })} className="form-input" /></Field>
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <label className="font-semibold">Localisation (clic sur la carte) *</label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input type="number" step="0.000001" value={state.latitude} onChange={e => set({ latitude: Number(e.target.value) })} className="form-input" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="0.000001" value={state.longitude} onChange={e => set({ longitude: Number(e.target.value) })} className="form-input" />
              </Field>
            </div>
            <MapPicker lat={state.latitude} lng={state.longitude} onChange={(lat, lng) => set({ latitude: lat, longitude: lng })} />
          </div>

          {/* Caractéristiques */}
          <div className="space-y-2">
            <label className="font-semibold">Caractéristiques (cocher à souhait)</label>
            {groups.map(g => (
              <div key={g} className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{g}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {FEATURE_DEFS.filter(f => f.group === g).map(f => (
                    <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border cursor-pointer hover:bg-muted">
                      <input type="checkbox" checked={!!state.features[f.key]} onChange={e => setFeature(f.key, e.target.checked)} />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Médias liés */}
          <div className="space-y-2">
            <label className="font-semibold">Médias (images, vidéos, 360°)</label>
            {state.id ? (
              <MediaUploader propertyId={state.id} />
            ) : (
              <p className="text-[11px] text-muted-foreground italic">Enregistre d'abord le bien pour activer l'upload de médias.</p>
            )}
          </div>

          {/* Statut */}
          <Field label="Statut">
            <select value={state.admin_status} onChange={e => set({ admin_status: e.target.value })} className="form-input">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="sticky bottom-0 bg-card border-t flex gap-2 p-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold">Fermer</button>
          <button onClick={onSave} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
            <Check size={14} /> {state.id ? 'Enregistrer' : 'Créer le bien'}
          </button>
        </div>
      </div>
      <style>{`.form-input{display:block;width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none}.form-input:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block font-semibold mb-1">{label}</label>{children}</div>;
}
