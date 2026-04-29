import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, X, MapIcon } from 'lucide-react';
import { mockProperties, getTypeLabel, isTypeFurnished } from '@/lib/mockData';
import PropertyCard from '@/components/PropertyCard';
import FilterBar, { type FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';

const FAV_KEY = 'sapsap_favorites';
const FILTERS_KEY = 'sapsap_filters_v1';
const SEARCH_KEY = 'sapsap_search_query_v1';
const RECENT_KEY = 'sapsap_recent_searches';

function filterProperties(source: typeof mockProperties, q: string, f: FilterState) {
  const query = q.trim().toLowerCase();
  return source.filter(p => {
    if (p.status === 'rented' || p.available === false) return false;

    if (query) {
      const hay = [
        p.title,
        p.quartier,
        p.type,
        getTypeLabel(p.type),
        p.description ?? '',
        String(p.price),
      ].join(' ').toLowerCase();
      if (!hay.includes(query)) return false;
    }

    if (f.types.length > 0 && !f.types.includes(p.type)) return false;
    if (f.quartiers.length > 0 && !f.quartiers.includes(p.quartier)) return false;
    if (typeof f.priceMin === 'number' && p.price < f.priceMin) return false;
    if (typeof f.priceMax === 'number' && p.price > f.priceMax) return false;
    if (typeof f.bedroomsMin === 'number' && (p.bedrooms ?? 0) < f.bedroomsMin) return false;
    if (typeof f.surfaceMin === 'number' && (p.surface_area ?? 0) < f.surfaceMin) return false;
    if (f.furnishedOnly && !(isTypeFurnished(p.type) || p.furnished)) return false;

    return true;
  });
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (appliedQuery) next.set('q', appliedQuery); else next.delete('q');
    setSearchParams(next, { replace: true });
  }, [appliedQuery, searchParams, setSearchParams]);

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch { /* noop */ }
  }, [filters]);

  useEffect(() => {
    try { localStorage.setItem(SEARCH_KEY, appliedQuery); } catch { /* noop */ }
  }, [appliedQuery]);

  const results = useMemo(
    () => filterProperties(mockProperties, appliedQuery, filters),
    [appliedQuery, filters]
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
      case 'home':     navigate('/'); break;
      case 'map':      navigate('/'); break;
      case 'search':   navigate('/search'); break;
      case 'favorites':navigate('/?favorites=1'); break;
      case 'profile':  navigate('/mon-compte'); break;
    }
  };

  const activeFiltersCount =
    (filters.types?.length || 0) +
    (filters.quartiers?.length || 0) +
    (typeof filters.priceMin === 'number' ? 1 : 0) +
    (typeof filters.priceMax === 'number' ? 1 : 0) +
    (typeof filters.bedroomsMin === 'number' ? 1 : 0) +
    (typeof filters.surfaceMin === 'number' ? 1 : 0) +
    (filters.furnishedOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header
        className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-muted active:bg-muted"
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

          <button
            onClick={() => setShowFilters(v => !v)}
            className="relative min-h-[40px] px-3 flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-muted text-sm font-medium text-foreground"
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-2 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span>{' '}
            bien{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            {appliedQuery && (
              <> pour « <span className="text-foreground font-medium">{appliedQuery}</span> »</>
            )}
          </p>
          <button
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <MapIcon className="h-3.5 w-3.5" /> Voir sur la carte
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-card overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
              <FilterBar
                onFilterChange={(f) => setFilters(f)}
                onApply={(f) => { setFilters(f); setShowFilters(false); }}
                onReset={() => { setFilters(DEFAULT_FILTERS); setShowFilters(false); }}
                computeFilteredCount={(f) => filterProperties(mockProperties, appliedQuery, f).length}
              />
            </div>
          </motion.div>
        )}
      </header>

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
                property={p}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={handleViewDetails}
                onFocusOnMap={handleFocusOnMap}
              />
            ))}
          </motion.div>
        )}
      </main>

      <MobileBottomNav
        activeTab="search"
        onTabChange={handleBottomNav}
        favoritesCount={favorites.size}
      />
    </div>
  );
};

export default ResultatsPage;
