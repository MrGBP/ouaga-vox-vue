import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';
import { getTypeLabel, getTypeEmoji, isTypeFurnished, pricePerNight } from '@/lib/mockData';
import { useGeoCity } from '@/hooks/useGeoCity';
import { furnishedSuggestionProperties } from '@/lib/furnishedSuggestions';
import { Button } from '@/components/ui/button';

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
  furnishedOnly?: boolean;
}

const TYPEWRITER_BY_COUNTRY: Record<string, string[]> = {
  BF: [
    'Villa meublée 4 chambres à Tampouy…',
    'Studio meublé climatisé à Koulouba…',
    'Appartement meublé 2ch à Ouaga 2000…',
    'Chambre meublée à Zogona…',
    'Villa meublée avec piscine à Ouaga 2000…',
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

const POPULAR = ['Villa meublée Ouaga 2000', 'Studio meublé', 'Appartement meublé', 'Chambre meublée'];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export function useHeroTypewriter(active: boolean) {
  const { activeCity } = useGeoCity();
  const phrases = useMemo(() => activeCity.id === 'ouagadougou'
    ? TYPEWRITER_BY_COUNTRY.BF
    : [`Maison meublée à ${activeCity.name}…`, `Studio meublé climatisé à ${activeCity.name}…`, `Appartement meublé à ${activeCity.name}…`], [activeCity.id, activeCity.name]);
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;
    const phrase = phrases[idx % phrases.length];
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

const HeroSearchSuggestions = ({ properties, query, onPick, onSelectProperty, visible, furnishedOnly = false }: Props) => {
  const suggestionProperties = useMemo(() => furnishedOnly ? furnishedSuggestionProperties(properties) : properties, [properties, furnishedOnly]);
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (q.length === 0) return [];
    return suggestionProperties
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
  }, [suggestionProperties, q]);

  // Quartiers matching
  const quartiers = useMemo(() => {
    if (q.length === 0) return [];
    const set = new Set<string>();
    suggestionProperties.forEach(p => {
      if (p.quartier.toLowerCase().includes(q)) set.add(p.quartier);
    });
    return Array.from(set).slice(0, 4);
  }, [suggestionProperties, q]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-popover rounded-lg shadow-2xl border border-border/50 overflow-hidden max-h-[420px] overflow-y-auto"
        >
          {q.length === 0 ? (
            <div className="p-3">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Recherches populaires
              </p>
              <div className="flex flex-wrap gap-1.5 p-1.5">
                {POPULAR.map(p => (
                  <Button variant="ghost"
                    key={p}
                    onMouseDown={(e) => { e.preventDefault(); onPick(p); }}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-medium text-foreground transition-colors"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {quartiers.length > 0 && (
                <div className="p-2 border-b border-border/50">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quartiers</p>
                  {quartiers.map(qname => (
                    <Button variant="ghost"
                      key={qname}
                      onMouseDown={(e) => { e.preventDefault(); onPick(qname); }}
                      className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{qname}</span>
                    </Button>
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
                      <Button variant="ghost"
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (onSelectProperty) onSelectProperty(p.id);
                          else onPick(p.title);
                        }}
                        className="w-full h-auto justify-start flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors"
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
                      </Button>
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
