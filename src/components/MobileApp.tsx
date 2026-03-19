import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNav } from '@/contexts/NavigationContext';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { isTypeFurnished, pricePerNight } from '@/lib/mockData';
import { FilterState } from '@/components/FilterBar';
import UniversalSheet, { UniversalSheetHandle } from '@/components/mobile/UniversalSheet';
import MobileNavbar from '@/components/MobileNavbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileSearchOverlay from '@/components/MobileSearchOverlay';
import MobileDraggableDrawer from '@/components/MobileDraggableDrawer';
import FilterBar from '@/components/FilterBar';
import InteractiveMap from '@/components/InteractiveMap';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import PropertyCard from '@/components/PropertyCard';
import VirtualTourModal from '@/components/VirtualTourModal';
import TestimonialsSection from '@/components/TestimonialsSection';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import AIComparator from '@/components/AIComparator';
import Footer from '@/components/Footer';
import { ChevronLeft, ChevronRight, X, Search, Heart, Sparkles, Maximize2, ChevronUp, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/ouaga-hero.jpg';

interface Property {
  id: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  quartier: string;
  address?: string;
  latitude: number;
  longitude: number;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  comfort_rating?: number;
  security_rating?: number;
  accessibility_rating?: number;
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
  has_video?: boolean;
  video_url?: string;
  status?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_photo?: string;
  year_built?: number;
  has_ac?: boolean;
  has_guardian?: boolean;
  has_generator?: boolean;
  has_garden?: boolean;
  has_water?: boolean;
  has_internet?: boolean;
  has_kitchen?: boolean;
  has_fridge?: boolean;
  has_stove?: boolean;
  has_tv?: boolean;
  has_terrace?: boolean;
  has_pool?: boolean;
  has_parking_int?: boolean;
  has_parking_ext?: boolean;
  has_fence?: boolean;
  has_auto_gate?: boolean;
  has_cameras?: boolean;
  has_paved_road?: boolean;
  has_pmr?: boolean;
  has_water_tower?: boolean;
  is_new_build?: boolean;
  is_renovated?: boolean;
  pets_allowed?: boolean;
  furnished?: boolean;
  created_at?: string;
}

interface POI {
  id: string;
  name: string;
  type: string;
  quartier: string;
  latitude: number;
  longitude: number;
}

interface Quartier {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  latitude: number;
  longitude: number;
}

export interface MobileAppProps {
  properties: Property[];
  filteredProperties: Property[];
  pois: POI[];
  quartiers: Quartier[];
  favorites: Set<string>;
  filters: FilterState;
  searchQuery: string;
  detailProperty: Property | null;
  activeQuartier: string | null;
  focusedPropertyId: string | null;
  mapResetTrigger: number;
  mapQuartierTrigger: string | null;
  showFavoritesOnly: boolean;
  idxTags: { characteristic: string; emoji: string; label: string }[];
  onFilterChange: (f: FilterState) => void;
  onSearch: (q: string) => void;
  onSearchQueryChange: (q: string) => void;
  onToggleFavorite: (id: string) => void;
  onPropertyClick: (id: string) => void;
  onViewDetails: (p: Property) => void;
  onExploreOnMap: (id: string) => void;
  onFocusOnMap: (id: string) => void;
  onFullReset: () => void;
  onQuartierChange: (q: string | null) => void;
  onExternalQuartierHandled: () => void;
  onDetailClose: () => void;
  onFocusClear: () => void;
  onMobileTabChange: (tab: string) => void;
  onRemoveIdxTag: (characteristic: string) => void;
  computeFilteredCount: (f: FilterState) => number;
}

const ITEMS_PER_PAGE = 25;

// Carousel with first-visit swipe hint animation
const CarouselWithSwipeHint = ({ properties, activeQuartier, favorites, formatDisplayPrice, onPropertyClick }: {
  properties: Property[];
  activeQuartier: string;
  favorites: Set<string>;
  formatDisplayPrice: (p: Property) => { price: string; suffix: string; nightPrice: string | null; nightSuffix: string | null };
  onPropertyClick: (id: string) => void;
}) => {
  useEffect(() => {
    const hinted = localStorage.getItem('sapsap_swipe_hinted');
    if (hinted) return;
    const timer = setTimeout(() => {
      const firstCard = document.querySelector('.carousel-card-first');
      if (!firstCard) return;
      firstCard.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0px)' },
      ], { duration: 700, easing: 'ease-in-out' });
      localStorage.setItem('sapsap_swipe_hinted', 'true');
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeQuartier]);

  return (
    <div className="px-3">
      <div className="flex gap-2.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollable" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {properties.map((p, i) => {
          const dp = formatDisplayPrice(p);
          const isFav = favorites.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onPropertyClick(p.id)}
              className={`shrink-0 bg-card rounded-[14px] overflow-hidden shadow-card border border-border text-left active:scale-[0.97] transition-transform${i === 0 ? ' carousel-card-first' : ''}`}
              style={{ width: 220, height: 160, scrollSnapAlign: 'start' }}
            >
              <div className="relative h-[100px]">
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop'} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                {isFav && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Heart className="h-3 w-3 text-secondary-foreground fill-current" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.quartier}</span>
                  {dp.nightPrice ? (
                    <span className="text-[11px] font-bold text-primary">{dp.nightPrice} /n</span>
                  ) : (
                    <span className="text-[11px] font-bold text-primary">{dp.price} /m</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function MobileApp(props: MobileAppProps) {
  const nav = useNav();
  useSwipeBack();

  const [mobileTab, setMobileTab] = useState('home');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [favViewMode, setFavViewMode] = useState<'list' | 'map'>('list');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTransition, setPageTransition] = useState(false);
  const sheetRef = useRef<UniversalSheetHandle>(null);

  // Body scroll lock when filters or search open
  useEffect(() => {
    if (showMobileFilters || showMobileSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilters, showMobileSearch]);

  // Sync navigation context → visual states (swipe back / Android back)
  useEffect(() => {
    const screen = nav.current.screen;
    if (screen === 'carte-niveau1') {
      props.onDetailClose();
      props.onFocusClear();
      props.onQuartierChange(null);
    } else if (screen === 'carte-niveau2') {
      props.onDetailClose();
      props.onFocusClear();
    }
  }, [nav.current.screen]);

  // Helpers
  const availableProperties = useCallback((list: Property[]) => {
    return list.filter(p => p.status !== 'rented' && p.available !== false);
  }, []);

  const navLevel: 1 | 2 | 3 = props.detailProperty ? 3 : props.activeQuartier ? 2 : 1;

  const quartierProperties = props.activeQuartier
    ? availableProperties(props.filteredProperties).filter(p => p.quartier === props.activeQuartier)
    : [];

  const favoriteProperties = props.properties.filter(p => props.favorites.has(p.id));
  const mapProperties = (() => {
    const source = props.filteredProperties?.length > 0
      ? props.filteredProperties
      : props.properties;
    return source.filter(p => p.status !== 'rented' && p.available !== false);
  })();
  const displayProperties = availableProperties(props.filteredProperties);
  const totalPages = Math.ceil(displayProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = displayProperties.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const similarProperties = props.detailProperty
    ? availableProperties(props.properties).filter(p => p.id !== props.detailProperty!.id && (p.quartier === props.detailProperty!.quartier || p.type === props.detailProperty!.type)).slice(0, 3)
    : [];

  const formatDisplayPrice = (p: Property) => {
    const fmtN = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
    const isFurnished = isTypeFurnished(p.type) || p.furnished;
    if (isFurnished) {
      const night = pricePerNight(p.price);
      return { price: fmtN(p.price), suffix: '/mois', nightPrice: fmtN(night), nightSuffix: '/nuit' };
    }
    return { price: fmtN(p.price), suffix: '/mois', nightPrice: null, nightSuffix: null };
  };

  const handlePageChange = (dir: 1 | -1) => {
    setPageTransition(true);
    setTimeout(() => {
      setCurrentPage(p => p + dir);
      setTimeout(() => setPageTransition(false), 50);
    }, 200);
  };

  // Stable callbacks for InteractiveMap (prevent infinite re-render loops)
  const handleQuartierChange = useCallback((q: string | null) => {
    props.onQuartierChange(q);
    if (q) {
      nav.push({ screen: 'carte-niveau2', quartierName: q });
    }
  }, [props.onQuartierChange, nav]);

  const handleFocusClear = useCallback(() => {
    props.onFocusClear();
  }, [props.onFocusClear]);

  const handlePropertyClick = useCallback((id: string) => {
    props.onPropertyClick(id);
  }, [props.onPropertyClick]);

  // Navigation handlers
  const handleNavBack = () => {
    if (navLevel === 3) {
      props.onDetailClose();
      props.onFocusClear();
    } else if (navLevel === 2) {
      props.onQuartierChange(null);
    }
    if (nav.canGoBack) nav.pop();
  };

  const handleNavHome = () => {
    props.onDetailClose();
    props.onFocusClear();
    props.onQuartierChange(null);
    nav.popToRoot();
  };

  const handleMobileTabChange = (tab: string) => {
    props.onDetailClose();
    props.onFocusClear();

    if (tab === 'search') {
      setShowMobileSearch(true);
      setMobileTab('map');
      return;
    }

    setMobileTab(tab);
    setShowMobileSearch(false);
    props.onMobileTabChange(tab);
  };

  const handleSheetHeightChange = useCallback((h: number) => {
    setSheetHeight(h);
  }, []);

  const handleRecentlyViewedClick = (id: string) => {
    const prop = props.properties.find(p => p.id === id);
    if (prop) props.onViewDetails(prop);
  };

  // Sheet header content based on level
  const getSheetHeader = () => {
    if (navLevel === 2 && props.activeQuartier) {
      const count = quartierProperties.length;
      return (
        <div className="flex items-center justify-between">
          <button
            onClick={handleNavBack}
            className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium active:scale-[0.97] transition-transform"
          >
            <ChevronLeft className="h-3 w-3" />
            Ouagadougou › {props.activeQuartier} · {count} bien{count > 1 ? 's' : ''}
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowMobileSearch(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={handleNavHome} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-4 w-4 text-secondary" />
            </button>
          </div>
        </div>
      );
    }
    if (navLevel === 3 && props.detailProperty) {
      return (
        <div className="flex items-center justify-between">
          <button
            onClick={handleNavBack}
            className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium active:scale-[0.97] transition-transform"
          >
            <ChevronLeft className="h-3 w-3" />
            {props.activeQuartier || props.detailProperty.quartier}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sheetRef.current?.close()}
              style={{
                width: 34, height: 34, background: '#f0f4ff', border: 'none',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
              title="Explorer sur la carte"
            >
              <Maximize2 size={16} color="#1a3560" />
            </button>
            <button onClick={() => setShowMobileSearch(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  // Sheet body content based on level
  const getSheetContent = () => {
    if (navLevel === 2 && props.activeQuartier && !props.detailProperty) {
      return (
        <CarouselWithSwipeHint
          properties={quartierProperties}
          activeQuartier={props.activeQuartier}
          favorites={props.favorites}
          formatDisplayPrice={formatDisplayPrice}
          onPropertyClick={props.onPropertyClick}
        />
      );
    }
    if (navLevel === 3 && props.detailProperty) {
      return (
        <div>
          <PropertyDetailPanel
            property={props.detailProperty}
            onClose={() => { props.onDetailClose(); props.onFocusClear(); }}
            pois={props.pois}
            isFavorite={props.favorites.has(props.detailProperty.id)}
            onToggleFavorite={props.onToggleFavorite}
            onViewTour={(p) => { setSelectedProperty(p); setModalOpen(true); }}
            similarProperties={similarProperties}
            onSelectProperty={(id) => {
              const p = props.properties.find(pr => pr.id === id);
              if (p) { props.onViewDetails(p); addToRecentlyViewed(p); }
            }}
            onExploreOnMap={props.onExploreOnMap}
            isMobileOverride={true}
          />
        </div>
      );
    }
    return null;
  };

  const quartierNames = [...new Set(props.properties.map(p => p.quartier))].sort();

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-background">
      {/* ═══ CARTE FIXE PLEIN ÉCRAN ═══ */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full">
          <InteractiveMap
            properties={mapProperties} pois={props.pois} quartiers={props.quartiers}
            onPropertyClick={props.onPropertyClick} focusedPropertyId={props.focusedPropertyId}
            onFocusClear={() => { props.onFocusClear(); }}
            activeFilters={props.filters} externalQuartierSelect={props.mapQuartierTrigger}
            onExternalQuartierHandled={props.onExternalQuartierHandled}
            panelOpen={false} onQuartierChange={(q) => {
              props.onQuartierChange(q);
              if (q) nav.push({ screen: 'carte-niveau2', quartierName: q });
            }} resetTrigger={props.mapResetTrigger}
            favoriteIds={props.favorites}
            sheetHeight={sheetHeight}
          />
        </div>
      </div>

      {/* ═══ NAVBAR ═══ */}
      {mobileTab === 'map' ? (
        <MobileNavbar
          level={navLevel}
          quartierName={props.activeQuartier || undefined}
          quartierCount={quartierProperties.length}
          propertyTitle={props.detailProperty?.title}
          propertyQuartier={props.detailProperty?.quartier}
          onBack={handleNavBack}
          onHome={handleNavHome}
          depth={nav.depth}
          isExploring={sheetHeight <= 10 && navLevel === 3}
        />
      ) : mobileTab === 'home' ? (
        <MobileNavbar level={1} />
      ) : null}

      {/* ═══ FULLSCREEN TAB PAGES (covers map) ═══ */}
      <AnimatePresence mode="wait">
        {/* HOME TAB */}
        {mobileTab === 'home' && (
          <motion.div
            key="home-tab"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-10 bg-background overflow-y-auto scrollable"
            style={{ paddingTop: 52, paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            {/* Hero */}
            <section className="relative h-[45vh] overflow-hidden">
              <img src={heroImage} alt="Ouagadougou" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                <h2 className="text-3xl font-bold text-card leading-tight">
                  Mon bien Immo<br />en un clic
                </h2>
                <p className="text-xs text-card/70 mt-2">
                  + 100 biens · Maisons · Villas · Studios · Bureaux
                </p>
              </div>
            </section>

            {/* Filter bar */}
            <section className="px-4 pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground active:scale-[0.98] transition-all shadow-sm"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  ⚙️ Filtres
                </button>
                <button
                  onClick={() => { setMobileTab('favorites'); handleMobileTabChange('favorites'); }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all border active:scale-[0.98] ${
                    props.showFavoritesOnly
                      ? 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-card text-muted-foreground border-border'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${props.showFavoritesOnly ? 'fill-current' : ''}`} />
                  ❤️ Favoris {props.favorites.size > 0 && `(${props.favorites.size})`}
                </button>
              </div>
              {/* IDX Tags */}
              {props.idxTags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {props.idxTags.map(tag => (
                    <span key={tag.characteristic} className="inline-flex items-center gap-1 bg-card text-foreground rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm border border-border">
                      {tag.emoji} {tag.label}
                      <button onClick={() => props.onRemoveIdxTag(tag.characteristic)} className="ml-0.5 hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Featured carousel */}
            <section className="px-4 py-5">
              <h2 className="text-lg font-bold text-foreground mb-3">Biens mis en avant</h2>
              <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollable">
                {availableProperties(props.properties).slice(0, 8).map(p => {
                  const dp = formatDisplayPrice(p);
                  return (
                    <button key={p.id} onClick={() => props.onViewDetails(p)}
                      className="shrink-0 w-56 snap-start bg-card border border-border rounded-xl overflow-hidden shadow-card text-left active:scale-[0.97] transition-transform"
                    >
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'} alt={p.title} className="w-full h-32 object-cover" loading="lazy" />
                      <div className="p-2.5">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.quartier}</p>
                        {dp.nightPrice ? (
                          <p className="text-sm font-bold text-primary mt-1">{dp.nightPrice} FCFA <span className="text-xs font-normal text-muted-foreground">/nuit</span></p>
                        ) : (
                          <p className="text-sm font-bold text-primary mt-1">{dp.price} FCFA <span className="text-xs font-normal text-muted-foreground">/mois</span></p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Properties grid */}
            <section className="px-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tous les biens</h2>
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-bold">{displayProperties.length}</span> résultat{displayProperties.length > 1 ? 's' : ''}
                </span>
              </div>
              {paginatedProperties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedProperties.map(p => (
                      <PropertyCard key={p.id} property={p as any} onViewDetails={props.onViewDetails as any} isFavorite={props.favorites.has(p.id)} onToggleFavorite={props.onToggleFavorite} onFocusOnMap={props.onFocusOnMap} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => handlePageChange(-1)} className="h-10 w-10 disabled:opacity-30">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                      <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => handlePageChange(1)} className="h-10 w-10 disabled:opacity-30">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">Aucun bien trouvé</p>
                  <Button variant="outline" size="sm" onClick={props.onFullReset} className="mt-3 gap-2">
                    <RotateCcw className="h-3 w-3" /> Réinitialiser
                  </Button>
                </div>
              )}
            </section>

            <TestimonialsSection />
            <RecentlyViewed onViewProperty={handleRecentlyViewedClick} />

            {/* SapSap AI Engine section */}
            <section className="px-4 py-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-foreground">SapSap AI Engine</h2>
              </div>
              <AIComparator favorites={favoriteProperties} priorities={[]} />
            </section>

            <Footer />
          </motion.div>
        )}

        {/* FAVORITES TAB — list mode */}
        {mobileTab === 'favorites' && favViewMode === 'list' && (
          <motion.div
            key="fav-list-tab"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 bg-background overflow-y-auto scrollable"
            style={{ paddingTop: 52, paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            <nav
              className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-3 no-select"
              style={{ height: 52, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">❤️ Mes favoris</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setFavViewMode('list')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-card text-foreground shadow-sm">
                  ☰ Liste
                </button>
                <button onClick={() => setFavViewMode('map')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground">
                  🗺️ Carte
                </button>
              </div>
            </nav>
            <div className="px-4 pt-4">
              {favoriteProperties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {favoriteProperties.map(p => (
                      <PropertyCard key={p.id} property={p as any} onViewDetails={props.onViewDetails as any} isFavorite={true} onToggleFavorite={props.onToggleFavorite} onFocusOnMap={props.onFocusOnMap} />
                    ))}
                  </div>
                  <div className="mt-6 bg-card border border-border rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Récapitulatif</h4>
                    <p className="text-sm text-foreground">
                      {favoriteProperties.length} bien{favoriteProperties.length > 1 ? 's' : ''} en favoris
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Budget moyen : {new Intl.NumberFormat('fr-FR').format(Math.round(favoriteProperties.reduce((s, p) => s + p.price, 0) / favoriteProperties.length))} FCFA/mois
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">❤️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucun favori pour l'instant</h3>
                  <p className="text-sm text-muted-foreground mb-6">Swipez une card vers la droite pour ajouter</p>
                  <Button onClick={() => handleMobileTabChange('map')} className="bg-primary text-primary-foreground gap-2">
                    Explorer les biens →
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* FAVORITES TAB — map mode */}
        {mobileTab === 'favorites' && favViewMode === 'map' && (
          <motion.div key="fav-map-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <nav
              className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-3 no-select"
              style={{ height: 52, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">❤️ Favoris sur la carte</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setFavViewMode('list')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground">
                  ☰ Liste
                </button>
                <button onClick={() => setFavViewMode('map')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-card text-foreground shadow-sm">
                  🗺️ Carte
                </button>
              </div>
            </nav>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {mobileTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 bg-background overflow-y-auto scrollable"
            style={{ paddingTop: 52, paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            <nav
              className="fixed top-0 left-0 right-0 z-[80] flex items-center px-3 no-select"
              style={{ height: 52, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">👤 Profil</span>
            </nav>
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Connectez-vous</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Connectez-vous pour accéder à votre profil, vos réservations et vos alertes.
              </p>
              <Button className="bg-primary text-primary-foreground w-full max-w-xs mb-3">Se connecter</Button>
              <Button variant="outline" className="w-full max-w-xs">Créer un compte</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAP TAB — Universal Sheet ═══ */}
      {mobileTab === 'map' && (props.activeQuartier || props.detailProperty) && (
        <UniversalSheet
          ref={sheetRef}
          sheetKey={`map-${navLevel}-${props.activeQuartier || ''}-${props.detailProperty?.id || ''}`}
          initialSnapVh={40}
          headerContent={getSheetHeader()}
          onHeightChange={handleSheetHeightChange}
        >
          {getSheetContent()}
        </UniversalSheet>
      )}

      {/* ═══ FLOATING "VOIR LES INFOS" BUTTON (explore mode) ═══ */}
      {sheetHeight <= 10 && navLevel === 3 && mobileTab === 'map' && (
        <button
          onClick={() => sheetRef.current?.snapDefault()}
          style={{
            position: 'fixed', bottom: 'calc(68px + env(safe-area-inset-bottom))',
            left: '50%', transform: 'translateX(-50%)', zIndex: 40,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', border: '0.5px solid #e5e7eb',
            borderRadius: 9999, padding: '10px 20px', fontSize: 13, fontWeight: 600,
            color: '#1a3560', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer',
          }}
        >
          <ChevronUp size={16} />
          Voir les infos
        </button>
      )}

      {/* Floating AI button */}
      {mobileTab === 'map' && navLevel === 1 && (
        <button
          className="fixed z-30 right-3 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-warm no-select"
          style={{ bottom: 'calc(62px + env(safe-area-inset-bottom))' }}
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* ═══ SEARCH OVERLAY ═══ */}
      <AnimatePresence>
        {showMobileSearch && (
          <MobileSearchOverlay
            properties={availableProperties(props.properties) as any}
            onClose={() => setShowMobileSearch(false)}
            onSelectProperty={(id) => {
              const prop = props.properties.find(p => p.id === id);
              if (prop) {
                if (props.activeQuartier && prop.quartier !== props.activeQuartier) {
                  props.onQuartierChange(prop.quartier);
                } else if (!props.activeQuartier) {
                  props.onQuartierChange(prop.quartier);
                }
                setMobileTab('map');
                props.onViewDetails(prop);
                addToRecentlyViewed(prop);
                nav.push({
                  screen: 'carte-niveau3',
                  propertyId: id,
                  propertyTitle: prop.title,
                  propertyQuartier: prop.quartier,
                });
              }
              setShowMobileSearch(false);
            }}
            onSearchSubmit={props.onSearch}
            searchQuery={props.searchQuery}
            onSearchQueryChange={props.onSearchQueryChange}
            onOpenFilters={() => {
              setShowMobileSearch(false);
              setShowMobileFilters(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ MOBILE FILTER DRAWER ═══ */}
      <MobileDraggableDrawer
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        maxHeightVh={75}
        initialHeightVh={65}
        snapPoints={[0, 40, 60, 75]}
        overlayZIndex={150}
        drawerZIndex={151}
      >
        <div className="px-4 pb-4">
          <FilterBar
            onFilterChange={(f) => { props.onFilterChange(f); setShowMobileFilters(false); }}
            onReset={() => { props.onFullReset(); setShowMobileFilters(false); }}
            quartiers={quartierNames}
            totalCount={availableProperties(props.properties).length}
            filteredCount={displayProperties.length}
            favoritesCount={props.favorites.size}
            showFavoritesOnly={props.showFavoritesOnly}
            computeFilteredCount={props.computeFilteredCount}
            externalFilters={props.filters}
          />
        </div>
      </MobileDraggableDrawer>

      {/* ═══ HOME TAB — Property detail as UniversalSheet ═══ */}
      {mobileTab === 'home' && props.detailProperty && (
        <UniversalSheet
          sheetKey={`home-detail-${props.detailProperty.id}`}
          initialSnapVh={40}
          headerContent={
            <div className="flex items-center gap-2">
              <button
                onClick={() => { props.onDetailClose(); props.onFocusClear(); }}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <ChevronLeft className="h-4 w-4 text-primary-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground truncate flex-1">{props.detailProperty.title}</span>
            </div>
          }
        >
          <PropertyDetailPanel
            property={props.detailProperty}
            onClose={() => { props.onDetailClose(); props.onFocusClear(); }}
            pois={props.pois}
            isFavorite={props.favorites.has(props.detailProperty.id)}
            onToggleFavorite={props.onToggleFavorite}
            onViewTour={(p) => { setSelectedProperty(p); setModalOpen(true); }}
            similarProperties={similarProperties}
            onSelectProperty={(id) => {
              const p = props.properties.find(pr => pr.id === id);
              if (p) { props.onViewDetails(p); addToRecentlyViewed(p); }
            }}
            onExploreOnMap={props.onFocusOnMap}
            isMobileOverride={true}
          />
        </UniversalSheet>
      )}

      {/* ═══ FAVORITES MAP — UniversalSheet with favorite cards ═══ */}
      {mobileTab === 'favorites' && favViewMode === 'map' && favoriteProperties.length > 0 && (
        <UniversalSheet
          sheetKey="favorites-map"
          initialSnapVh={40}
          headerContent={
            <span className="text-xs font-semibold text-muted-foreground">
              {favoriteProperties.length} favori{favoriteProperties.length > 1 ? 's' : ''} sur la carte
            </span>
          }
        >
          <div className="px-3">
            <div className="flex gap-2.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollable" style={{ scrollbarWidth: 'none' }}>
              {favoriteProperties.map(p => {
                const dp = formatDisplayPrice(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => props.onPropertyClick(p.id)}
                    className="shrink-0 bg-card rounded-[14px] overflow-hidden shadow-card border border-border text-left active:scale-[0.97] transition-transform"
                    style={{ width: 220, height: 160, scrollSnapAlign: 'start' }}
                  >
                    <div className="relative h-[100px]">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop'} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <Heart className="h-3 w-3 text-secondary-foreground fill-current" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{p.quartier}</span>
                        {dp.nightPrice ? (
                          <span className="text-[11px] font-bold text-primary">{dp.nightPrice} /n</span>
                        ) : (
                          <span className="text-[11px] font-bold text-primary">{dp.price} /m</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </UniversalSheet>
      )}

      {/* ═══ BOTTOM NAVIGATION ═══ */}
      <MobileBottomNav
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        favoritesCount={props.favorites.size}
      />

      {/* Virtual tour modal */}
      <VirtualTourModal property={selectedProperty} open={modalOpen} onOpenChange={setModalOpen} pois={props.pois} />
    </div>
  );
}
