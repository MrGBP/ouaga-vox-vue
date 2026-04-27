import { useState, useRef, useEffect } from 'react';
import { X, Upload, Link2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { mockQuartiers, PROPERTY_TYPES } from '@/lib/mockData';
import type { AdminProperty, AdminPropertyStatus } from '@/admin/types';
import { adminStore } from '@/admin/store/adminStore';

interface Props {
  open: boolean;
  initial?: AdminProperty | null;
  onClose: () => void;
}

const STATUSES: { value: AdminPropertyStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'reviewing', label: 'En révision' },
  { value: 'corrections', label: 'Corrections' },
  { value: 'published', label: 'Publié' },
  { value: 'rented', label: 'Loué' },
  { value: 'inactive', label: 'Inactif/Refusé' },
];

export default function PropertyFormModal({ open, initial, onClose }: Props) {
  const isEdit = !!initial;
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0].value);
  const [price, setPrice] = useState<number | ''>('');
  const [quartier, setQuartier] = useState(mockQuartiers[0]?.name || '');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>(1);
  const [bathrooms, setBathrooms] = useState<number | ''>(1);
  const [surface, setSurface] = useState<number | ''>(50);
  const [status, setStatus] = useState<AdminPropertyStatus>('pending');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title); setDescription(initial.description || '');
      setType(initial.type); setPrice(initial.price);
      setQuartier(initial.quartier); setAddress(initial.address || '');
      setBedrooms(initial.bedrooms ?? 1); setBathrooms(initial.bathrooms ?? 1);
      setSurface(initial.surface_area ?? 50); setStatus(initial.adminStatus);
      setImages(initial.images || []);
    } else {
      setTitle(''); setDescription(''); setType(PROPERTY_TYPES[0].value);
      setPrice(''); setQuartier(mockQuartiers[0]?.name || '');
      setAddress(''); setBedrooms(1); setBathrooms(1); setSurface(50);
      setStatus('pending'); setImages([]);
    }
    setImageUrlInput('');
  }, [open, initial]);

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
    if (!title.trim()) { toast.error('Le titre est requis'); return; }
    if (!price || price <= 0) { toast.error('Le prix doit être supérieur à 0'); return; }

    const payload = {
      title: title.trim(), description: description.trim(),
      type, price: Number(price), quartier, address: address || quartier,
      bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 0,
      surface_area: Number(surface) || 0,
      images, adminStatus: status,
    };

    if (isEdit && initial) {
      adminStore.updateProperty(initial.id, payload);
      toast.success('Bien mis à jour');
    } else {
      adminStore.addProperty(payload);
      toast.success('Bien créé avec succès');
    }
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b border-border z-10">
          <h2 className="text-base font-bold text-foreground">{isEdit ? 'Modifier le bien' : 'Nouveau bien'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Titre */}
          <Field label="Titre *">
            <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Villa moderne à Tampouy" />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-input resize-none" placeholder="Décrivez le bien..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type *">
              <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </Field>
            <Field label="Prix (FCFA) *">
              <input type="number" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder="150000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quartier *">
              <select value={quartier} onChange={e => setQuartier(e.target.value)} className="form-input">
                {mockQuartiers.map(q => <option key={q.id} value={q.name}>{q.name}</option>)}
              </select>
            </Field>
            <Field label="Adresse">
              <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder="Rue, secteur..." />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Chambres"><input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
            <Field label="Salles de bain"><input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
            <Field label="Surface (m²)"><input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" /></Field>
          </div>

          <Field label="Statut">
            <select value={status} onChange={e => setStatus(e.target.value as AdminPropertyStatus)} className="form-input">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Images ({images.length})</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex-1 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
                <Upload size={14} /> Uploader
              </button>
              <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} className="form-input pl-9" placeholder="https://exemple.com/image.jpg" />
              </div>
              <button type="button" onClick={addUrlImage} className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90"><Plus size={14} /> Ajouter</button>
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
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-xs font-semibold hover:bg-muted">Annuler</button>
            <button type="submit" className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">{isEdit ? 'Mettre à jour' : 'Créer le bien'}</button>
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
