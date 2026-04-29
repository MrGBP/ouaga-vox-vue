import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { mockQuartiers, PROPERTY_TYPES } from '@/lib/mockData';
import { FEATURE_CATALOG, FEATURE_CATEGORIES, type FeatureCategoryId } from '@/lib/featureCatalog';
import { supabase } from '@/integrations/supabase/client';
import MapPicker from '@/admin/components/MapPicker';
import MediaUploader from '@/admin/components/MediaUploader';
import { Loader2 } from 'lucide-react';
import type { OwnerPropertyRow } from '../lib/ownerService';

interface Props {
  open: boolean;
  initial?: OwnerPropertyRow | null;
  ownerId: string;
  onClose: (didChange: boolean) => void;
}

export default function OwnerPropertyFormModal({ open, initial, ownerId, onClose }: Props) {
  const isEdit = !!initial;
  const [savedId, setSavedId] = useState<string | null>(null); // id du bien après save => active uploader

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0].value);
  const [price, setPrice] = useState<number | ''>('');
  const [quartier, setQuartier] = useState(mockQuartiers[0]?.name || '');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>(1);
  const [bathrooms, setBathrooms] = useState<number | ''>(1);
  const [surface, setSurface] = useState<number | ''>(50);
  const [furnished, setFurnished] = useState(false);
  const [lat, setLat] = useState<number>(12.3714);
  const [lng, setLng] = useState<number>(-1.5197);
  const [features, setFeatures] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState<FeatureCategoryId>(FEATURE_CATEGORIES[0].id);
  const [busy, setBusy] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      // Charger les détails complets depuis Supabase pour edit
      (async () => {
        const { data } = await supabase.from('properties').select('*').eq('id', initial.id).single();
        if (data) {
          setTitle(data.title); setDescription(data.description ?? '');
          setType(data.type); setPrice(Number(data.price));
          setQuartier(data.quartier); setAddress(data.address ?? '');
          setBedrooms(data.bedrooms ?? 1); setBathrooms(data.bathrooms ?? 1);
          setSurface(data.surface_area ?? 50); setFurnished(!!data.furnished);
          setLat(Number(data.latitude)); setLng(Number(data.longitude));
          const f = data.features ?? {};
          const active = FEATURE_CATALOG.filter(c => f[c.key]).map(c => c.key);
          setFeatures(active);
          setCustomFeatures(Array.isArray(f.__custom) ? f.__custom : []);
          setSavedId(initial.id);
        }
      })();
    } else {
      setTitle(''); setDescription(''); setType(PROPERTY_TYPES[0].value);
      setPrice(''); setQuartier(mockQuartiers[0]?.name || '');
      setAddress(''); setBedrooms(1); setBathrooms(1); setSurface(50);
      setFurnished(false); setLat(12.3714); setLng(-1.5197);
      setFeatures([]); setCustomFeatures([]); setSavedId(null);
    }
    setCustomInput('');
    setActiveCat(FEATURE_CATEGORIES[0].id);
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [open, initial]);

  const featuresByCat = useMemo(() => {
    const map: Record<string, typeof FEATURE_CATALOG> = {};
    FEATURE_CATEGORIES.forEach(c => { map[c.id] = []; });
    FEATURE_CATALOG.forEach(f => { map[f.category].push(f); });
    return map;
  }, []);

  const toggleFeature = (key: string) =>
    setFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (customFeatures.some(c => c.toLowerCase() === v.toLowerCase())) { toast.error('Déjà ajoutée'); return; }
    setCustomFeatures(prev => [...prev, v]); setCustomInput('');
  };

  const removeCustom = (idx: number) => setCustomFeatures(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Le titre est requis');
    if (!price || Number(price) <= 0) return toast.error('Le prix doit être supérieur à 0');
    if (!quartier) return toast.error('Quartier requis');

    setBusy(true);
    try {
      // Construire le jsonb features (flags + custom)
      const featuresObj: Record<string, any> = {};
      features.forEach(k => { featuresObj[k] = true; });
      if (customFeatures.length) featuresObj.__custom = customFeatures;

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        price: Number(price),
        quartier,
        address: address.trim() || quartier,
        latitude: lat,
        longitude: lng,
        bedrooms: Number(bedrooms) || null,
        bathrooms: Number(bathrooms) || null,
        surface_area: Number(surface) || null,
        furnished,
        features: featuresObj,
        owner_id: ownerId,
      };

      if (isEdit && initial) {
        // Si le propriétaire modifie un bien refusé/à corriger, on le repasse en 'pending' pour re-modération
        const willRequireReview = ['rejected', 'corrections'].includes(initial.admin_status);
        const updatePayload: any = { ...payload };
        if (willRequireReview) updatePayload.admin_status = 'pending';

        const { error } = await supabase.from('properties').update(updatePayload).eq('id', initial.id);
        if (error) throw error;
        toast.success(willRequireReview ? 'Bien renvoyé en validation' : 'Bien mis à jour');
        setSavedId(initial.id);
      } else {
        // Création : toujours 'pending' (un propriétaire ne peut PAS publier directement)
        const { data, error } = await supabase
          .from('properties')
          .insert({ ...payload, admin_status: 'pending' as any, status: 'available' })
          .select('id')
          .single();
        if (error) throw error;
        toast.success('Bien créé. En attente de validation.');
        setSavedId(data.id);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-3" onClick={() => onClose(!!savedId)}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b z-10">
          <div>
            <h2 className="text-base font-bold text-foreground">{isEdit ? 'Modifier le bien' : 'Nouveau bien'}</h2>
            {!isEdit && (
              <p className="text-[11px] text-muted-foreground mt-0.5">Sera soumis à validation par l'administration.</p>
            )}
          </div>
          <button onClick={() => onClose(!!savedId)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Titre *">
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Villa moderne à Tampouy" />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-input resize-none" placeholder="Décris ton bien…" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type *">
              <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </Field>
            <Field label="Prix (FCFA) *">
              <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder="150000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quartier *">
              <select value={quartier} onChange={e => setQuartier(e.target.value)} className="form-input">
                {mockQuartiers.map(q => <option key={q.id} value={q.name}>{q.name}</option>)}
              </select>
            </Field>
            <Field label="Adresse">
              <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder="Rue, secteur…" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Chambres">
              <input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
            </Field>
            <Field label="SDB">
              <input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
            </Field>
            <Field label="Surface (m²)">
              <input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} className="accent-primary h-4 w-4" />
            <span>Bien meublé (location courte durée possible)</span>
          </label>

          {/* Localisation */}
          <Field label="Localisation sur la carte (clique ou déplace le marqueur)">
            <MapPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} height={240} />
            <p className="text-[10px] text-muted-foreground mt-1">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
          </Field>

          {/* Caractéristiques */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Caractéristiques ({features.length + customFeatures.length})
            </label>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {FEATURE_CATEGORIES.map(cat => {
                const count = featuresByCat[cat.id].filter(f => features.includes(f.key)).length;
                const isActive = activeCat === cat.id;
                return (
                  <button key={cat.id} type="button" onClick={() => setActiveCat(cat.id)}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 h-8 text-xs font-medium transition ${
                      isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'
                    }`}>
                    <span>{cat.emoji}</span><span>{cat.label}</span>
                    {count > 0 && <span className={`ml-1 rounded-full px-1.5 text-[10px] ${isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-2 bg-muted/30">
              {featuresByCat[activeCat].map(f => {
                const checked = features.includes(f.key);
                return (
                  <label key={f.key}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer border transition ${
                      checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'
                    }`}>
                    <input type="checkbox" className="accent-primary" checked={checked} onChange={() => toggleFeature(f.key)} />
                    <span aria-hidden>{f.emoji}</span>
                    <span className="truncate">{f.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                className="form-input" placeholder="Caractéristique personnalisée…" />
              <button type="button" onClick={addCustom} className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                <Plus size={14} /> Ajouter
              </button>
            </div>
            {customFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customFeatures.map((c, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs">
                    ✨ {c}
                    <button type="button" onClick={() => removeCustom(idx)} className="ml-1 hover:text-primary/70"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Médias — uniquement après que le bien a un id */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-foreground">Médias (photos, vidéos, visite 360°)</label>
            {savedId ? (
              <MediaUploader propertyId={savedId} />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Enregistre d'abord le bien pour pouvoir ajouter des photos/vidéos/visites 360°.
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <button type="button" onClick={() => onClose(!!savedId)} className="flex-1 h-10 rounded-lg border text-xs font-semibold hover:bg-muted">
              {savedId ? 'Fermer' : 'Annuler'}
            </button>
            <button type="submit" disabled={busy} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {savedId ? 'Mettre à jour' : 'Enregistrer le bien'}
            </button>
          </div>
        </form>

        <style>{`.form-input{display:block;width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none;transition:border-color .15s}.form-input:focus{border-color:hsl(var(--primary))}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
