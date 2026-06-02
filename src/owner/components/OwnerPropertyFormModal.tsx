import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Upload, Link2, Trash2, Image as ImageIcon, Video, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { mockQuartiers, PROPERTY_TYPES } from '@/lib/mockData';
import { FEATURE_CATALOG, FEATURE_CATEGORIES, type FeatureCategoryId } from '@/lib/featureCatalog';
import { supabase } from '@/integrations/supabase/client';
import MapPicker from '@/admin/components/MapPicker';
import MediaUploader from '@/admin/components/MediaUploader';
import { uploadPropertyMedia, addPropertyMediaUrl, listPropertyMedia } from '@/lib/propertiesService';
import { Loader2 } from 'lucide-react';
import type { OwnerPropertyRow } from '../lib/ownerService';

type PendingMedia =
  | { kind: 'image' | 'video'; source: 'file'; file: File; previewUrl: string }
  | { kind: 'image' | 'video' | 'video_360'; source: 'url'; url: string };

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

  // Médias en attente (création) + compteur médias existants (édition)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [pendingUrl, setPendingUrl] = useState('');
  const [pendingKind, setPendingKind] = useState<'image' | 'video' | 'video_360'>('image');
  const [existingMediaCount, setExistingMediaCount] = useState(0);
  const pendingFileRef = useRef<HTMLInputElement>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Reset médias en attente à chaque ouverture
    setPendingMedia(prev => { prev.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl)); return []; });
    setPendingUrl(''); setPendingKind('image'); setExistingMediaCount(0);

    if (initial) {
      (async () => {
        const { data } = await supabase.from('properties').select('*').eq('id', initial.id).single();
        if (data) {
          setTitle(data.title); setDescription(data.description ?? '');
          setType(data.type); setPrice(Number(data.price));
          setQuartier(data.quartier); setAddress(data.address ?? '');
          setBedrooms(data.bedrooms ?? 1); setBathrooms(data.bathrooms ?? 1);
          setSurface(data.surface_area ?? 50); setFurnished(!!data.furnished);
          setLat(Number(data.latitude)); setLng(Number(data.longitude));
          const f: Record<string, any> = (data.features ?? {}) as Record<string, any>;
          const active = FEATURE_CATALOG.filter(c => f[c.key]).map(c => c.key);
          setFeatures(active);
          setCustomFeatures(Array.isArray(f.__custom) ? (f.__custom as string[]) : []);
          setSavedId(initial.id);
        }
        const media = await listPropertyMedia(initial.id).catch(() => []);
        setExistingMediaCount(media?.length ?? 0);
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

  const addPendingFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingMedia[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 20_000_000) { toast.error(`${file.name} dépasse 20 Mo`); return; }
      const k: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      next.push({ kind: k, source: 'file', file, previewUrl: URL.createObjectURL(file) });
    });
    if (next.length) setPendingMedia(prev => [...prev, ...next]);
  };

  const addPendingUrl = () => {
    const u = pendingUrl.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) { toast.error('URL invalide (http/https requis)'); return; }
    setPendingMedia(prev => [...prev, { kind: pendingKind, source: 'url', url: u }]);
    setPendingUrl('');
  };

  const removePending = (idx: number) => {
    setPendingMedia(prev => {
      const item = prev[idx];
      if (item?.source === 'file') URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

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
    if (description.trim().length < 20) return toast.error('La description est requise (20 caractères minimum)');
    if (!price || Number(price) <= 0) return toast.error('Le prix doit être supérieur à 0');
    if (!quartier) return toast.error('Quartier requis');

    // Au moins 1 média : pending + existants
    const totalMedia = pendingMedia.length + (isEdit ? existingMediaCount : 0);
    if (totalMedia < 1) {
      return toast.error('Ajoute au moins 1 média (photo, vidéo ou visite 360°) avant de continuer');
    }

    setBusy(true);
    let createdPropertyId: string | null = null;
    try {
      const featuresObj: Record<string, any> = {};
      features.forEach(k => { featuresObj[k] = true; });
      if (customFeatures.length) featuresObj.__custom = customFeatures;

      const payload = {
        title: title.trim(),
        description: description.trim(),
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

      let propertyId: string;
      let willRequireReview = false;

      if (isEdit && initial) {
        willRequireReview = ['rejected', 'corrections'].includes(initial.admin_status);
        const updatePayload: any = { ...payload, owner_updated_at: new Date().toISOString() };
        if (willRequireReview) updatePayload.admin_status = 'pending';
        const { data: updated, error } = await supabase
          .from('properties')
          .update(updatePayload)
          .eq('id', initial.id)
          .select('id');
        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error("Mise à jour refusée : vous n'êtes pas propriétaire de ce bien.");
        }
        propertyId = initial.id;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert({ ...payload, admin_status: 'pending' as any, status: 'available', owner_updated_at: new Date().toISOString() })
          .select('id')
          .single();
        if (error) throw error;
        propertyId = data.id;
        createdPropertyId = propertyId;
      }


      // Upload atomique des médias en attente
      if (pendingMedia.length) {
        const failures: string[] = [];
        let uploaded = 0;
        for (const m of pendingMedia) {
          try {
            if (m.source === 'file') {
              await uploadPropertyMedia(propertyId, m.file, m.kind);
            } else {
              await addPropertyMediaUrl(propertyId, m.url, m.kind);
            }
            uploaded++;
          } catch (err: any) {
            failures.push(err?.message ?? 'erreur inconnue');
          }
        }

        // Si rien n'a été uploadé pour une création vierge => rollback
        if (uploaded === 0 && (isEdit ? existingMediaCount : 0) === 0) {
          if (createdPropertyId) {
            await supabase.from('properties').delete().eq('id', createdPropertyId);
          }
          throw new Error(`Aucun média n'a pu être uploadé : ${failures[0] ?? 'erreur inconnue'}. Le bien n'a pas été enregistré.`);
        }

        if (failures.length) {
          toast.warning(`${uploaded}/${pendingMedia.length} médias uploadés. ${failures.length} en échec : ${failures[0]}`);
        }

        pendingMedia.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl));
        setPendingMedia([]);
      }

      toast.success(
        isEdit
          ? (willRequireReview ? 'Bien renvoyé en validation' : 'Bien mis à jour')
          : 'Bien créé. En attente de validation.'
      );
      // Fermeture automatique — pas de 2e étape
      onClose(true);
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

          <Field label="Description *">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              minLength={20}
              required
              className="form-input resize-none"
              placeholder="Décris ton bien (min. 20 caractères)…"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{description.trim().length} / 20 caractères minimum</p>
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

          {/* Médias — toujours disponibles, requis avant validation */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-foreground">
              Médias * (photos, vidéos, visite 360°) — au moins 1 requis
            </label>

            {/* Médias déjà uploadés (édition) */}
            {savedId && <MediaUploader propertyId={savedId} />}

            {/* Staging : pré-upload avant la création */}
            {!savedId && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => pendingFileRef.current?.click()}
                    className="flex-1 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-2 text-xs hover:bg-muted"
                  >
                    <Upload size={14} /> Choisir photos / vidéos (multi)
                  </button>
                  <input
                    ref={pendingFileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={e => { addPendingFiles(e.target.files); if (pendingFileRef.current) pendingFileRef.current.value = ''; }}
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={pendingKind}
                    onChange={e => setPendingKind(e.target.value as any)}
                    className="rounded-lg border border-border bg-background px-2 text-xs"
                  >
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                    <option value="video_360">Visite 360°</option>
                  </select>
                  <div className="relative flex-1">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={pendingUrl}
                      onChange={e => setPendingUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPendingUrl(); } }}
                      placeholder="https://… (Matterport, Kuula, YouTube, image…)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addPendingUrl}
                    className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                  >
                    Ajouter
                  </button>
                </div>

                {pendingMedia.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {pendingMedia.map((m, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        {m.kind === 'image' && m.source === 'file' ? (
                          <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : m.kind === 'image' && m.source === 'url' ? (
                          <img src={m.url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src='/placeholder.svg')} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground p-2 text-center">
                            {m.kind === 'video_360' ? <Globe size={22} /> : <Video size={22} />}
                            <span className="truncate mt-1 w-full text-[10px]">
                              {m.kind === 'video_360' ? '360°' : 'Vidéo'}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        >
                          <Trash2 size={11} />
                        </button>
                        <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          {m.kind === 'image' ? <><ImageIcon size={9}/> IMG</> : m.kind === 'video_360' ? <>🔭 360°</> : <><Video size={9}/> VIDEO</>}
                        </span>
                        <span className="absolute bottom-1 right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center py-3 rounded-lg border border-dashed">
                    Aucun média sélectionné — ajoute au moins 1 photo, vidéo ou visite 360°
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Les médias seront uploadés à l'enregistrement. Limite : 20 Mo par fichier.
                </p>
              </>
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
