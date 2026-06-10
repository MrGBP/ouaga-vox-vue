import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Upload, Link2, Trash2, Image as ImageIcon, Video, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RAW_MOCK_QUARTIERS as mockQuartiers, PROPERTY_TYPES, isTypeFurnished, getTypeLabel } from '@/lib/mockData';
import { FEATURE_CATALOG, FEATURE_CATEGORIES, featureLabel, categoryLabel, type FeatureCategoryId } from '@/lib/featureCatalog';
import { supabase } from '@/integrations/supabase/client';
import MapPicker from '@/admin/components/MapPicker';
import MediaUploader from '@/admin/components/MediaUploader';
import { uploadPropertyMedia, addPropertyMediaUrl, listPropertyMedia } from '@/lib/propertiesService';
import { Loader2 } from 'lucide-react';
import type { OwnerPropertyRow } from '../lib/ownerService';
import { isCommercialType, isOfficeType } from '@/lib/typeHelpers';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { useCountryConfig, useAllCountryConfigs } from '@/hooks/useCountryConfig';
import { CITIES, COUNTRY_TO_CITY } from '@/lib/geoConfig';
import QuartierAutocomplete from '@/components/QuartierAutocomplete';
import {
  POI_TYPES, poiLabel, addPoiToProperty, listPoisForProperty, removePoi, type PropertyPoi,
} from '@/lib/propertyPoisService';


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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const country = useCountryConfig();
  const { data: allCountries } = useAllCountryConfigs();
  const [selectedCountry, setSelectedCountry] = useState<string>(country.code || 'BF');
  const cur = (allCountries?.find(c => c.code === selectedCountry)?.currency_symbol) || country.currency_symbol;
  const isEdit = !!initial;

  useLockBackdrop(open);
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
  const [floor, setFloor] = useState<number | ''>(0);
  const [rooms, setRooms] = useState<number | ''>(3);
  const [capacity, setCapacity] = useState<number | ''>('');
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

  // POIs — au moins 1 requis avant publication
  const [existingPois, setExistingPois] = useState<PropertyPoi[]>([]);
  const [pendingPois, setPendingPois] = useState<{ name: string; type: string; distance_m?: number }[]>([]);
  const [poiName, setPoiName] = useState('');
  const [poiType, setPoiType] = useState<string>(POI_TYPES[0].value);
  const [poiDist, setPoiDist] = useState<number | ''>('');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPendingMedia(prev => { prev.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl)); return []; });
    setPendingUrl(''); setPendingKind('image'); setExistingMediaCount(0);
    setPendingPois([]); setExistingPois([]); setPoiName(''); setPoiType(POI_TYPES[0].value); setPoiDist('');

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
          if ((data as any).country_code) setSelectedCountry((data as any).country_code);
          const f: Record<string, any> = (data.features ?? {}) as Record<string, any>;
          const active = FEATURE_CATALOG.filter(c => f[c.key]).map(c => c.key);
          setFeatures(active);
          setCustomFeatures(Array.isArray(f.__custom) ? (f.__custom as string[]) : []);
          setFloor(typeof f.__floor === 'number' ? f.__floor : 0);
          setRooms(typeof f.__rooms === 'number' ? f.__rooms : 3);
          setCapacity(typeof f.__capacity === 'number' ? f.__capacity : '');
          setSavedId(initial.id);
        }
        const media = await listPropertyMedia(initial.id).catch(() => []);
        setExistingMediaCount(media?.length ?? 0);
        const pois = await listPoisForProperty(initial.id).catch(() => []);
        setExistingPois(pois);
      })();
    } else {
      const defaultCity = CITIES[COUNTRY_TO_CITY[country.code] ?? 'ouagadougou'] ?? CITIES.ouagadougou;
      setTitle(''); setDescription(''); setType(PROPERTY_TYPES[0].value);
      setPrice(''); setQuartier('');
      setAddress(''); setBedrooms(1); setBathrooms(1); setSurface(50);
      setFloor(0); setRooms(3); setCapacity('');
      setFurnished(false);
      setLat(defaultCity.center[0]); setLng(defaultCity.center[1]);
      setSelectedCountry(country.code || 'BF');
      setFeatures([]); setCustomFeatures([]); setSavedId(null);
    }

    setCustomInput('');
    setActiveCat(FEATURE_CATEGORIES[0].id);
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [open, initial]);

  const addPendingPoi = () => {
    const n = poiName.trim();
    if (!n) return toast.error(t('owner.form.err_poi_name'));
    setPendingPois(prev => [...prev, { name: n, type: poiType, distance_m: poiDist === '' ? undefined : Number(poiDist) }]);
    setPoiName(''); setPoiDist('');
  };
  const removePendingPoi = (idx: number) => setPendingPois(prev => prev.filter((_, i) => i !== idx));
  const removeExistingPoi = async (id: string) => {
    try { await removePoi(id); setExistingPois(prev => prev.filter(p => p.id !== id)); toast.success(t('owner.form.ok_poi_deleted')); }
    catch (e: any) { toast.error(e.message); }
  };

  const addPendingFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingMedia[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 20_000_000) { toast.error(t('owner.form.err_size', { name: file.name })); return; }
      const k: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      next.push({ kind: k, source: 'file', file, previewUrl: URL.createObjectURL(file) });
    });
    if (next.length) setPendingMedia(prev => [...prev, ...next]);
  };

  const addPendingUrl = () => {
    const u = pendingUrl.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) { toast.error(t('owner.form.err_url')); return; }
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
    if (customFeatures.some(c => c.toLowerCase() === v.toLowerCase())) { toast.error(t('owner.form.err_custom_dup')); return; }
    setCustomFeatures(prev => [...prev, v]); setCustomInput('');
  };

  const removeCustom = (idx: number) => setCustomFeatures(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error(t('owner.form.err_titre'));
    if (description.trim().length < 20) return toast.error(t('owner.form.err_desc'));
    if (!price || Number(price) <= 0) return toast.error(t('owner.form.err_prix'));
    if (!quartier) return toast.error(t('owner.form.err_quartier'));

    // Au moins 1 média : pending + existants
    const totalMedia = pendingMedia.length + (isEdit ? existingMediaCount : 0);
    if (totalMedia < 1) {
      return toast.error(t('owner.form.err_media'));
    }

    // Au moins 1 POI : pending + existants
    const totalPois = pendingPois.length + existingPois.length;
    if (totalPois < 1) {
      return toast.error(t('owner.form.err_poi'));
    }

    setBusy(true);
    let createdPropertyId: string | null = null;
    try {
      const featuresObj: Record<string, any> = {};
      features.forEach(k => { featuresObj[k] = true; });
      if (customFeatures.length) featuresObj.__custom = customFeatures;
      if (floor !== '') featuresObj.__floor = Number(floor);
      if (rooms !== '') featuresObj.__rooms = Number(rooms);
      if (capacity !== '') featuresObj.__capacity = Number(capacity);

      const commercial = isCommercialType(type);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        price: Number(price),
        quartier,
        address: address.trim() || quartier,
        latitude: lat,
        longitude: lng,
        bedrooms: commercial ? null : (Number(bedrooms) || null),
        bathrooms: commercial ? null : (Number(bathrooms) || null),
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

        if (uploaded === 0 && (isEdit ? existingMediaCount : 0) === 0) {
          if (createdPropertyId) await supabase.from('properties').delete().eq('id', createdPropertyId);
          throw new Error(`Aucun média n'a pu être uploadé : ${failures[0] ?? 'erreur inconnue'}. Le bien n'a pas été enregistré.`);
        }
        if (failures.length) {
          toast.warning(`${uploaded}/${pendingMedia.length} médias uploadés. ${failures.length} en échec : ${failures[0]}`);
        }
        pendingMedia.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl));
        setPendingMedia([]);
      }

      // Persistance des POIs en attente
      if (pendingPois.length) {
        for (const p of pendingPois) {
          try { await addPoiToProperty(propertyId, { name: p.name, type: p.type, quartier, distance_m: p.distance_m }); }
          catch (err: any) { console.warn('POI add failed', err); }
        }
        setPendingPois([]);
      }

      toast.success(
        isEdit
          ? (willRequireReview ? t('owner.form.ok_revalidate') : t('owner.form.ok_update'))
          : t('owner.form.ok_create')
      );
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
            <h2 className="text-base font-bold text-foreground">{isEdit ? t('owner.form.modifier') : t('owner.form.nouveau')}</h2>
            {!isEdit && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('owner.form.soumis')}</p>
            )}
          </div>
          <button onClick={() => onClose(!!savedId)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label={t('owner.form.titre')}>
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder={t('owner.form.titre_ph')} />
          </Field>

          <Field label={t('owner.form.description')}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              minLength={20}
              required
              className="form-input resize-none"
              placeholder={t('owner.form.description_ph')}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{t('owner.form.desc_count', { n: description.trim().length })}</p>
          </Field>

          {(() => {
            const commercial = isCommercialType(type);
            const isFurn = furnished || isTypeFurnished(type);
            const priceLabel = commercial ? t('owner.form.loyer_mensuel', { cur }) : isFurn ? t('owner.form.prix_nuit', { cur }) : t('owner.form.loyer_mensuel', { cur });
            const priceHint = commercial ? t('owner.form.hint_commercial') : isFurn ? t('owner.form.hint_nuit') : t('owner.form.hint_longue');
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('owner.form.type')}>
                    <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                      {PROPERTY_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.emoji} {getTypeLabel(pt.value, lang)}</option>)}
                    </select>
                  </Field>
                  <Field label={priceLabel}>
                    <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder="150000" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{priceHint}</p>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('owner.form.quartier')}</label>
                    <QuartierAutocomplete value={quartier} onChange={(q, loc) => { setQuartier(q); if (loc?.lat && loc?.lng) { setLat(loc.lat); setLng(loc.lng); } }} />
                  </div>
                  <Field label={t('owner.form.adresse')}>
                    <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder={t('owner.form.adresse_ph')} />
                  </Field>
                </div>

                {commercial ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label={isOfficeType(type) ? t('owner.form.nb_bureaux') : t('owner.form.nb_locaux')}>
                        <input type="number" min={0} value={rooms} onChange={e => setRooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.nb_pieces')}>
                        <input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.surface')}>
                        <input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('owner.form.etage')}>
                        <input type="number" min={0} value={floor} onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.capacite')}>
                        <input type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder={t('owner.form.capacite_ph')} />
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label={t('owner.form.chambres')}>
                        <input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.sdb')}>
                        <input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.surface')}>
                        <input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('owner.form.etage')}>
                        <input type="number" min={0} value={floor} onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                      <Field label={t('owner.form.nb_pieces')}>
                        <input type="number" min={0} value={rooms} onChange={e => setRooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                      </Field>
                    </div>
                  </>
                )}

                {!commercial && (
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} className="accent-primary h-4 w-4" />
                    <span>{t('owner.form.meuble')}</span>
                  </label>
                )}
              </>
            );
          })()}


          {/* Localisation */}
          <Field label={t('owner.form.carte')}>
            <MapPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} height={240} />
            <p className="text-[10px] text-muted-foreground mt-1">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
          </Field>

          {/* Caractéristiques */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              {t('owner.form.caracteristiques', { n: features.length + customFeatures.length })}
            </label>
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              {FEATURE_CATEGORIES.map(cat => {
                const items = featuresByCat[cat.id];
                if (!items?.length) return null;
                const count = items.filter(f => features.includes(f.key)).length;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span aria-hidden>{cat.emoji}</span>
                      <span>{categoryLabel(cat, lang)}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary px-1.5 text-[10px]">{count}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map(f => {
                        const checked = features.includes(f.key);
                        return (
                          <label key={f.key}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer border transition ${
                              checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'
                            }`}>
                            <input type="checkbox" className="accent-primary" checked={checked} onChange={() => toggleFeature(f.key)} />
                            <span aria-hidden>{f.emoji}</span>
                            <span className="truncate">{featureLabel(f, lang)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                className="form-input" placeholder={t('owner.form.custom_ph')} />
              <button type="button" onClick={addCustom} className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                <Plus size={14} /> {t('owner.form.ajouter')}
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

          {/* Points d'Intérêt — au moins 1 requis */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <MapPin size={13} /> {t('owner.form.pois_label')}
            </label>
            <p className="text-[10px] text-muted-foreground -mt-1">
              {t('owner.form.pois_hint')}
            </p>
            {(existingPois.length > 0 || pendingPois.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {existingPois.map(p => {
                  const pt = POI_TYPES.find(x => x.value === p.type);
                  return (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px]">
                      {pt?.emoji ?? '📍'} {p.name}{p.distance_m ? ` · ${p.distance_m}m` : ''}
                      <button type="button" onClick={() => removeExistingPoi(p.id)} className="ml-1 hover:text-primary/70"><X size={11} /></button>
                    </span>
                  );
                })}
                {pendingPois.map((p, idx) => {
                  const pt = POI_TYPES.find(x => x.value === p.type);
                  return (
                    <span key={`pp-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 px-2.5 py-1 text-[11px]">
                      {pt?.emoji ?? '📍'} {p.name}{p.distance_m ? ` · ${p.distance_m}m` : ''} <span className="opacity-60">{t('owner.form.a_enregistrer')}</span>
                      <button type="button" onClick={() => removePendingPoi(idx)} className="ml-1 hover:text-amber-900"><X size={11} /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-12 gap-2">
              <input
                value={poiName}
                onChange={e => setPoiName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPendingPoi(); } }}
                placeholder={t('owner.form.poi_name_ph')}
                className="form-input col-span-5"
              />
              <select value={poiType} onChange={e => setPoiType(e.target.value)} className="form-input col-span-3">
                {POI_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.emoji} {poiLabel(pt, lang)}</option>)}
              </select>
              <input
                type="number" min={0} value={poiDist}
                onChange={e => setPoiDist(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('owner.form.poi_dist_ph')} className="form-input col-span-2"
              />
              <button type="button" onClick={addPendingPoi}
                className="col-span-2 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1">
                <Plus size={14} /> {t('owner.form.ajouter')}
              </button>
            </div>
          </div>

          {/* Aperçu carte — tel qu'affiché aux locataires */}
          <div className="border-t pt-4 space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {t('owner.form.preview')}
            </label>
            <ListingPreviewCard
              title={title || 'Titre du bien'}
              type={type}
              price={typeof price === 'number' ? price : 0}
              quartier={quartier}
              bedrooms={typeof bedrooms === 'number' ? bedrooms : 0}
              bathrooms={typeof bathrooms === 'number' ? bathrooms : 0}
              surface={typeof surface === 'number' ? surface : 0}
              furnished={furnished}
              firstImage={
                pendingMedia.find(m => m.kind === 'image')?.source === 'file'
                  ? (pendingMedia.find(m => m.kind === 'image') as any).previewUrl
                  : (pendingMedia.find(m => m.kind === 'image') as any)?.url ?? null
              }
            />
            <p className="text-[10px] text-muted-foreground">
              {t('owner.form.preview_hint')}
            </p>
          </div>

          {/* Médias — toujours disponibles, requis avant validation */}
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-semibold text-foreground">
              {t('owner.form.medias_label')}
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
                    <Upload size={14} /> {t('owner.form.choisir_fichiers')}
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
                    <option value="image">{t('owner.form.image')}</option>
                    <option value="video">{t('owner.form.video')}</option>
                    <option value="video_360">{t('owner.form.visite_360')}</option>
                  </select>
                  <div className="relative flex-1">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={pendingUrl}
                      onChange={e => setPendingUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPendingUrl(); } }}
                      placeholder={t('owner.form.media_url_ph')}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addPendingUrl}
                    className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                  >
                    {t('owner.form.ajouter')}
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
                              {m.kind === 'video_360' ? '360°' : t('owner.form.video')}
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
                        {i === 0 ? (
                          <span className="absolute top-1 left-1 text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold shadow">
                            {t('owner.form.principale')}
                          </span>
                        ) : (
                          <span className="absolute bottom-1 right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold">
                            #{i + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center py-3 rounded-lg border border-dashed">
                    {t('owner.form.aucun_media')}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {t('owner.form.upload_limit')}
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <button type="button" onClick={() => onClose(!!savedId)} className="flex-1 h-10 rounded-lg border text-xs font-semibold hover:bg-muted">
              {savedId ? t('owner.form.fermer') : t('owner.form.annuler')}
            </button>
            <button type="submit" disabled={busy} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {savedId ? t('owner.form.mettre_a_jour') : t('owner.form.enregistrer')}
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

function ListingPreviewCard(props: {
  title: string; type: string; price: number; quartier: string;
  bedrooms: number; bathrooms: number; surface: number; furnished: boolean;
  firstImage: string | null;
}) {
  const typeLabel = PROPERTY_TYPES.find(t => t.value === props.type);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden max-w-sm shadow-sm">
      <div className="aspect-video bg-muted relative">
        {props.firstImage ? (
          <img src={props.firstImage} alt={props.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
            <ImageIcon size={24} className="opacity-40" />
            <span className="mt-1 opacity-60">Aucune image — ajoute-en une ci-dessous</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
          {typeLabel?.emoji} {typeLabel?.label ?? props.type}
        </span>
        {props.furnished && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
            Meublé
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-bold truncate">{props.title}</h4>
        <p className="text-[11px] text-muted-foreground truncate">📍 {props.quartier || '—'}</p>
        <p className="text-sm font-bold text-primary mt-1">
          {props.price > 0 ? `${props.price.toLocaleString('fr-FR')} FCFA` : '—'}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          <span>🛏 {props.bedrooms}</span>
          <span>🚿 {props.bathrooms}</span>
          <span>📐 {props.surface} m²</span>
        </div>
      </div>
    </div>
  );
}
