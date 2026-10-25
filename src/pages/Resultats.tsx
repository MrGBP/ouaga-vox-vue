import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Map as MapIcon, List as ListIcon, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { type Property, PROPERTY_TYPES, getTypeLabel, isTypeFurnished } from '@/lib/mockData';
import ListingMap from '@/components/listing/ListingMap';
import ListingCard from '@/components/listing/ListingCard';
import { fetchMergedProperties } from '@/lib/propertiesService';
import { useGeoCity } from '@/hooks/useGeoCity';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileDiscoveryCard from '@/components/listing/MobileDiscoveryCard';
import { Button } from '@/components/ui/button';
import MobileDraggableDrawer from '@/components/MobileDraggableDrawer';
import AIDescribeSheet from '@/components/AIDescribeSheet';
import { useFavorites } from '@/hooks/useFavorites';
import FilterBar, { type FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Header from '@/components/Header';
import { filterProperties } from '@/lib/filterProperties';
import { computeFilterOptions } from '@/lib/filterOptions';
import { prioritizeCity } from '@/lib/cityDiscovery';

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
    const sync = () => setFilters(current => {
      const saved = loadFilters();
      return JSON.stringify(current) === JSON.stringify(saved) ? current : saved;
    });
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);

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

  // Desktop/tablette : focus meublés + biens phares si aucun filtre
  const hasUserFilter = !!appliedQuery || JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const desktopResults = useMemo(() => {
    const furnishedOnly = results.filter(p => (isTypeFurnished(p.type) || !!p.furnished) && p.status !== 'rented');
    if (hasUserFilter) return furnishedOnly;
    const score = (p: Property) => ((p.comfort_rating || 0) + (p.security_rating || 0) + (p.accessibility_rating || 0));
    return prioritizeCity([...furnishedOnly].sort((a, b) => score(b) - score(a)), activeCity.name);
  }, [results, hasUserFilter, activeCity.name]);

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

  const handleViewDetails = useCallback((p: { id: string }) => {
    navigate(`/property/${encodeURIComponent(p.id)}`);
  }, [navigate]);

  const handleFocusOnMap = useCallback((id: string) => {
    setFocusedId(id);
    if (isMobile) setMobileView('map');
  }, [isMobile]);

  // Mobile view toggle
  const [mobileView, setMobileView] = useState<'list' | 'map'>(() => searchParams.get('view') === 'map' ? 'map' : 'list');

  const [filtersOpen, setFiltersOpen] = useState(() => {
    const open = sessionStorage.getItem('sapsap_results_filters') === '1';
    sessionStorage.removeItem('sapsap_results_filters');
    return open;
  });
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    if (focusedId && !results.some(property => property.id === focusedId)) setFocusedId(null);
  }, [results, focusedId]);
  const selected = results.find(p => p.id === focusedId);
  const openProperty = useCallback((id: string) => navigate(`/property/${encodeURIComponent(id)}`), [navigate]);
  const noHover = useCallback((_id: string | null) => {}, []);

  const handleBottomNav = (tab: string) => {
    switch (tab) {
      case 'home':
      case 'map': navigate('/'); break;
      case 'search': setMobileView('list'); break;
      case 'favorites': navigate('/?favorites=1'); break;
      case 'profile': navigate('/mon-compte'); break;
    }
  };

  useEffect(() => { window.scrollTo({ top: 0 }); }, [appliedQuery]);

  // Chips filtres actifs (Recognition over recall)
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.type !== 'all') activeChips.push({ key: 'type', label: getTypeLabel(filters.type), onRemove: () => persistFilters({ ...filters, type: 'all' }) });
  if (filters.quartier !== 'all') activeChips.push({ key: 'q', label: filters.quartier, onRemove: () => persistFilters({ ...filters, quartier: 'all' }) });
  if (filters.minBedrooms > 0) activeChips.push({ key: 'br', label: `${filters.minBedrooms}+ ch.`, onRemove: () => persistFilters({ ...filters, minBedrooms: 0 }) });
  if (filters.hasVirtualTour) activeChips.push({ key: 'vt', label: 'Visite 360°', onRemove: () => persistFilters({ ...filters, hasVirtualTour: false }) });

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
          <div className="px-3 h-14 flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour à l’accueil" className="shrink-0 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
            <Button variant="ghost" onClick={() => navigate('/search')} className="min-w-0 flex-1 justify-start text-left px-2"><span className="truncate">{appliedQuery || 'Explorer les logements'}</span></Button>
            <Button variant="ghost" size="icon" aria-label="SapSap AI" title="SapSap AI" onClick={() => { setFiltersOpen(false); setAiOpen(true); }} className="shrink-0 text-muted-foreground"><Sparkles className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Filtres" title="Filtres" onClick={() => { setAiOpen(false); setFiltersOpen(true); }} className="shrink-0"><SlidersHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto scrollable border-t border-border/50" role="tablist" aria-label="Type de logement">
            {[{ value: 'all', label: 'Tous', emoji: '' }, ...PROPERTY_TYPES].map(type => <Button key={type.value} variant="ghost" role="tab" aria-selected={filters.type === type.value} className={`shrink-0 rounded-none px-0 h-11 text-xs border-b-2 ${filters.type === type.value ? 'border-secondary text-primary' : 'border-transparent text-muted-foreground'}`} onClick={() => persistFilters({ ...filters, type: type.value })}>{type.emoji} {type.label}</Button>)}
          </div>
          {activeChips.length > 0 && <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollable">{activeChips.map(chip => <Button key={chip.key} variant="outline" size="sm" onClick={chip.onRemove} className="shrink-0 h-7 text-xs">{chip.label}<X className="h-3 w-3 ml-1" /></Button>)}</div>}
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
            <div className="fixed left-0 right-0 z-10" style={{ top: `calc(${activeChips.length ? 144 : 104}px + env(safe-area-inset-top))`, bottom: 'calc(56px + env(safe-area-inset-bottom))', visibility: mobileView === 'map' ? 'visible' : 'hidden', pointerEvents: mobileView === 'map' ? 'auto' : 'none' }}>
              <ListingMap properties={results} activeId={focusedId} favorites={favorites} onHover={noHover} onOpen={openProperty} onToggleFavorite={toggleFavorite} mobile visible={mobileView === 'map'} onSelect={setFocusedId} />
            </div>
            <div className={`px-4 pt-1 pb-20 ${mobileView === 'map' ? 'hidden' : ''}`}>
              {results.length === 0 ? <div className="py-20 text-center"><p className="font-semibold">Aucun logement ne correspond</p><Button variant="ghost" onClick={() => setFiltersOpen(true)} className="mt-2 text-muted-foreground">Ajuster mes critères</Button></div> : results.map(p => <MobileDiscoveryCard key={p.id} property={p} favorite={favorites.has(p.id)} onOpen={openProperty} onToggleFavorite={toggleFavorite} />)}
            </div>
            <AnimatePresence>{mobileView === 'map' && selected && <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="fixed left-3 right-3 z-40 bg-card rounded-lg px-3 shadow-elevation-3 border border-border" style={{ bottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
              <Button variant="ghost" size="icon" aria-label="Fermer l’aperçu" onClick={() => setFocusedId(null)} className="absolute -top-10 right-0 h-8 w-8 rounded-full bg-card shadow-elevation-1"><X className="h-4 w-4" /></Button>
              <MobileDiscoveryCard property={selected} favorite={favorites.has(selected.id)} onOpen={openProperty} onToggleFavorite={toggleFavorite} />
            </motion.div>}</AnimatePresence>
            <Button onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')} className="fixed left-1/2 -translate-x-1/2 z-40 rounded-full h-11 px-5 shadow-elevation-3 gap-2" style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}>
              {mobileView === 'list' ? <><MapIcon className="h-4 w-4" /> Carte</> : <><ListIcon className="h-4 w-4" /> Liste</>}
            </Button>
            <MobileDraggableDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} maxHeightVh={90} initialHeightVh={75} snapPoints={[0, 75, 90]} overlayZIndex={210} drawerZIndex={211}>
              <FilterBar forceOpen externalFilters={filters} quartiers={filterOpts.quartiers} totalCount={allProps.length} filteredCount={results.length} priceBounds={{ min: filterOpts.priceMin, max: filterOpts.priceMax }} availableTypeValues={filterOpts.typeValues} onFilterChange={f => { persistFilters(f); setFiltersOpen(false); }} onReset={() => { persistFilters(DEFAULT_FILTERS); setFiltersOpen(false); }} />
            </MobileDraggableDrawer>
            <AIDescribeSheet open={aiOpen} onClose={() => setAiOpen(false)} />
          </>
        ) : (
          <div className="container mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Colonne biens */}
            <div className="min-w-0 space-y-3">
              {!hasUserFilter && desktopResults.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Biens phares de la zone</p>
              )}
              {desktopResults.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                  <p className="text-base font-semibold text-foreground">Aucun bien ne correspond</p>
                  <p className="text-sm text-muted-foreground mt-1">Essayez d'élargir vos critères.</p>
                </div>
              ) : desktopResults.map((p) => (
                <ListingCard
                  key={p.id}
                  ref={(el) => { cardRefs.current[p.id] = el; }}
                  property={p}
                  active={(hoveredId || focusedId) === p.id}
                  favorite={favorites.has(p.id)}
                  onHover={setHoveredId}
                  onOpen={(id) => handleViewDetails({ id })}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>

            {/* Carte synchronisée */}
            <aside>
              <div className="sticky top-40 h-[calc(100vh-11rem)] rounded-3xl overflow-hidden border border-border shadow-elevation-1">
                <ListingMap
                  properties={desktopResults}
                  activeId={hoveredId || focusedId}
                  favorites={favorites}
                  onHover={(id) => {
                    setHoveredId(id);
                    if (id) cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  onOpen={(id) => handleViewDetails({ id })}
                  onToggleFavorite={toggleFavorite}
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
