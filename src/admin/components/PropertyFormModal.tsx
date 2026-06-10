import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Link2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PROPERTY_TYPES } from '@/lib/mockData';
import {
  FEATURE_CATALOG,
  FEATURE_CATEGORIES,
  type FeatureCategoryId,
  extractActiveFeatureKeys,
  featureLabel,
} from '@/lib/featureCatalog';
import { useCountryConfig } from '@/hooks/useCountryConfig';
import QuartierAutocomplete from '@/components/QuartierAutocomplete';
import type { AdminProperty, AdminPropertyStatus } from '@/admin/types';
import { adminStore } from '@/admin/store/adminStore';

interface Props {
  open: boolean;
  initial?: AdminProperty | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<AdminPropertyStatus, { fr: string; en: string }> = {
  pending:     { fr: 'En attente',       en: 'Pending' },
  reviewing:   { fr: 'En révision',      en: 'Under review' },
  corrections: { fr: 'Corrections',      en: 'Corrections requested' },
  published:   { fr: 'Publié',           en: 'Published' },
  rented:      { fr: 'Loué',             en: 'Rented' },
  inactive:    { fr: 'Inactif/Refusé',   en: 'Inactive / Rejected' },
};
const STATUS_VALUES: AdminPropertyStatus[] = ['pending', 'reviewing', 'corrections', 'published', 'rented', 'inactive'];

export default function PropertyFormModal({ open, initial, onClose }: Props) {
  const isEdit = !!initial;
  const fileInput = useRef<HTMLInputElement>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr';
  const country = useCountryConfig();
  const currency = country.currency_symbol || 'FCFA';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0].value);
  const [price, setPrice] = useState<number | ''>('');
  const [quartier, setQuartier] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>(1);
  const [bathrooms, setBathrooms] = useState<number | ''>(1);
  const [surface, setSurface] = useState<number | ''>(50);
  const [status, setStatus] = useState<AdminPropertyStatus>('pending');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [activeCat, setActiveCat] = useState<FeatureCategoryId>(FEATURE_CATEGORIES[0].id);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title); setDescription(initial.description || '');
      setType(initial.type); setPrice(initial.price);
      setQuartier(initial.quartier); setAddress(initial.address || '');
      setBedrooms(initial.bedrooms ?? 1); setBathrooms(initial.bathrooms ?? 1);
      setSurface(initial.surface_area ?? 50); setStatus(initial.adminStatus);
      setImages(initial.images || []);
      // Pré-coche depuis features[] + anciens has_*
      setFeatures(extractActiveFeatureKeys(initial as any));
      setCustomFeatures(Array.isArray((initial as any).customFeatures) ? (initial as any).customFeatures : []);
    } else {
      setTitle(''); setDescription(''); setType(PROPERTY_TYPES[0].value);
      setPrice(''); setQuartier('');
      setAddress(''); setBedrooms(1); setBathrooms(1); setSurface(50);
      setStatus('pending'); setImages([]);
      setFeatures([]); setCustomFeatures([]);
    }
    setImageUrlInput('');
    setCustomInput('');
    setActiveCat(FEATURE_CATEGORIES[0].id);
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
    if (customFeatures.some(c => c.toLowerCase() === v.toLowerCase())) {
      toast.error('Déjà ajoutée'); return;
    }
    setCustomFeatures(prev => [...prev, v]);
    setCustomInput('');
  };
  const removeCustom = (idx: number) =>
    setCustomFeatures(prev => prev.filter((_, i) => i !== idx));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} n'est pas une image`); return; }
      if (file.size > 2_000_000) { toast.error(`${file.name} dépasse 2 Mo`); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        setImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addUrlImage = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImages(prev => [...prev, url]);
    setImageUrlInput('');
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error(lang === 'en' ? 'Title is required' : 'Le titre est requis'); return; }
    if (!price || price <= 0) { toast.error(lang === 'en' ? 'Price must be greater than 0' : 'Le prix doit être supérieur à 0'); return; }
    if (!quartier.trim()) { toast.error(lang === 'en' ? 'Neighborhood is required' : 'Quartier requis'); return; }

    const payload = {
      title: title.trim(), description: description.trim(),
      type, price: Number(price), quartier, address: address || quartier,
      bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 0,
      surface_area: Number(surface) || 0,
      images, adminStatus: status,
      features,
      customFeatures,
    };

    if (isEdit && initial) {
      adminStore.updateProperty(initial.id, payload);
      toast.success(lang === 'en' ? 'Listing updated' : 'Bien mis à jour');
    } else {
      adminStore.addProperty(payload);
      toast.success(lang === 'en' ? 'Listing created successfully' : 'Bien créé avec succès');
    }
    onClose();
  };

  const L = lang === 'en'
    ? {
        editTitle: 'Edit listing', newTitle: 'New listing',
        title: 'Title *', titlePh: `Modern villa in ${country.name || 'Accra'}`,
        description: 'Description', descPh: 'Describe the property...',
        type: 'Type *', price: `Price (${currency}) *`,
        quartier: 'Neighborhood *', address: 'Address', addressPh: 'Street, sector...',
        bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', surface: 'Surface (m²)',
        status: 'Status',
        cancel: 'Cancel', update: 'Update', create: 'Create listing',
      }
    : {
        editTitle: 'Modifier le bien', newTitle: 'Nouveau bien',
        title: 'Titre *', titlePh: 'Villa moderne à Tampouy',
        description: 'Description', descPh: 'Décrivez le bien...',
        type: 'Type *', price: `Prix (${currency}) *`,
        quartier: 'Quartier *', address: 'Adresse', addressPh: 'Rue, secteur...',
        bedrooms: 'Chambres', bathrooms: 'Salles de bain', surface: 'Surface (m²)',
        status: 'Statut',
        cancel: 'Annuler', update: 'Mettre à jour', create: 'Créer le bien',
      };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b border-border z-10">
          <h2 className="text-base font-bold text-foreground">
            {isEdit ? L.editTitle : L.newTitle}
            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
              {country.flag_emoji} {country.name}
            </span>
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label={L.title}>
            <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder={L.titlePh} />
          </Field>

          <Field label={L.description}>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-input resize-none" placeholder={L.descPh} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={L.type}>
              <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.emoji} {lang === 'en' ? t.labelEn : t.label}</option>
                ))}
              </select>
            </Field>
            <Field label={L.price}>
              <input type="number" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder="150000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">{L.quartier}</label>
              <QuartierAutocomplete value={quartier} onChange={(q) => setQuartier(q)} />
            </div>
            <Field label={L.address}>
              <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder={L.addressPh} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={L.bedrooms}><input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
            <Field label={L.bathrooms}><input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
            <Field label={L.surface}><input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
          </div>

          <Field label={L.status}>
            <select value={status} onChange={e => setStatus(e.target.value as AdminPropertyStatus)} className="form-input">
              {STATUS_VALUES.map(v => <option key={v} value={v}>{STATUS_LABELS[v][lang]}</option>)}
            </select>
          </Field>

          {/* ── Caractéristiques (sélecteur à onglets catégorisés + champ libre) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                {lang === 'en' ? 'Features' : 'Caractéristiques'} ({features.length + customFeatures.length})
              </label>
            </div>

            {/* Toutes les catégories affichées en sections (style ancien) */}
            <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
              {FEATURE_CATEGORIES.map(cat => {
                const items = featuresByCat[cat.id];
                if (!items?.length) return null;
                const count = items.filter(f => features.includes(f.key)).length;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span aria-hidden>{cat.emoji}</span>
                      <span>{featureLabel(cat, lang)}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary px-1.5 text-[10px]">{count}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map(f => {
                        const checked = features.includes(f.key);
                        return (
                          <label
                            key={f.key}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-primary/10 border-primary/40 text-foreground'
                                : 'bg-card border-border hover:bg-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={checked}
                              onChange={() => toggleFeature(f.key)}
                            />
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

            {/* Champ libre */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {lang === 'en' ? 'Custom feature' : 'Caractéristique personnalisée'}
              </label>
              <div className="flex gap-2">
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                  className="form-input"
                  placeholder={lang === 'en' ? 'e.g. River view' : 'Ex : Vue sur le fleuve'}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90"
                >
                  <Plus size={14} /> {lang === 'en' ? 'Add' : 'Ajouter'}
                </button>
              </div>
              {customFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customFeatures.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs"
                    >
                      ✨ {c}
                      <button
                        type="button"
                        onClick={() => removeCustom(idx)}
                        className="ml-1 hover:text-primary/70"
                        aria-label="Supprimer"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Images ({images.length})</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex-1 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
                <Upload size={14} /> {lang === 'en' ? 'Upload' : 'Uploader'}
              </button>
              <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} className="form-input pl-9" placeholder="https://example.com/image.jpg" />
              </div>
              <button type="button" onClick={addUrlImage} className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90">
                <Plus size={14} /> {lang === 'en' ? 'Add' : 'Ajouter'}
              </button>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted">{L.cancel}</button>
            <button type="submit" className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">{isEdit ? L.update : L.create}</button>
          </div>
        </form>
      </div>
      <style>{`.form-input{display:block;width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none;transition:border-color .15s}.form-input:focus{border-color:hsl(var(--primary))}`}</style>
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
