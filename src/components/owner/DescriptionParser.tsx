import { useState } from 'react';
import { Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGeoCity } from '@/hooks/useGeoCity';

export interface ParsedProperty {
  type?: string;
  title_suggestion?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surface_area?: number | null;
  price?: number | null;
  price_type?: 'nuit' | 'mois';
  rent_mode?: 'nuit' | 'mois';
  is_short_stay?: boolean;
  quartier?: string | null;
  furnished?: boolean;
  amenities?: Record<string, boolean>;
  confidence?: 'high' | 'medium' | 'low';
  missing_fields?: string[];
  /** AI-cleaned description text (the owner edits & validates before submit). */
  description?: string;
  description_cleaned?: string;
  language?: 'fr' | 'en';
}

interface Props {
  onConfirm: (data: ParsedProperty) => void;
  onCancel: () => void;
}

const AMENITY_LABELS_FR: Record<string, string> = {
  climatisation: 'Climatisation', wifi: 'Wi-Fi', groupe_electrogene: 'Groupe électrogène',
  vigile: 'Vigile / Gardien', cloture: 'Clôture', piscine: 'Piscine', parking: 'Parking',
  eau_courante: 'Eau courante', jardin: 'Jardin', cameras: 'Caméras',
  panneaux_solaires: 'Panneaux solaires', terrasse: 'Terrasse', cuisine_equipee: 'Cuisine équipée',
  tv: 'Télévision', machine_laver: 'Machine à laver',
};
const AMENITY_LABELS_EN: Record<string, string> = {
  climatisation: 'Air conditioning', wifi: 'Wi-Fi', groupe_electrogene: 'Generator',
  vigile: 'Security / Guard', cloture: 'Fence', piscine: 'Pool', parking: 'Parking',
  eau_courante: 'Running water', jardin: 'Garden', cameras: 'CCTV',
  panneaux_solaires: 'Solar panels', terrasse: 'Terrace', cuisine_equipee: 'Equipped kitchen',
  tv: 'TV', machine_laver: 'Washing machine',
};

const TYPE_LABELS_FR: Record<string, string> = {
  villa_meublee: 'Villa meublée', appartement: 'Appartement', appartement_meuble: 'Appartement meublé',
  studio: 'Studio', maison: 'Maison', bureau: 'Bureau', local: 'Local commercial',
  chambre: 'Chambre', hotel: 'Chambre d\'hôtel', residence: 'Résidence',
};
const TYPE_LABELS_EN: Record<string, string> = {
  villa_meublee: 'Furnished villa', appartement: 'Apartment', appartement_meuble: 'Furnished apartment',
  studio: 'Studio', maison: 'House', bureau: 'Office', local: 'Commercial space',
  chambre: 'Room', hotel: 'Hotel room', residence: 'Residence',
};

export default function DescriptionParser({ onConfirm, onCancel }: Props) {
  const { activeCity } = useGeoCity();
  const countryCode = (activeCity?.country || 'BF').toUpperCase();
  const isEN = countryCode === 'GH';

  const T = {
    title: isEN ? 'Auto-fill from description' : 'Remplissage automatique',
    intro: isEN
      ? 'Describe your property freely. The AI will detect type, bedrooms, amenities, price, area…'
      : 'Décris ton bien librement. L\'IA détectera type, nombre de chambres, équipements, prix, quartier…',
    placeholder: isEN
      ? 'E.g. Beautiful furnished 3-bedroom house in East Legon. AC, Wi-Fi, generator, swimming pool, parking. 180 sqm. Long-term lease available, ₵8,000/month.'
      : 'Ex : Belle villa meublée 4 chambres avec climatisation, wifi et groupe électrogène. Sécurisée avec gardien et clôture. 200 m², Tampouy. Prix : 10 000 FCFA/nuit.',
    chars: (n: number) => isEN ? `${n} characters (min 50)` : `${n} caractères (min 50)`,
    cancel: isEN ? 'Cancel' : 'Annuler',
    analyse: isEN ? 'Analyse text' : 'Analyser le texte',
    analysing: isEN ? 'Analysing…' : 'Analyse en cours…',
    minErr: isEN ? 'Please write at least 50 characters.' : 'Décris ton bien en au moins 50 caractères.',
    understood: isEN ? 'Here is what I understood' : 'Voici ce que j\'ai compris',
    confidence: (c: string) => isEN
      ? `Confidence ${c === 'high' ? 'high' : c === 'medium' ? 'medium' : 'low'}`
      : `Confiance ${c === 'high' ? 'élevée' : c === 'medium' ? 'moyenne' : 'faible'}`,
    cleaned: isEN ? 'Cleaned description (edit if needed)' : 'Description corrigée (modifie si besoin)',
    cleanedHint: isEN
      ? 'The AI rewrote and polished your text. Review it carefully — this is what visitors will read.'
      : 'L\'IA a réécrit et corrigé ton texte. Relis-le attentivement — c\'est ce que verront les visiteurs.',
    type: isEN ? 'Type' : 'Type',
    title2: isEN ? 'Title' : 'Titre',
    bedrooms: isEN ? 'Bedrooms' : 'Chambres',
    bath: isEN ? 'Baths' : 'SdB',
    surface: isEN ? 'Area m²' : 'Surface m²',
    price: isEN ? 'Price' : 'Prix',
    per: isEN ? 'per' : 'par',
    monthOpt: isEN ? '/ month' : '/ mois',
    nightOpt: isEN ? '/ night' : '/ nuit',
    quartier: isEN ? 'Area' : 'Quartier',
    furnished: isEN ? 'Furnished' : 'Meublé',
    detected: isEN ? 'Detected amenities' : 'Équipements détectés',
    none: isEN ? 'None' : 'Aucun',
    notDetected: isEN ? 'Not detected (click to add)' : 'Non détectés (clique pour ajouter)',
    toComplete: isEN ? 'To complete manually:' : 'À compléter manuellement :',
    editText: isEN ? 'Edit text' : 'Modifier le texte',
    confirm: isEN ? 'Confirm and fill form' : 'Confirmer et remplir le formulaire',
    ghHint: isEN
      ? 'Ghana: furnished homes are commonly rented long-term. Defaults to monthly unless you specify a nightly rate.'
      : '',
  };

  const AMENITY_LABELS = isEN ? AMENITY_LABELS_EN : AMENITY_LABELS_FR;
  const TYPE_LABELS = isEN ? TYPE_LABELS_EN : TYPE_LABELS_FR;

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedProperty | null>(null);

  const analyse = async () => {
    if (text.trim().length < 50) {
      toast.error(T.minErr);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-property-description', {
        body: { text: text.trim(), country_code: countryCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data?.result ?? {};
      // The owner edits the cleaned version; raw `description` field stores the final text.
      setResult({ ...r, description: r.description_cleaned || text.trim() });
    } catch (e: any) {
      toast.error(e?.message ?? (isEN ? 'Analysis failed' : 'Analyse impossible'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (k: string) => {
    if (!result) return;
    setResult({ ...result, amenities: { ...(result.amenities ?? {}), [k]: !result.amenities?.[k] } });
  };

  const updateField = <K extends keyof ParsedProperty>(k: K, v: ParsedProperty[K]) => {
    setResult(prev => prev ? { ...prev, [k]: v } : prev);
  };

  if (!result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold">{T.title}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{countryCode}</span>
        </div>
        <p className="text-xs text-muted-foreground">{T.intro}</p>
        {isEN && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
            {T.ghHint}
          </p>
        )}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          placeholder={T.placeholder}
          className="form-input resize-none"
        />
        <p className="text-[10px] text-muted-foreground">{T.chars(text.trim().length)}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 h-9 rounded-lg border border-border text-xs">
            {T.cancel}
          </button>
          <button
            type="button"
            onClick={analyse}
            disabled={loading || text.trim().length < 50}
            className="flex-1 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={12} className="animate-spin" /> {T.analysing}</> : <><Sparkles size={12} /> {T.analyse}</>}
          </button>
        </div>
      </div>
    );
  }

  const amenities = result.amenities ?? {};
  const detected: [string, boolean][] = Object.entries(amenities);
  const filled = detected.filter(([, v]) => v);
  const empty  = detected.filter(([, v]) => !v);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="text-sm font-bold">{T.understood}</h3>
        {result.confidence && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            result.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
            result.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>{T.confidence(result.confidence)}</span>
        )}
      </div>

      {/* Cleaned description — editable */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-primary uppercase tracking-wide">{T.cleaned}</label>
          <span className="text-[10px] text-muted-foreground">{(result.description ?? '').trim().length} chars</span>
        </div>
        <p className="text-[10px] text-muted-foreground">{T.cleanedHint}</p>
        <textarea
          value={result.description ?? ''}
          onChange={e => updateField('description', e.target.value)}
          rows={5}
          className="form-input resize-none text-xs leading-relaxed"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
        <Row label={T.type}>
          <select value={result.type ?? ''} onChange={e => updateField('type', e.target.value as any)} className="form-input text-xs h-8 py-0">
            <option value="">—</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Row>
        <Row label={T.title2}>
          <input value={result.title_suggestion ?? ''} onChange={e => updateField('title_suggestion', e.target.value)} className="form-input text-xs h-8 py-0" />
        </Row>
        <div className="grid grid-cols-3 gap-2">
          <NumField label={T.bedrooms} value={result.bedrooms} onChange={v => updateField('bedrooms', v)} />
          <NumField label={T.bath} value={result.bathrooms} onChange={v => updateField('bathrooms', v)} />
          <NumField label={T.surface} value={result.surface_area} onChange={v => updateField('surface_area', v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label={T.price} value={result.price} onChange={v => updateField('price', v)} />
          <Row label={T.per}>
            <select
              value={result.rent_mode ?? result.price_type ?? (isEN ? 'mois' : 'nuit')}
              onChange={e => { updateField('rent_mode', e.target.value as any); updateField('price_type', e.target.value as any); }}
              className="form-input text-xs h-8 py-0"
            >
              <option value="mois">{T.monthOpt}</option>
              <option value="nuit">{T.nightOpt}</option>
            </select>
          </Row>
        </div>
        <Row label={T.quartier}>
          <input value={result.quartier ?? ''} onChange={e => updateField('quartier', e.target.value)} className="form-input text-xs h-8 py-0" />
        </Row>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!result.furnished} onChange={e => updateField('furnished', e.target.checked)} className="accent-primary" />
          {T.furnished}
        </label>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{T.detected}</h4>
        <div className="flex flex-wrap gap-1.5">
          {filled.length === 0 && <span className="text-xs text-muted-foreground italic">{T.none}</span>}
          {filled.map(([k]) => (
            <button key={k} type="button" onClick={() => toggleAmenity(k)}
              className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Check size={10} /> {AMENITY_LABELS[k] ?? k}
            </button>
          ))}
        </div>
        {empty.length > 0 && (
          <>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1.5">{T.notDetected}</h4>
            <div className="flex flex-wrap gap-1.5">
              {empty.map(([k]) => (
                <button key={k} type="button" onClick={() => toggleAmenity(k)}
                  className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200">
                  + {AMENITY_LABELS[k] ?? k}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {result.missing_fields && result.missing_fields.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 flex gap-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900">
            <strong>{T.toComplete}</strong> {result.missing_fields.join(', ')}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => setResult(null)} className="px-3 h-9 rounded-lg border border-border text-xs">
          {T.editText}
        </button>
        <button type="button" onClick={onCancel} className="px-3 h-9 rounded-lg border border-border text-xs">
          <X size={12} className="inline" /> {T.cancel}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(result)}
          className="flex-1 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"
        >
          <Check size={12} /> {T.confirm}
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground block mb-0.5">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="form-input text-xs h-8 py-0"
      />
    </div>
  );
}
