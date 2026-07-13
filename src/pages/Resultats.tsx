import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Map as MapIcon, List as ListIcon, SlidersHorizontal, X } from 'lucide-react';
import { mockProperties, type Property, mockPois, mockQuartiers } from '@/lib/mockData';
import { fetchMergedProperties } from '@/lib/propertiesService';
import { useGeoCity } from '@/hooks/useGeoCity';
import { useIsMobile } from '@/hooks/use-mobile';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import FilterBar, { type FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Header from '@/components/Header';
import { filterProperties } from '@/lib/filterProperties';
import { computeFilterOptions } from '@/lib/filterOptions';

const FAV_KEY = 'sapsap_favorites';
const FILTERS_KEY = 'sapsap_filters_v1';

const ResultatsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const appliedQuery = searchParams.get('q') || '';

  const loadFilters = (): FilterState => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch { /* noop */ }
    return DEFAULT_FILTERS;
  };
  const [filters, setFilters] = useState<FilterState>(loadFilters);
  useEffect(() => {
    const sync = () => setFilters(loadFilters());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  const [allProps, setAllProps] = useState<Property[]>([]);
  const { activeCity } = useGeoCity();
  useEffect(() => {
    let alive = true;
    fetchMergedProperties(activeCity?.country).then(p => { if (alive) setAllProps(p as any); }).catch(() => {});
    return () => { alive = false; };
  }, [activeCity?.country]);

  const results = useMemo(
    () => filterProperties(allProps, appliedQuery, filters, false, favorites, activeCity?.name),
    [allProps, appliedQuery, filters, favorites, activeCity?.name]
  );

  const filterOpts = useMemo(() => computeFilterOptions(allProps as any), [allProps]);

  // Sync bidirectionnel carte ⇄ liste (Nielsen : visibility of system status)
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleMapClick = useCallback((id: string) => {
    setFocusedId(id);
    // Scroll to card
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

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
    setFocusedId(id);
    if (isMobile) setMobileView('map');
  }, [isMobile]);

  // Mobile view toggle
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'home':
      case 'map': navigate('/'); break;
      case 'search': navigate('/search'); break;
      case 'favorites': navigate('/?favorites=1'); break;
      case 'profile': navigate('/mon-compte'); break;
    }
  };

  useEffect(() => { window.scrollTo({ top: 0 }); }, [appliedQuery]);

  // Chips filtres actifs (Recognition over recall)
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.type !== 'all') activeChips.push({ key: 'type', label: filters.type, onRemove: () => setFilters(f => ({ ...f, type: 'all' })) });
  if (filters.quartier !== 'all') activeChips.push({ key: 'q', label: filters.quartier, onRemove: () => setFilters(f => ({ ...f, quartier: 'all' })) });
  if (filters.minBedrooms > 0) activeChips.push({ key: 'br', label: `${filters.minBedrooms}+ ch.`, onRemove: () => setFilters(f => ({ ...f, minBedrooms: 0 })) });
  if (filters.hasVirtualTour) activeChips.push({ key: 'vt', label: 'Visite 360°', onRemove: () => setFilters(f => ({ ...f, hasVirtualTour: false })) });

  const persistFilters = (f: FilterState) => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(f)); } catch { /* noop */ }
    setFilters(f);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isMobile ? (
        <header
          className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="px-3 h-14 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              {appliedQuery && <p className="text-sm font-semibold text-foreground truncate">« {appliedQuery} »</p>}
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{results.length}</span> résultat{results.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>
      ) : (
        <Header />
      )}

      {/* Sub-header : query + count + chips (desktop) */}
      {!isMobile && (
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <div className="flex-1">
                {appliedQuery && (
                  <p className="font-display text-lg font-bold text-foreground">Résultats pour « {appliedQuery} »</p>
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{results.length}</span> bien{results.length > 1 ? 's' : ''} disponible{results.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <FilterBar
              onFilterChange={persistFilters}
              onReset={() => persistFilters(DEFAULT_FILTERS)}
              quartiers={filterOpts.quartiers}
              totalCount={allProps.length}
              filteredCount={results.length}
              favoritesCount={favorites.size}
              showFavoritesOnly={false}
              onToggleFavoritesView={() => {}}
              computeFilteredCount={() => results.length}
              externalFilters={filters}
              priceBounds={{ min: filterOpts.priceMin, max: filterOpts.priceMax }}
              availableTypeValues={filterOpts.typeValues}
              onAfterApply={persistFilters}
            />

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeChips.map(c => (
                  <button
                    key={c.key}
                    onClick={c.onRemove}
                    className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  >
                    {c.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Main split layout : cards + map === */}
      <main
        className="flex-1 w-full"
        style={{ paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : 0 }}
      >
        {isMobile ? (
          <>
            <AnimatePresence mode="wait">
              {mobileView === 'list' ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-3 py-3"
                >
                  {results.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-5xl mb-4">🔍</p>
                      <p className="text-base font-semibold text-foreground">Aucun bien</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
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
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 top-14 bottom-16 z-10"
                >
                  <InteractiveMap
                    properties={results as any}
                    pois={mockPois as any}
                    quartiers={mockQuartiers as any}
                    onPropertyClick={handleMapClick}
                    focusedPropertyId={focusedId}
                    onFocusClear={() => setFocusedId(null)}
                    favoriteIds={favorites}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle flottant Liste ⇄ Carte (Fitts's Law : gros bouton central) */}
            <button
              onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
              className="fixed left-1/2 -translate-x-1/2 z-40 bg-foreground text-background rounded-full h-12 px-5 shadow-elevation-3 flex items-center gap-2 font-semibold text-sm active:scale-95 transition-transform"
              style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
            >
              {mobileView === 'list' ? <><MapIcon className="h-4 w-4" /> Carte</> : <><ListIcon className="h-4 w-4" /> Liste</>}
            </button>
          </>
        ) : (
          <div className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_620px] gap-6">
            {/* Colonne cartes */}
            <div className="min-w-0">
              {results.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-base font-semibold text-foreground">Aucun bien ne correspond</p>
                  <p className="text-sm text-muted-foreground mt-1">Essayez d'élargir vos critères.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((p) => (
                    <div
                      key={p.id}
                      ref={(el) => { cardRefs.current[p.id] = el; }}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`transition-all duration-base ${focusedId === p.id ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''}`}
                    >
                      <PropertyCard
                        property={p as any}
                        isFavorite={favorites.has(p.id)}
                        onToggleFavorite={toggleFavorite}
                        onViewDetails={handleViewDetails}
                        onFocusOnMap={handleFocusOnMap}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne carte — sticky pleine hauteur (Airbnb) */}
            <aside className="hidden lg:block">
              <div className="sticky top-40 h-[calc(100vh-11rem)] rounded-2xl overflow-hidden border border-border shadow-elevation-1">
                <InteractiveMap
                  properties={results as any}
                  pois={mockPois as any}
                  quartiers={mockQuartiers as any}
                  onPropertyClick={handleMapClick}
                  focusedPropertyId={focusedId || hoveredId}
                  onFocusClear={() => setFocusedId(null)}
                  favoriteIds={favorites}
                />
              </div>
            </aside>
          </div>
        )}
      </main>

      {isMobile && (
        <MobileBottomNav
          activeTab="search"
          onTabChange={handleBottomNav}
          favoritesCount={favorites.size}
        />
      )}
    </div>
  );
};

export default ResultatsPage;
