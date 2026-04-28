import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, ArrowLeft, SlidersHorizontal, Clock, ChevronUp } from 'lucide-react';
import { mockProperties, getTypeLabel, getTypeEmoji, isTypeFurnished, pricePerNight } from '@/lib/mockData';
import FilterBar, { type FilterState } from '@/components/FilterBar';

const TYPEWRITER_PHRASES = [
  "Villa meublée 4 chambres à Tampouy...",
  "Studio climatisé proche école à Koulouba...",
  "Appartement 2ch avec parking à Ouaga 2000...",
  "Bureau 60m² route goudronnée à Zogona...",
  "Maison avec gardien et groupe électrogène...",
  "Local commercial moins de 150 000 FCFA à Pissy...",
  "Studio meublé wifi à Patte d'Oie...",
  "Villa avec piscine et clôture à Ouaga 2000...",
];

const RECENT_KEY = 'sapsap_recent_searches';
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Typewriter
  const [twText, setTwText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const twActive = query.length === 0;

  useEffect(() => {
    if (!twActive) return;
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!isDeleting) {
      if (twText.length < phrase.length) t = setTimeout(() => setTwText(phrase.slice(0, twText.length + 1)), 45);
      else t = setTimeout(() => setIsDeleting(true), 1500);
    } else {
      if (twText.length > 0) t = setTimeout(() => setTwText(twText.slice(0, -1)), 25);
      else { setIsDeleting(false); setPhraseIdx((phraseIdx + 1) % TYPEWRITER_PHRASES.length); }
    }
    return () => clearTimeout(t);
  }, [twText, isDeleting, phraseIdx, twActive]);

  // Load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw).slice(0, 6));
    } catch { /* noop */ }
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const properties = useMemo(
    () => mockProperties.filter(p => p.status !== 'rented' && p.available !== false),
    []
  );

  const quartierNames = useMemo(
    () => Array.from(new Set(properties.map(p => p.quartier))).sort(),
    [properties]
  );

  const openFilters = () => {
    setShowFilters(true);
    setTimeout(() => filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleApplyFilters = (f: FilterState) => {
    try { sessionStorage.setItem('sapsap_apply_filters', JSON.stringify(f)); } catch {}
    navigate(-1);
  };

  const handleResetFilters = () => {
    // Reset local — l'utilisateur reste sur la page de recherche
    setShowFilters(false);
    setTimeout(() => setShowFilters(true), 50);
  };

  const fuzzy = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return properties.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.quartier.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      getTypeLabel(p.type).toLowerCase().includes(q) ||
      String(p.price).includes(q)
    ).slice(0, 12);
  }, [query, properties]);

  const saveRecent = (q: string) => {
    if (!q.trim()) return;
    const next = [q.trim(), ...recent.filter(r => r !== q.trim())].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const submit = (q: string = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    // Synchroniser avec le reste de la plateforme via query param
    navigate(`/?q=${encodeURIComponent(trimmed)}`);
  };

  const goToProperty = (id: string) => {
    saveRecent(query);
    navigate(`/?property=${encodeURIComponent(id)}`);
  };

  const clearRecents = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ }
  };

  const close = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 border-b border-border bg-card shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))' }}
      >
        <button
          onClick={close}
          aria-label="Retour"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full active:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full h-11 rounded-full bg-muted border-none pl-10 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: 16 }}
          />
          {twActive && (
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60 pointer-events-none truncate max-w-[70%]">
              {twText}<span className="animate-pulse text-primary">|</span>
            </span>
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Effacer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollable">
        {fuzzy.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="px-3 pt-3 pb-6"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {fuzzy.length} résultat{fuzzy.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1.5">
              {fuzzy.map(p => {
                const furnished = isTypeFurnished(p.type) || p.furnished;
                const night = furnished ? pricePerNight(p.price) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => goToProperty(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border active:bg-muted/60 transition-colors text-left"
                  >
                    <span className="text-xl shrink-0">{getTypeEmoji(p.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.quartier} · {furnished ? `${fmt(night)} FCFA/nuit` : `${fmt(p.price)} FCFA/mois`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => submit()}
              className="w-full mt-4 h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
            >
              Voir tous les résultats pour « {query.trim()} »
            </button>
          </motion.div>
        ) : query.trim().length > 0 ? (
          <div className="px-4 pt-10 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} »</p>
            <button
              onClick={openFilters}
              className="mt-5 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-muted text-sm font-medium text-foreground active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-4 w-4" /> Ouvrir les filtres avancés
            </button>
          </div>
        ) : (
          <div className="px-3 pt-4 pb-8">
            {recent.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Recherches récentes
                  </p>
                  <button onClick={clearRecents} className="text-[11px] text-muted-foreground active:text-destructive">
                    Effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map(r => (
                    <button
                      key={r}
                      onClick={() => { setQuery(r); submit(r); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-foreground active:scale-[0.97]"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Villa meublée', 'Studio Koulouba', 'Ouaga 2000', 'Bureau', 'Avec piscine', 'Moins de 150 000', 'Tampouy', 'Climatisé'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); submit(s); }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-xs text-foreground active:scale-[0.97]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={openFilters}
              className="w-full mt-6 h-12 rounded-xl bg-card border border-border text-sm font-medium text-foreground flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filtres avancés
              {showFilters && <ChevronUp className="h-4 w-4 ml-1 text-muted-foreground" />}
            </button>
          </div>
        )}

        {/* ═══ Panneau Filtres avancés (inline, déroulant — reste sur la page) ═══ */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.section
              key="filters-panel"
              ref={filtersRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t border-border bg-card"
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Filtres avancés
                </p>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="Fermer les filtres"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full active:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 pb-4">
                <FilterBar
                  forceOpen
                  onFilterChange={handleApplyFilters}
                  onReset={handleResetFilters}
                  quartiers={quartierNames}
                  totalCount={properties.length}
                  filteredCount={properties.length}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPage;
