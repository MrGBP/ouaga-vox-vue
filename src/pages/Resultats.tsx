import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search as SearchIcon, X, MapIcon } from 'lucide-react';
import { mockProperties } from '@/lib/mockData';
import PropertyCard from '@/components/PropertyCard';
import FilterBar, { type FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { filterProperties } from '@/lib/filterProperties';

const FAV_KEY = 'sapsap_favorites';
const FILTERS_KEY = 'sapsap_filters_v1';
const SEARCH_KEY = 'sapsap_search_query_v1';
const RECENT_KEY = 'sapsap_recent_searches';

const ResultatsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch { /* noop */ }
    return DEFAULT_FILTERS;
  });
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // Keep URL in sync with applied query so it's shareable / refresh-safe.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (appliedQuery) next.set('q', appliedQuery); else next.delete('q');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery]);

  // Persist filters and search globally (same keys as Index.tsx).
  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch { /* noop */ }
  }, [filters]);
  useEffect(() => {
    try { localStorage.setItem(SEARCH_KEY, appliedQuery); } catch { /* noop */ }
  }, [appliedQuery]);

  const quartierNames = useMemo(
    () => Array.from(new Set(mockProperties.map(p => p.quartier))).sort(),
    []
  );

  const results = useMemo(
    () => filterProperties(mockProperties, appliedQuery, filters, false, favorites),
    [appliedQuery, filters, favorites]
  );

  const totalAvailable = useMemo(
    () => mockProperties.filter(p => p.status !== 'rented' && p.available !== false).length,
    []
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(FAV_KEY, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleViewDetails = useCallback((p: { id: string }) => {
    navigate(`/property/${encodeURIComponent(p.id)}`);
  }, [navigate]);

  const handleFocusOnMap = useCallback((id: string) => {
    // Quitter la page résultats vers la carte globale, en focalisant le bien.
    navigate(`/?property=${encodeURIComponent(id)}`);
  }, [navigate]);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    setAppliedQuery(trimmed);
    if (trimmed) {
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        const list: string[] = raw ? JSON.parse(raw) : [];
        const next = [trimmed, ...list.filter(r => r !== trimmed)].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch { /* noop */ }
    }
  };

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'home':
      case 'map':
        // → carte globale Ouagadougou (Index reset)
        navigate('/');
        break;
      case 'search':
        navigate('/search');
        break;
      case 'favorites':
        navigate('/?favorites=1');
        break;
      case 'profile':
        navigate('/mon-compte');
        break;
    }
  };

  const computeDraftCount = useCallback(
    (draft: FilterState) => filterProperties(mockProperties, appliedQuery, draft, false, favorites).length,
    [appliedQuery, favorites]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* === Sticky compact header (no logo, no slogan, no hero) === */}
      <header
        className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-muted active:bg-muted shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>

          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(query)}
              placeholder="Modifier la recherche…"
              className="w-full h-10 rounded-full bg-muted border-none pl-10 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: 16 }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); submitSearch(''); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Effacer"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* FilterBar already renders its own trigger button + drawer */}
          <div className="shrink-0">
            <FilterBar
              quartiers={quartierNames}
              totalCount={totalAvailable}
              filteredCount={results.length}
              onFilterChange={(f) => setFilters(f)}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              externalFilters={filters}
              computeFilteredCount={computeDraftCount}
              allProperties={mockProperties}
            />
          </div>
        </div>

        {/* Counter row */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-2 flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-semibold text-foreground">{results.length}</span>{' '}
            bien{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            {appliedQuery && (
              <> pour « <span className="text-foreground font-medium">{appliedQuery}</span> »</>
            )}
          </p>
          <button
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
          >
            <MapIcon className="h-3.5 w-3.5" /> Voir sur la carte
          </button>
        </div>
      </header>

      {/* === Visual results grid (cards, not a text list) === */}
      <main
        className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-base font-semibold text-foreground">Aucun bien ne correspond</p>
            <p className="text-sm text-muted-foreground mt-1">
              Essayez d'élargir votre recherche ou d'ajuster les filtres.
            </p>
            <button
              onClick={() => { setQuery(''); submitSearch(''); setFilters(DEFAULT_FILTERS); }}
              className="mt-5 inline-flex items-center px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {results.map((p) => (
              <PropertyCard
                key={p.id}
                property={p as any}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={handleViewDetails}
                onFocusOnMap={handleFocusOnMap}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Mobile bottom nav (Carte → / global Ouaga) */}
      <MobileBottomNav
        activeTab="search"
        onTabChange={handleBottomNav}
        favoritesCount={favorites.size}
      />
    </div>
  );
};

export default ResultatsPage;
