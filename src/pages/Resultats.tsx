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
      {/* === Minimal header: just a back button. No search, no filters,
              no counter — focus stays on the property cards.
              The user re-opens the search via the navbar "Chercher" tab. === */}
      <header
        className="sticky top-0 z-30 bg-background/80 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 flex items-center">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-muted active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
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
