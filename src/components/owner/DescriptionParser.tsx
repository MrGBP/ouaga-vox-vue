import { useState } from 'react';
import { Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface ParsedProperty {
  type?: string;
  title_suggestion?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surface_area?: number | null;
  price?: number | null;
  price_type?: 'nuit' | 'mois';
  quartier?: string | null;
  furnished?: boolean;
  amenities?: Record<string, boolean>;
  confidence?: 'high' | 'medium' | 'low';
  missing_fields?: string[];
  /** Raw description text saved so the form can pre-fill it. */
  description?: string;
}

interface Props {
  onConfirm: (data: ParsedProperty) => void;
  onCancel: () => void;
}

const AMENITY_LABELS: Record<string, string> = {
  climatisation: 'Climatisation',
  wifi: 'Wi-Fi',
  groupe_electrogene: 'Groupe électrogène',
  vigile: 'Vigile / Gardien',
  cloture: 'Clôture',
  piscine: 'Piscine',
  parking: 'Parking',
  eau_courante: 'Eau courante',
  jardin: 'Jardin',
  cameras: 'Caméras',
  panneaux_solaires: 'Panneaux solaires',
  terrasse: 'Terrasse',
  cuisine_equipee: 'Cuisine équipée',
  tv: 'Télévision',
  machine_laver: 'Machine à laver',
};

const TYPE_LABELS: Record<string, string> = {
  villa_meublee: 'Villa meublée',
  appartement: 'Appartement',
  studio: 'Studio',
  maison: 'Maison',
  bureau: 'Bureau',
  local: 'Local commercial',
  chambre: 'Chambre',
  hotel: 'Chambre d\'hôtel',
  residence: 'Résidence',
};

export default function DescriptionParser({ onConfirm, onCancel }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedProperty | null>(null);

  const analyse = async () => {
    if (text.trim().length < 50) {
      toast.error('Décris ton bien en au moins 50 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-property-description', {
        body: { text: text.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ ...(data?.result ?? {}), description: text.trim() });
    } catch (e: any) {
      toast.error(e?.message ?? 'Analyse impossible');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (k: string) => {
    if (!result) return;
    setResult({
      ...result,
      amenities: { ...(result.amenities ?? {}), [k]: !result.amenities?.[k] },
    });
  };

  const updateField = <K extends keyof ParsedProperty>(k: K, v: ParsedProperty[K]) => {
    setResult(prev => prev ? { ...prev, [k]: v } : prev);
  };

  if (!result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold">Remplissage automatique</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Décris ton bien librement. L'IA détectera type, nombre de chambres, équipements, prix, quartier…
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          placeholder="Ex : Belle villa meublée 4 chambres avec climatisation, wifi et groupe électrogène. Sécurisée avec gardien et clôture. 200 m², Tampouy. Prix : 10 000 FCFA/nuit."
          className="form-input resize-none"
        />
        <p className="text-[10px] text-muted-foreground">{text.trim().length} caractères (min 50)</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 h-9 rounded-lg border border-border text-xs"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={analyse}
            disabled={loading || text.trim().length < 50}
            className="flex-1 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={12} className="animate-spin" /> Analyse en cours…</> : <><Sparkles size={12} /> Analyser le texte</>}
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
        <h3 className="text-sm font-bold">Voici ce que j'ai compris</h3>
        {result.confidence && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            result.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
            result.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            Confiance {result.confidence === 'high' ? 'élevée' : result.confidence === 'medium' ? 'moyenne' : 'faible'}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
        <Row label="Type">
          <select
            value={result.type ?? ''}
            onChange={e => updateField('type', e.target.value as any)}
            className="form-input text-xs h-8 py-0"
          >
            <option value="">—</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Row>
        <Row label="Titre">
          <input
            value={result.title_suggestion ?? ''}
            onChange={e => updateField('title_suggestion', e.target.value)}
            className="form-input text-xs h-8 py-0"
          />
        </Row>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Chambres" value={result.bedrooms} onChange={v => updateField('bedrooms', v)} />
          <NumField label="SdB" value={result.bathrooms} onChange={v => updateField('bathrooms', v)} />
          <NumField label="Surface m²" value={result.surface_area} onChange={v => updateField('surface_area', v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Prix" value={result.price} onChange={v => updateField('price', v)} />
          <Row label="par">
            <select
              value={result.price_type ?? 'mois'}
              onChange={e => updateField('price_type', e.target.value as any)}
              className="form-input text-xs h-8 py-0"
            >
              <option value="mois">/ mois</option>
              <option value="nuit">/ nuit</option>
            </select>
          </Row>
        </div>
        <Row label="Quartier">
          <input
            value={result.quartier ?? ''}
            onChange={e => updateField('quartier', e.target.value)}
            className="form-input text-xs h-8 py-0"
          />
        </Row>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!result.furnished} onChange={e => updateField('furnished', e.target.checked)} className="accent-primary" />
          Meublé
        </label>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Équipements détectés</h4>
        <div className="flex flex-wrap gap-1.5">
          {filled.length === 0 && <span className="text-xs text-muted-foreground italic">Aucun</span>}
          {filled.map(([k]) => (
            <button key={k} type="button" onClick={() => toggleAmenity(k)}
              className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Check size={10} /> {AMENITY_LABELS[k] ?? k}
            </button>
          ))}
        </div>
        {empty.length > 0 && (
          <>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1.5">Non détectés (clique pour ajouter)</h4>
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
            <strong>À compléter manuellement :</strong> {result.missing_fields.join(', ')}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => setResult(null)} className="px-3 h-9 rounded-lg border border-border text-xs">
          Modifier le texte
        </button>
        <button type="button" onClick={onCancel} className="px-3 h-9 rounded-lg border border-border text-xs">
          <X size={12} className="inline" /> Annuler
        </button>
        <button
          type="button"
          onClick={() => onConfirm(result)}
          className="flex-1 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"
        >
          <Check size={12} /> Confirmer et remplir le formulaire
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
