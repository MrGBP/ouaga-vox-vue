import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';
import { getTypeLabel, getTypeEmoji, isTypeFurnished, pricePerNight } from '@/lib/mockData';
import { useGeoCity } from '@/hooks/useGeoCity';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  quartier: string;
  furnished?: boolean;
  currency?: string;
}

interface Props {
  properties: Property[];
  query: string;
  onPick: (query: string) => void;
  onSelectProperty?: (id: string) => void;
  visible: boolean;
}

const TYPEWRITER_BY_COUNTRY: Record<string, string[]> = {
  BF: [
    'Villa meublée 4 chambres à Tampouy…',
    'Studio climatisé proche école à Koulouba…',
    'Appartement 2ch avec parking à Ouaga 2000…',
    "Local commercial moins de 150 000 FCFA à Pissy…",
    "Villa avec piscine et clôture à Ouaga 2000…",
  ],
  ML: [
    'Villa meublée 4 chambres à Hamdallaye…',
    'Appartement 2ch avec parking à ACI 2000…',
    'Studio meublé wifi à Sotuba…',
  ],
  GH: [
    'Furnished 4-bedroom villa in East Legon…',
    '2-bedroom apartment with parking in Cantonments…',
    'Furnished studio with wifi in Spintex…',
  ],
};

const POPULAR = ['Villa Ouaga 2000', 'Studio meublé', 'Appartement 2 chambres', 'Bureau', 'Villa piscine'];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export function useHeroTypewriter(active: boolean) {
  const { activeCity } = useGeoCity();
  const phrases = TYPEWRITER_BY_COUNTRY[activeCity?.country || 'BF'] || TYPEWRITER_BY_COUNTRY.BF;
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;
    const phrase = phrases[idx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (text.length < phrase.length) {
        timeout = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 30);
      } else {
        timeout = setTimeout(() => setDeleting(true), 1200);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 15);
      } else {
        setDeleting(false);
        setIdx((idx + 1) % phrases.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, idx, active, phrases]);

  return text;
}

const HeroSearchSuggestions = ({ properties, query, onPick, onSelectProperty, visible }: Props) => {
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (q.length === 0) return [];
    return properties
      .filter(p => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.quartier.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          getTypeLabel(p.type).toLowerCase().includes(q) ||
          p.price.toString().includes(q)
        );
      })
      .slice(0, 6);
  }, [properties, q]);

  // Quartiers matching
  const quartiers = useMemo(() => {
    if (q.length === 0) return [];
    const set = new Set<string>();
    properties.forEach(p => {
      if (p.quartier.toLowerCase().includes(q)) set.add(p.quartier);
    });
    return Array.from(set).slice(0, 4);
  }, [properties, q]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden max-h-[420px] overflow-y-auto"
        >
          {q.length === 0 ? (
            <div className="p-3">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Recherches populaires
              </p>
              <div className="flex flex-wrap gap-1.5 p-1.5">
                {POPULAR.map(p => (
                  <button
                    key={p}
                    onMouseDown={(e) => { e.preventDefault(); onPick(p); }}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-white text-xs font-medium text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {quartiers.length > 0 && (
                <div className="p-2 border-b border-border/50">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quartiers</p>
                  {quartiers.map(qname => (
                    <button
                      key={qname}
                      onMouseDown={(e) => { e.preventDefault(); onPick(qname); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{qname}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.length > 0 ? (
                <div className="p-2">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Biens</p>
                  {results.map(p => {
                    const isFurnished = isTypeFurnished(p.type) || p.furnished;
                    const price = isFurnished ? pricePerNight(p.price) : p.price;
                    const suffix = isFurnished ? '/nuit' : '/mois';
                    return (
                      <button
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (onSelectProperty) onSelectProperty(p.id);
                          else onPick(p.title);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                      >
                        <span className="text-lg shrink-0">{getTypeEmoji(p.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getTypeLabel(p.type)} · {p.quartier}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0">
                          {fmt(price)} {p.currency || 'FCFA'}{suffix}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : quartiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 px-4">
                  Aucun résultat pour « {query} ». Essayez un quartier ou un type de bien.
                </p>
              ) : null}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeroSearchSuggestions;
