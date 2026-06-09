// Fiche complète d'un bien pour la modération / examen admin.
// Affiche médias, description, caractéristiques, POIs, infos propriétaire,
// historique des dates et permet d'appliquer un changement de statut.
import { useEffect, useState } from 'react';
import { Loader2, X, Check, MapPin, ImageIcon, Video, Globe, User, Phone, Mail, Home, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminSetStatus, listPropertyMedia } from '@/lib/propertiesService';
import { listPoisForProperty, POI_TYPES, type PropertyPoi } from '@/lib/propertyPoisService';
import { FEATURE_CATALOG } from '@/lib/featureCatalog';
import { getTypeLabel } from '@/lib/mockData';
import { isCommercialType, isOfficeType } from '@/lib/typeHelpers';

type PropertyFull = any;
type MediaRow = { id: string; url: string; kind: 'image'|'video'|'video_360' };
type OwnerInfo = { id: string; full_name: string | null; phone: string | null; email?: string | null };

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'En attente',  color: 'bg-amber-500' },
  { value: 'reviewing',   label: 'En révision', color: 'bg-blue-500' },
  { value: 'corrections', label: 'À corriger',  color: 'bg-orange-500' },
  { value: 'published',   label: 'Publié',      color: 'bg-green-600' },
  { value: 'rejected',    label: 'Refusé',      color: 'bg-red-600' },
  { value: 'paused',      label: 'Suspendu',    color: 'bg-zinc-500' },
  { value: 'inactive',    label: 'Archivé',     color: 'bg-zinc-400' },
] as const;

interface Props {
  propertyId: string;
  onClose: () => void;
  onChanged?: () => void;
}

export default function PropertyReviewPanel({ propertyId, onClose, onChanged }: Props) {
  const [property, setProperty] = useState<PropertyFull | null>(null);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [pois, setPois] = useState<PropertyPoi[]>([]);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('pending');
  const [applying, setApplying] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: prop } = await supabase.from('properties').select('*').eq('id', propertyId).single();
        if (cancelled) return;
        setProperty(prop);
        setStatus(prop?.admin_status ?? 'pending');

        const [m, p] = await Promise.all([
          listPropertyMedia(propertyId).catch(() => []),
          listPoisForProperty(propertyId).catch(() => []),
        ]);
        if (cancelled) return;
        setMedia(m as any); setPois(p);

        if (prop?.owner_id) {
          const { data: o } = await supabase.from('profiles').select('id,full_name,phone').eq('id', prop.owner_id).single();
          if (!cancelled) setOwner(o as any);
        }
      } catch (e: any) { toast.error(e.message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  const apply = async () => {
    if (!property) return;
    setApplying(true);
    try {
      await adminSetStatus(propertyId, status as any);
      if (note.trim() && property.owner_id) {
        await supabase.from('messages').insert({
          property_id: propertyId, sender_role: 'admin',
          sender_name: 'Administration SapSapHouse', content: note.trim(),
        });
      }
      toast.success('Statut appliqué');
      onChanged?.();
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setApplying(false); }
  };

  const f = (property?.features ?? {}) as Record<string, any>;
  const activeFeatures = FEATURE_CATALOG.filter(c => f[c.key]);
  const customFeatures = Array.isArray(f.__custom) ? (f.__custom as string[]) : [];
  const floor = typeof f.__floor === 'number' ? f.__floor : null;
  const rooms = typeof f.__rooms === 'number' ? f.__rooms : null;
  const capacity = typeof f.__capacity === 'number' ? f.__capacity : null;
  const commercial = property ? isCommercialType(property.type) : false;
  const office = property ? isOfficeType(property.type) : false;

  return (
    <div className="fixed inset-0 z-[400] bg-black/60 flex items-start justify-center p-2 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-4xl my-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="min-w-0">
            <h3 className="text-base font-bold truncate">{property?.title ?? 'Chargement…'}</h3>
            {property && <p className="text-[11px] text-muted-foreground truncate">{getTypeLabel(property.type)} • {property.quartier} • {property.address}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X size={16} /></button>
        </header>

        {loading || !property ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="p-4 sm:p-5 space-y-5">

            {/* Médias */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><ImageIcon size={12} /> Médias ({media.length})</h4>
              {media.length === 0 ? (
                <p className="text-xs italic text-red-600">⚠ Aucun média uploadé</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {media.map(m => (
                    <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                      {m.kind === 'image' ? (
                        <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
                          {m.kind === 'video_360' ? <Globe size={22}/> : <Video size={22}/>}
                          <span className="mt-1 text-[10px]">{m.kind === 'video_360' ? '360°' : 'Vidéo'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Description */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1"><Home size={12}/> Description</h4>
              {property.description?.trim() ? (
                <p className="text-sm whitespace-pre-wrap text-foreground">{property.description}</p>
              ) : (
                <p className="text-xs italic text-red-600">⚠ Aucune description</p>
              )}
            </section>

            {/* Caractéristiques structurelles */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Caractéristiques</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <Stat label="Prix" value={`${Number(property.price).toLocaleString('fr-FR')} F`} />
                <Stat label="Surface" value={property.surface_area ? `${property.surface_area} m²` : '—'} />
                <Stat label="Étage" value={floor !== null ? String(floor) : '—'} />
                {commercial ? (
                  <>
                    <Stat label={office ? 'Bureaux' : 'Locaux'} value={rooms !== null ? String(rooms) : '—'} />
                    <Stat label="Pièces" value={property.bedrooms ?? '—'} />
                    {capacity !== null && <Stat label="Capacité" value={`${capacity} pers.`} />}
                  </>
                ) : (
                  <>
                    <Stat label="Chambres" value={property.bedrooms ?? '—'} />
                    <Stat label="SDB" value={property.bathrooms ?? '—'} />
                    <Stat label="Pièces" value={rooms !== null ? String(rooms) : '—'} />
                  </>
                )}
                <Stat label="Meublé" value={property.furnished ? 'Oui' : 'Non'} />
              </div>
              {(activeFeatures.length > 0 || customFeatures.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeFeatures.map(f => (
                    <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                      {f.emoji} {f.label}
                    </span>
                  ))}
                  {customFeatures.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]">✨ {c}</span>
                  ))}
                </div>
              )}
            </section>

            {/* POIs */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1"><MapPin size={12}/> Points d'intérêt ({pois.length})</h4>
              {pois.length === 0 ? (
                <p className="text-xs italic text-red-600">⚠ Aucun POI déclaré</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {pois.map(p => {
                    const t = POI_TYPES.find(x => x.value === p.type);
                    return (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px]">
                        {t?.emoji ?? '📍'} {p.name}{p.distance_m ? ` · ${p.distance_m}m` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Propriétaire */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1"><User size={12}/> Propriétaire</h4>
              {owner ? (
                <div className="text-xs space-y-1 text-foreground">
                  <p className="font-semibold">{owner.full_name ?? '— sans nom —'}</p>
                  {owner.phone && <p className="flex items-center gap-1.5 text-muted-foreground"><Phone size={11}/> {owner.phone}</p>}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">Bien créé par l'admin (pas de propriétaire lié)</p>
              )}
            </section>

            {/* Dates */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <Stat label="Créé" value={new Date(property.created_at).toLocaleDateString('fr-FR')} />
              {property.owner_updated_at && <Stat label="MAJ propriétaire" value={new Date(property.owner_updated_at).toLocaleDateString('fr-FR')} />}
              {property.reviewed_at && <Stat label="Revu" value={new Date(property.reviewed_at).toLocaleDateString('fr-FR')} />}
              {property.published_at && <Stat label="Publié" value={new Date(property.published_at).toLocaleDateString('fr-FR')} />}
            </section>

            {/* Workflow statut */}
            <section className="border-t pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Calendar size={12}/> Workflow</h4>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                    className={`px-2.5 h-8 rounded-full text-[11px] font-semibold border transition ${
                      status === s.value ? `${s.color} text-white border-transparent` : 'bg-card border-border hover:bg-muted'
                    }`}>{s.label}</button>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Message au propriétaire (optionnel — utile pour 'à corriger' ou 'refusé')…"
                className="w-full text-xs border border-border rounded-lg px-3 py-2 resize-none bg-background" />
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 h-10 rounded-lg border text-xs font-semibold hover:bg-muted">Fermer</button>
                <button onClick={apply} disabled={applying || status === property.admin_status && !note.trim()}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check size={14}/>}
                  Appliquer ({STATUS_OPTIONS.find(s => s.value === status)?.label})
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-2 py-1.5">
      <p className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}
