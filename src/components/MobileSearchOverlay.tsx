import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { getTypeLabel, getTypeEmoji } from '@/lib/mockData';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  quartier: string;
}

interface MobileSearchOverlayProps {
  properties: Property[];
  onClose: () => void;
  onSelectProperty: (id: string) => void;
  onSearchSubmit: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenFilters: () => void;
}

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

const POPULAR_SEARCHES = [
  "Villa meublée Ouaga 2000",
  "Studio meublé Tampouy",
  "Bureau centre-ville",
  "Appartement 2 chambres",
];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const MobileSearchOverlay = ({
  properties,
  onClose,
  onSelectProperty,
  onSearchSubmit,
  searchQuery,
  onSearchQueryChange,
  onOpenFilters,
}: MobileSearchOverlayProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const typewriterActive = searchQuery.length === 0;
  const [kbHeight, setKbHeight] = useState(0);

  // Typewriter effect
  useEffect(() => {
    if (!typewriterActive) return;
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (isTyping && !isDeleting) {
      if (typewriterText.length < phrase.length) {
        timeout = setTimeout(() => setTypewriterText(phrase.slice(0, typewriterText.length + 1)), 45);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 1500);
      }
    } else if (isDeleting) {
      if (typewriterText.length > 0) {
        timeout = setTimeout(() => setTypewriterText(typewriterText.slice(0, -1)), 25);
      } else {
        setIsDeleting(false);
        setPhraseIdx((phraseIdx + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [typewriterText, isTyping, isDeleting, phraseIdx, typewriterActive]);

  // Keyboard handling
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const kb = window.innerHeight - window.visualViewport.height;
        setKbHeight(Math.max(0, kb));
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Fuzzy search results
  const fuzzyResults = searchQuery.trim().length > 0
    ? properties
        .filter(p => {
          const q = searchQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.quartier.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            getTypeLabel(p.type).toLowerCase().includes(q) ||
            p.price.toString().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const handleSelect = (id: string) => {
    onSelectProperty(id);
    onClose();
  };

  const handleSubmit = () => {
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      onClose();
    }
  };

  const recentSearches = JSON.parse(localStorage.getItem('sapsap_recent_searches') || '[]').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99]"
      style={{ bottom: kbHeight > 0 ? 0 : undefined }}
    >
      {/* Semi-transparent overlay on map */}
      <div
        className="absolute inset-0 bg-foreground/45"
        onClick={onClose}
      />

      {/* Search panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="absolute left-0 right-0 bg-card rounded-t-[20px]"
        style={{
          bottom: `calc(52px + env(safe-area-inset-bottom) + ${kbHeight}px)`,
          maxHeight: '70vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Search input */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder=""
              className="w-full h-11 rounded-full bg-muted border-none pl-10 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: 16 }} // Prevent iOS zoom
            />
            {/* Typewriter placeholder */}
            {typewriterActive && (
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60 pointer-events-none">
                {typewriterText}
                <span className="animate-pulse text-primary">|</span>
              </span>
            )}
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 overflow-y-auto scrollable" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          {/* Fuzzy results */}
          {fuzzyResults.length > 0 ? (
            <div className="space-y-1">
              {fuzzyResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left"
                >
                  <span className="text-base shrink-0">{getTypeEmoji(p.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.quartier} · {fmt(p.price)} FCFA</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length > 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun résultat pour "{searchQuery}"</p>
          ) : (
            <>
              {/* Popular searches */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Recherches populaires
                </h4>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map(s => (
                    <button
                      key={s}
                      onClick={() => { onSearchQueryChange(s); }}
                      className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground active:scale-[0.97] transition-transform"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Récents
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map((s: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => onSearchQueryChange(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter button */}
              <button
                onClick={onOpenFilters}
                className="w-full mt-4 py-3 rounded-xl bg-muted text-sm font-medium text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                ⚙️ Filtres avancés
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MobileSearchOverlay;
