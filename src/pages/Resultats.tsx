import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { mockProperties } from '@/lib/mockData';
import PropertyCard from '@/components/PropertyCard';
import { type FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { filterProperties } from '@/lib/filterProperties';

const FAV_KEY = 'sapsap_favorites';
const FILTERS_KEY = 'sapsap_filters_v1';

const ResultatsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appliedQuery = searchParams.get('q') || '';

  // Filters are read from localStorage (kept in sync with the rest of the
  // platform) but not editable here — the user reopens the search overlay
  // via the navbar to refine.
  const [filters] = useState<FilterState>(() => {
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

  const results = useMemo(
    () => filterProperties(mockProperties, appliedQuery, filters, false, favorites),
    [appliedQuery, filters, favorites]
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

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'home':
      case 'map':
        navigate('/'); // → carte globale Ouagadougou
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

  // Scroll to top on new search
  useEffect(() => { window.scrollTo({ top: 0 }); }, [appliedQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* === Minimal header: just a back button. No search bar, no filters,
              no counter — focus stays entirely on the property cards.
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

      {/* === Visual results grid (cards only) === */}
      <main
        className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-2"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-base font-semibold text-foreground">Aucun bien ne correspond</p>
            <p className="text-sm text-muted-foreground mt-1">
              Relancez une recherche depuis l'icône Chercher de la barre de navigation.
            </p>
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
