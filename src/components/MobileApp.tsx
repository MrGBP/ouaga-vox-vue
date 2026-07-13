import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNav } from '@/contexts/NavigationContext';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useAuth } from '@/hooks/useAuth';
import { isTypeFurnished, pricePerNight } from '@/lib/mockData';
import { FilterState } from '@/components/FilterBar';
import UniversalSheet, { UniversalSheetHandle } from '@/components/mobile/UniversalSheet';
import MobileNavbar from '@/components/MobileNavbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileSearchOverlay from '@/components/MobileSearchOverlay';
import MobileDraggableDrawer from '@/components/MobileDraggableDrawer';
import FilterBar from '@/components/FilterBar';
import { computeFilterOptions } from '@/lib/filterOptions';
import InteractiveMap from '@/components/InteractiveMap';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import PropertyCard from '@/components/PropertyCard';
import VirtualTourModal from '@/components/VirtualTourModal';
import TestimonialsSection from '@/components/TestimonialsSection';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import Footer from '@/components/Footer';
import MobileOnboarding from '@/components/mobile/MobileOnboarding';
import { getTypeLabel } from '@/lib/mockData';
import { ChevronLeft, ChevronRight, X, Search, Heart, Sparkles, Maximize2, ChevronUp, SlidersHorizontal, RotateCcw, LogOut, Plus, MapPin, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/ouaga-hero.jpg';
import AIDescribeSheet from '@/components/AIDescribeSheet';

interface Property {
  id: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  quartier: string;
  address?: string;
  latitude?: number;
  longitude?: number;
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
  searchFallbackHint?: string | null;
  onFilterChange: (f: FilterState) => void;
  onSearch: (q: string) => void;
  onSearchQueryChange: (q: string) => void;
  onToggleFavorite: (id: string) => void;
  onPropertyClick: (id: string) => void;
  onViewDetails: (p: Property) => void;
  onExploreOnMap: (id: string) => void;
  onFocusOnMap: (id: string) => void;
  onFocusReturn?: () => void;
  hasFocusReturn?: boolean;
  forceMapTabTrigger?: number;
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
const INITIAL_VISIBLE = 6;
const LOAD_MORE_INCREMENT = 6;

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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, openAuthModal, signOut, requireAuth, isOwner, isAdmin } = useAuth();
  useSwipeBack();

  // Lazy init pour éviter un flash de l'accueil quand on arrive depuis
  // "Voir sur la carte" (flags posés AVANT navigate par Property.tsx).
  const [mobileTab, setMobileTab] = useState(() => {
    try {
      const forced = sessionStorage.getItem('sapsap_force_tab');
      if (forced) return forced;
    } catch { /* noop */ }
    return 'home';
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [favViewMode, setFavViewMode] = useState<'list' | 'map'>('list');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTransition, setPageTransition] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [pinPreview, setPinPreview] = useState<Property | null>(null);
  const [showAISheet, setShowAISheet] = useState(false);
  const [stayMode, setStayMode] = useState<'court' | 'long'>('long');
  const [aiPlaceholderIdx, setAiPlaceholderIdx] = useState(0);
  const sheetRef = useRef<UniversalSheetHandle>(null);

  // AI placeholder cycling (change every 3.5s per stayMode)
  useEffect(() => {
    const id = setInterval(() => setAiPlaceholderIdx(i => i + 1), 3500);
    return () => clearInterval(id);
  }, []);

  // Open filters drawer if Search page asked for it (sessionStorage flag)
  // Force a specific tab if requested (e.g. /property → "Voir sur la carte")
  useEffect(() => {
    try {
      if (sessionStorage.getItem('sapsap_open_filters') === '1') {
        sessionStorage.removeItem('sapsap_open_filters');
        setShowMobileFilters(true);
      }
      // Filtres appliqués depuis la page de recherche (inline)
      const applyFiltersRaw = sessionStorage.getItem('sapsap_apply_filters');
      if (applyFiltersRaw) {
        sessionStorage.removeItem('sapsap_apply_filters');
        try {
          const parsed = JSON.parse(applyFiltersRaw);
          props.onFilterChange(parsed);
        } catch { /* noop */ }
      }
      const forcedTab = sessionStorage.getItem('sapsap_force_tab');
      if (forcedTab) {
        sessionStorage.removeItem('sapsap_force_tab');
        setMobileTab(forcedTab);
        props.onMobileTabChange(forcedTab);
      }
      const focusPid = sessionStorage.getItem('sapsap_focus_property');
      if (focusPid) {
        sessionStorage.removeItem('sapsap_focus_property');
        // Show pin preview on map for that property after a short delay so map mounts
        setTimeout(() => {
          const p = props.properties.find(pr => pr.id === focusPid);
          if (p) {
            setPinPreview(p);
            // Push a nav entry so Android back / swipe back closes the map
            // overlay instead of leaving the app.
            if (nav.current.screen !== 'carte-niveau3') {
              nav.push({
                screen: 'carte-niveau3',
                propertyId: p.id,
                propertyTitle: p.title,
                propertyQuartier: p.quartier,
              });
            }
          }
        }, 350);
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Body scroll lock when filters or search open
  useEffect(() => {
    if (showMobileFilters || showMobileSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilters, showMobileSearch]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(INITIAL_VISIBLE); }, [props.filteredProperties.length]);

  // Force switch to map tab when parent triggers a "focus on map" action
  // (e.g. user tapped the map icon on a PropertyCard from the home/favorites tab).
  const lastForceMapRef = useRef<number | undefined>(props.forceMapTabTrigger);
  useEffect(() => {
    if (props.forceMapTabTrigger === undefined) return;
    if (props.forceMapTabTrigger === lastForceMapRef.current) return;
    lastForceMapRef.current = props.forceMapTabTrigger;
    setMobileTab('map');
    setShowMobileSearch(false);
    setShowMobileFilters(false);
    props.onMobileTabChange('map');
  }, [props.forceMapTabTrigger]);

  // Sync navigation context → visual states (swipe back / Android back / nav.pop()).
  // The nav stack is the source of truth: when we land on a screen, we restore
  // the state that screen represents instead of clearing everything.
  useEffect(() => {
    const state = nav.current;
    const screen = state.screen;
    if (screen === 'carte-niveau1') {
      props.onDetailClose();
      props.onFocusClear();
      props.onQuartierChange(null);
    } else if (screen === 'carte-niveau2') {
      // Back to a quartier list/map → close any open property but KEEP quartier.
      props.onDetailClose();
      props.onFocusClear();
      if (state.quartierName && state.quartierName !== props.activeQuartier) {
        props.onQuartierChange(state.quartierName);
      }
    } else if (screen === 'carte-niveau3') {
      // Back to a property focus → keep both quartier and property as they are.
      // (Don't clear anything; the state was pushed when the property was opened.)
    }
  }, [nav.current.screen]);


  // Helpers
  const availableProperties = useCallback((list: Property[]) => {
    return list.filter(p => p.status !== 'rented' && p.available !== false);
  }, []);

  const navLevel: 1 | 2 | 3 = props.detailProperty ? 3 : props.activeQuartier ? 2 : 1;

  const mapProperties = useMemo(() => {
    const source = props.filteredProperties?.length > 0
      ? props.filteredProperties
      : props.properties;
    return source.filter(p => p.status !== 'rented' && p.available !== false);
  }, [props.filteredProperties, props.properties]);

  const quartierProperties = useMemo(() =>
    props.activeQuartier
      ? mapProperties.filter(p => p.quartier === props.activeQuartier)
      : [],
    [mapProperties, props.activeQuartier]
  );

  const favoriteProperties = useMemo(() =>
    props.properties.filter(p => props.favorites.has(p.id)),
    [props.properties, props.favorites]
  );

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

  // Open the full property page (real route, fullscreen)
  const openPropertyPage = useCallback((id: string) => {
    navigate(`/property/${id}`);
  }, [navigate]);

  const handlePropertyClick = useCallback((id: string) => {
    // On map tab → show preview first instead of navigating away
    const prop = props.properties.find(p => p.id === id);
    if (prop && mobileTab === 'map') {
      setPinPreview(prop);
      return;
    }
    // Anywhere else → real fullscreen page
    openPropertyPage(id);
  }, [openPropertyPage, props.properties, mobileTab]);

  const openFullDetailFromPreview = useCallback(() => {
    if (!pinPreview) return;
    const id = pinPreview.id;
    setPinPreview(null);
    openPropertyPage(id);
  }, [pinPreview, openPropertyPage]);

  // Navigation handlers
  // Back: rely on the nav stack to restore the previous screen.
  // The useEffect on `nav.current.screen` (above) will sync visual states
  // (detail / focus / quartier) to match wherever we land — so we don't
  // arbitrarily clear states here based on visual `navLevel`.
  const handleNavBack = () => {
    setPinPreview(null);
    if (isExploring) { setIsExploring(false); return; }
    // If user came from "Voir sur la carte" on a card, restore the previous
    // context (detail panel + scroll) instead of just popping the stack.
    if (props.hasFocusReturn && props.onFocusReturn) {
      props.onFocusReturn();
      if (nav.canGoBack) nav.pop();
      return;
    }
    if (nav.canGoBack) {
      nav.pop();
      return;
    }
    // Hard fallback if stack is empty: clear everything to land on N1.
    props.onDetailClose();
    props.onFocusClear();
    props.onQuartierChange(null);
  };

  const handleNavHome = () => {
    setPinPreview(null);
    props.onDetailClose();
    props.onFocusClear();
    props.onQuartierChange(null);
    nav.popToRoot();
  };

  const openSearchPage = useCallback(() => {
    const q = props.searchQuery?.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [navigate, props.searchQuery]);

  // Tab change: 'map' keeps context (current property/quartier visible on map).
  // Other tabs (home, favorites, profile) clear contextual selections so the
  // user gets a fresh view of that section.
  const handleMobileTabChange = (tab: string) => {
    if (tab === 'search') {
      openSearchPage();
      return;
    }
    if (tab === 'map') {
      // Click on Carte in the navbar → ALWAYS reset to global Ouagadougou view
      // (niveau 1) with all pins. Keeps filters/search intact, just recenters
      // the map and closes any open property / active quartier. The normal
      // quartier-tap → niveau 2 logic still works after that.
      setMobileTab('map');
      setShowMobileSearch(false);
      props.onMobileTabChange('map');
      // Close any open property + leave the active quartier so we go back to N1.
      if (props.detailProperty) props.onDetailClose();
      props.onFocusClear();
      props.onQuartierChange(null); // also bumps mapResetTrigger → recenters Ouaga
      // Reset the nav stack to a clean carte-niveau1 entry.
      if (nav.current.screen !== 'carte-niveau1') {
        nav.push({ screen: 'carte-niveau1' });
      }
      return;
    }
    // home / favorites / profile → fresh section
    props.onDetailClose();
    props.onFocusClear();
    setMobileTab(tab);
    setShowMobileSearch(false);
    props.onMobileTabChange(tab);
  };


  const handleSheetHeightChange = useCallback((h: number) => {
    setSheetHeight(h);
  }, []);

  const handleRecentlyViewedClick = (id: string) => {
    openPropertyPage(id);
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
            <button onClick={() => openSearchPage()} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
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
              onClick={() => { setIsExploring(true); sheetRef.current?.close?.(); }}
              style={{
                width: 34, height: 34, background: '#f0f4ff', border: 'none',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
              title="Explorer sur la carte"
            >
              <Maximize2 size={16} color="#1a3560" />
            </button>
            <button onClick={() => openSearchPage()} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
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
    const key = navLevel === 2 ? `level2-${props.activeQuartier}` : `level3-${props.detailProperty?.id}`;
    if (navLevel === 2 && props.activeQuartier && !props.detailProperty) {
      return (
        <AnimatePresence mode="wait">
          <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <CarouselWithSwipeHint
              properties={quartierProperties}
              activeQuartier={props.activeQuartier}
              favorites={props.favorites}
              formatDisplayPrice={formatDisplayPrice}
              onPropertyClick={(id) => {
                const p = props.properties.find(pr => pr.id === id);
                if (p) setPinPreview(p);
              }}
            />
          </motion.div>
        </AnimatePresence>
      );
    }
    if (navLevel === 3 && props.detailProperty) {
      return (
        <AnimatePresence mode="wait">
          <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <PropertyDetailPanel
              property={props.detailProperty}
              onClose={() => { props.onDetailClose(); props.onFocusClear(); }}
              pois={props.pois}
              isFavorite={props.favorites.has(props.detailProperty.id)}
              onToggleFavorite={props.onToggleFavorite}
              onViewTour={(p) => { setSelectedProperty(p); setModalOpen(true); }}
              similarProperties={similarProperties}
              onSelectProperty={(id) => { openPropertyPage(id); }}
              onExploreOnMap={(id) => { props.onExploreOnMap(id); setIsExploring(true); sheetRef.current?.close?.(); }}
              isMobileOverride={true}
            />
          </motion.div>
        </AnimatePresence>
      );
    }
    return null;
  };

  const quartierNames = [...new Set(props.properties.map(p => p.quartier))].sort();
  const mobileFilterOpts = useMemo(() => computeFilterOptions(props.properties as any), [props.properties]);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-background">
      {/* ═══ ONBOARDING ═══ */}
      {mobileTab === 'map' && navLevel === 1 && <MobileOnboarding onDone={() => {}} />}
      {/* ═══ CARTE FIXE PLEIN ÉCRAN ═══ */}
      <div
        className="fixed inset-0 z-0"
        style={{
          visibility: (mobileTab === 'map' || (mobileTab === 'favorites' && favViewMode === 'map'))
            ? 'visible' : 'hidden',
          pointerEvents: (mobileTab === 'map' || (mobileTab === 'favorites' && favViewMode === 'map'))
            ? 'auto' : 'none',
        }}
      >
        <div className="w-full h-full">
          <InteractiveMap
            properties={mapProperties} pois={props.pois} quartiers={props.quartiers}
            onPropertyClick={handlePropertyClick} focusedPropertyId={props.focusedPropertyId}
            onFocusClear={handleFocusClear}
            activeFilters={props.filters} externalQuartierSelect={props.mapQuartierTrigger}
            onExternalQuartierHandled={props.onExternalQuartierHandled}
            panelOpen={false} onQuartierChange={handleQuartierChange}
            resetTrigger={props.mapResetTrigger}
            favoriteIds={props.favorites}
          />
        </div>
        {/* Floating "Retour" button when user came from "Voir sur la carte" on a card */}
        {mobileTab === 'map' && props.hasFocusReturn && props.focusedPropertyId && !props.detailProperty && (
          <motion.button
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => { props.onFocusReturn?.(); if (nav.canGoBack) nav.pop(); }}
            className="absolute z-[1000] inline-flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg px-4 py-2 text-sm font-medium text-foreground active:scale-[0.98]"
            style={{ top: 'calc(52px + env(safe-area-inset-top) + 8px)', left: 12 }}
          >
            <ChevronLeft className="h-4 w-4" /> Retour
          </motion.button>
        )}
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
          isExploring={isExploring && navLevel === 3}
          favoritesCount={props.favorites.size}
          onFavoritesClick={() => { setMobileTab('favorites'); handleMobileTabChange('favorites'); }}
        />
      ) : mobileTab === 'home' ? (
        <MobileNavbar
          level={1}
          favoritesCount={props.favorites.size}
          onFavoritesClick={() => { setMobileTab('favorites'); handleMobileTabChange('favorites'); }}
        />
      ) : null}

      {/* ═══ FULLSCREEN TAB PAGES (covers map) ═══ */}
      <AnimatePresence mode="popLayout">
        {/* HOME TAB */}
        {mobileTab === 'home' && (
          <motion.div
            key="home-tab"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-10 bg-background overflow-y-auto scrollable"
            style={{ paddingTop: 'calc(52px + env(safe-area-inset-top))', paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            {/* ═══ HERO ÉDITORIAL — solid navy, pas de photo hero classique ═══
                Signature : split typographique + segmenté "à la nuit / au mois"
                + prompt IA comme CTA principal + peek mosaïque de biens réels */}
            {(() => {
              const AI_PROMPTS = stayMode === 'court'
                ? [
                    'Studio meublé pour 3 nuits à Zogona…',
                    'Villa avec piscine pour un week-end à Ouaga 2000…',
                    'Appart climatisé, wifi, 5 nuits à Koulouba…',
                  ]
                : [
                    'Appartement 2 chambres au mois à Pissy…',
                    'Villa 4 chambres avec parking à Ouaga 2000…',
                    'Studio non meublé longue durée à Zogona…',
                  ];
              const currentPlaceholder = AI_PROMPTS[aiPlaceholderIdx % AI_PROMPTS.length];
              const peekProps = availableProperties(props.properties).slice(0, 4);

              return (
                <section
                  className="relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #1A3560 0%, #14294a 65%, #0f2244 100%)' }}
                >
                  {/* Grille subtile en arrière-plan (identité éditoriale) */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />
                  {/* Halo orange discret coin haut-droit */}
                  <div
                    className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(232,118,26,0.6) 0%, rgba(232,118,26,0) 70%)' }}
                  />

                  <div className="relative z-10 px-5 pt-6 pb-5">
                    {/* Kicker — remplace le badge "Live Ouagadougou" */}
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60"
                    >
                      <span className="w-6 h-[1px] bg-[#E8761A]" />
                      Ouagadougou · Location
                    </motion.div>

                    {/* Titre éditorial */}
                    <motion.h1
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.5 }}
                      className="mt-3 font-display font-black text-white leading-[0.95] tracking-tight text-[36px]"
                    >
                      Louez.<br />
                      <span className="italic font-serif font-normal text-white/85 text-[30px]">Vivez.</span>{' '}
                      <span className="text-[#E8761A]">En un clic.</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-[12.5px] text-white/70 mt-3 max-w-[90%] leading-relaxed"
                    >
                      La 1<sup>ère</sup> plateforme 100 % dédiée à la location au Burkina : à la nuit ou au mois, meublé ou non.
                    </motion.p>

                    {/* Segmenté durée — signature UX (clarifie le modèle location) */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 inline-flex bg-white/10 backdrop-blur-md p-0.5 rounded-full border border-white/15"
                    >
                      {([
                        { id: 'court', label: 'Courte durée', hint: '/ nuit' },
                        { id: 'long', label: 'Longue durée', hint: '/ mois' },
                      ] as const).map(m => (
                        <button
                          key={m.id}
                          onClick={() => setStayMode(m.id)}
                          className={`relative px-3.5 h-8 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            stayMode === m.id ? 'text-[#1A3560]' : 'text-white/70'
                          }`}
                        >
                          {stayMode === m.id && (
                            <motion.span
                              layoutId="stay-pill"
                              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                              className="absolute inset-0 bg-white rounded-full shadow-md"
                            />
                          )}
                          <span className="relative">{m.label}</span>
                          <span className={`relative text-[9px] ${stayMode === m.id ? 'text-[#E8761A]' : 'text-white/40'}`}>
                            {m.hint}
                          </span>
                        </button>
                      ))}
                    </motion.div>

                    {/* PROMPT IA — CTA PRINCIPAL du hero (remplace le chip discret) */}
                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.45 }}
                      onClick={() => setShowAISheet(true)}
                      aria-label="Décrire votre bien idéal avec l'assistant IA"
                      className="group relative w-full mt-5 text-left active:scale-[0.99] transition-transform"
                    >
                      {/* Bord gradient animé */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-90"
                        style={{
                          background: 'linear-gradient(120deg, #E8761A 0%, #f4a366 40%, #ffffff 55%, #E8761A 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer-bg 3.5s linear infinite',
                          padding: 1,
                        }}
                      >
                        <div className="w-full h-full rounded-2xl bg-[#1A3560]" />
                      </div>
                      <div className="relative flex items-center gap-3 px-3.5 py-3 rounded-2xl">
                        <div className="relative shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8761A] to-[#c85e0d] flex items-center justify-center shadow-lg shadow-[#E8761A]/30">
                          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                          <span className="absolute -top-1 -right-1 text-[8px] font-black text-white bg-[#1A3560] px-1 rounded-full border border-[#E8761A]">IA</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8761A] leading-none mb-0.5">
                            Assistant SapSap
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentPlaceholder}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.35 }}
                              className="text-[13px] text-white/85 truncate"
                            >
                              {currentPlaceholder}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/60 shrink-0 group-active:translate-x-0.5 transition-transform" />
                      </div>
                    </motion.button>

                    {/* Peek mosaïque de biens réels — le côté visuel/différent
                        (au lieu d'une grosse photo hero, un teaser de l'inventaire) */}
                    {peekProps.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.5 }}
                        className="mt-5 flex items-center gap-3"
                      >
                        <div className="flex -space-x-2">
                          {peekProps.slice(0, 4).map((p, i) => (
                            <button
                              key={p.id}
                              onClick={() => openPropertyPage(p.id)}
                              className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#14294a] hover:z-10 transition-transform active:scale-95"
                              style={{ zIndex: 4 - i }}
                              aria-label={p.title}
                            >
                              <img
                                src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                        <div className="text-[11px] text-white/70 leading-tight">
                          <span className="text-white font-bold">{props.properties.length}+</span> biens ·{' '}
                          <span className="text-white font-bold">{props.quartiers.length}</span> quartiers<br />
                          <span className="text-white/50 text-[10px]">Maisons · Villas · Studios · Bureaux</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* Search bar classique (secondaire — pour utilisateurs qui savent ce qu'ils veulent) */}
            <section className="px-4 pt-4">
              <div className="w-full h-12 rounded-full bg-card border border-border shadow-sm flex items-center gap-2 pl-4 pr-1.5">
                <button
                  onClick={() => openSearchPage()}
                  className="flex items-center gap-3 flex-1 min-w-0 h-full text-left"
                  aria-label="Rechercher"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {props.searchQuery || t('hero.placeholder')}
                  </span>
                </button>
                <button
                  onClick={() => setShowMobileFilters(true)}
                  aria-label="Filtres"
                  title="Filtres"
                  className="relative inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold active:scale-[0.98] transition-transform shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filtres</span>
                  {(props.idxTags.length > 0 || props.filters.type !== 'all' || props.filters.quartier !== 'all' || props.filters.minBedrooms > 0 || props.filters.characteristics.length > 0) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary" />
                  )}
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
              <h2 className="text-lg font-bold text-foreground mb-3">{t('sections.biens_mis_en_avant')}</h2>
              <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollable">
                {availableProperties(props.properties).slice(0, 8).map(p => {
                  const dp = formatDisplayPrice(p);
                  return (
                    <button key={p.id} onClick={() => openPropertyPage(p.id)}
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
                <h2 className="text-lg font-bold text-foreground">{t('sections.tous_les_biens')}</h2>
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-bold">{displayProperties.length}</span> {displayProperties.length > 1 ? t('sections.resultats') : t('sections.resultat')}
                </span>
              </div>
              {props.searchFallbackHint && (
                <p className="text-xs italic text-muted-foreground mb-3">
                  {props.searchFallbackHint}
                </p>
              )}
              {displayProperties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {displayProperties.slice(0, visibleCount).map(p => (
                      <PropertyCard key={p.id} property={p as any} onViewDetails={(pp: any) => openPropertyPage(pp.id)} isFavorite={props.favorites.has(p.id)} onToggleFavorite={props.onToggleFavorite} onFocusOnMap={props.onFocusOnMap} />
                    ))}
                  </div>
                  {visibleCount < displayProperties.length && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount(c => Math.min(c + LOAD_MORE_INCREMENT, displayProperties.length))}
                        className="rounded-full px-6 h-11 text-sm font-semibold gap-2"
                      >
                        {t('sections.voir_plus')}
                        <span className="text-muted-foreground text-xs">
                          ({Math.min(LOAD_MORE_INCREMENT, displayProperties.length - visibleCount)} {t('sections.de_plus')})
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">{t('sections.aucun_bien')}</p>
                  <Button variant="outline" size="sm" onClick={props.onFullReset} className="mt-3 gap-2">
                    <RotateCcw className="h-3 w-3" /> {t('filtre.reinitialiser')}
                  </Button>
                </div>
              )}
            </section>

            <TestimonialsSection />
            <RecentlyViewed onViewProperty={handleRecentlyViewedClick} />


            <Footer />
          </motion.div>
        )}

        {/* FAVORITES TAB — list mode */}
        {mobileTab === 'favorites' && favViewMode === 'list' && (
          <motion.div
            key="fav-list-tab"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 bg-background overflow-y-auto scrollable"
            style={{ paddingTop: 'calc(52px + env(safe-area-inset-top))', paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            <nav
              className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-3 no-select"
              style={{ height: 'calc(52px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">❤️ {t('sections.mes_favoris')}</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setFavViewMode('list')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-card text-foreground shadow-sm">
                  ☰ {t('sections.liste')}
                </button>
                <button onClick={() => setFavViewMode('map')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground">
                  🗺️ {t('nav.carte')}
                </button>
              </div>
            </nav>
            <div className="px-4 pt-4">
              {favoriteProperties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {favoriteProperties.map(p => (
                      <PropertyCard key={p.id} property={p as any} onViewDetails={(pp: any) => openPropertyPage(pp.id)} isFavorite={true} onToggleFavorite={props.onToggleFavorite} onFocusOnMap={props.onFocusOnMap} />
                    ))}
                  </div>
                  <div className="mt-6 bg-card border border-border rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sections.recapitulatif')}</h4>
                    <p className="text-sm text-foreground">
                      {favoriteProperties.length} {favoriteProperties.length > 1 ? t('nav.favoris').toLowerCase() : t('nav.favoris').toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Budget : {new Intl.NumberFormat('fr-FR').format(Math.round(favoriteProperties.reduce((s, p) => s + p.price, 0) / favoriteProperties.length))} FCFA/{t('bien.mois')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">❤️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('sections.aucun_favori')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{t('sections.swipe_hint')}</p>
                  <Button onClick={() => handleMobileTabChange('map')} className="bg-primary text-primary-foreground gap-2">
                    {t('sections.explorer')} →
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
              style={{ height: 'calc(52px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">❤️ {t('sections.favoris_carte')}</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setFavViewMode('list')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground">
                  ☰ {t('sections.liste')}
                </button>
                <button onClick={() => setFavViewMode('map')} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-card text-foreground shadow-sm">
                  🗺️ {t('nav.carte')}
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
            style={{ paddingTop: 'calc(52px + env(safe-area-inset-top))', paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' }}
          >
            <nav
              className="fixed top-0 left-0 right-0 z-[80] flex items-center px-3 no-select"
              style={{ height: 'calc(52px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid hsl(var(--border))' }}
            >
              <span className="text-sm font-bold text-foreground">👤 {t('nav.profil')}</span>
            </nav>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-104px)] px-6">
              {user ? (
                <div className="w-full max-w-xs space-y-6">
                  <div className="text-center">
                    <div className="text-5xl mb-4">👤</div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary text-primary-foreground">
                      {t('sections.mon_compte')}
                    </Button>
                    <Button variant="outline" className="w-full">
                      {t('sections.mes_favoris')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive hover:text-destructive gap-2"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('sections.se_deconnecter')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs text-center">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('sections.connectez_vous')}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    {t('sections.connectez_vous_desc')}
                  </p>
                  <Button 
                    className="w-full bg-primary text-primary-foreground mb-3"
                    onClick={() => openAuthModal('se connecter')}
                  >
                    {t('sections.se_connecter')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => openAuthModal('créer un compte')}
                  >
                    {t('sections.creer_compte')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAP PIN PREVIEW (mini-fiche) + biens similaires du même quartier ═══ */}
      <AnimatePresence>
        {pinPreview && mobileTab === 'map' && !isExploring && (() => {
          const similarsInQuartier = mapProperties
            .filter(p => p.id !== pinPreview.id && p.quartier === pinPreview.quartier)
            .slice(0, 6);
          return (
          <motion.div
            key={`preview-${pinPreview.id}`}
            initial={{ y: 140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 140, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-3 right-3 z-[60] bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
            style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={openFullDetailFromPreview}
              className="w-full flex gap-3 p-2.5 text-left active:scale-[0.99] transition-transform"
            >
              <img
                src={pinPreview.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'}
                alt={pinPreview.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                  {getTypeLabel(pinPreview.type)}
                </p>
                <p className="text-sm font-bold text-foreground line-clamp-1">{pinPreview.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{pinPreview.quartier}</p>
                {(() => {
                  const dp = formatDisplayPrice(pinPreview);
                  return (
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {dp.nightPrice ? `${dp.nightPrice} FCFA/nuit` : `${dp.price} FCFA/mois`}
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setPinPreview(null); }}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 self-start mt-1"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </button>

            {/* "Aussi à {quartier}" section removed per user request */}

            <button
              onClick={openFullDetailFromPreview}
              className="w-full h-10 bg-secondary text-secondary-foreground text-sm font-semibold active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
            >
              Voir la fiche
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══ IMMERSIVE EXPLORE OVERLAY ═══ */}
      {isExploring && navLevel === 3 && props.detailProperty && (
        <>
          {/* Property info at bottom */}
          <div
            className="fixed left-3 right-3 z-[25] flex items-center justify-between"
            style={{ bottom: 'calc(108px + env(safe-area-inset-bottom))' }}
          >
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-1">
                {getTypeLabel(props.detailProperty.type)}
              </span>
              <p className="text-sm font-bold text-foreground truncate">
                {props.detailProperty.title}
              </p>
              <p className="text-xs font-semibold text-primary">
                {(() => {
                  const dp = formatDisplayPrice(props.detailProperty!);
                  return dp.nightPrice ? `${dp.nightPrice} FCFA/nuit` : `${dp.price} FCFA/mois`;
                })()}
              </p>
            </div>
            <button
              onClick={() => props.onToggleFavorite(props.detailProperty!.id)}
              style={{ width: 36, height: 36, background: '#f0f4ff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer' }}
            >
              {props.favorites.has(props.detailProperty.id) ? '❤️' : '🤍'}
            </button>
          </div>

          {/* "Voir la fiche" button */}
          <button
            onClick={() => { setIsExploring(false); setTimeout(() => sheetRef.current?.snapFullscreen?.(), 50); }}
            style={{
              position: 'fixed', bottom: 'calc(68px + env(safe-area-inset-bottom))',
              left: '50%', transform: 'translateX(-50%)', zIndex: 26,
              background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)', border: '0.5px solid #e5e7eb',
              borderRadius: 9999, padding: '9px 20px', fontSize: 13, fontWeight: 600,
              color: '#1a3560', display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer',
            }}
          >
            <ChevronUp size={16} />
            Voir la fiche
          </button>
        </>
      )}

      {/* ═══ MAP TAB — Universal Sheet UNIQUEMENT pour la fiche bien (niv 3). 
           En niv 2 (quartier), on ne montre QUE les pins sur la carte + pinPreview au clic. ═══ */}
      {mobileTab === 'map' && props.detailProperty && !isExploring && (
        <UniversalSheet
          ref={sheetRef}
          sheetKey={`map-${navLevel}-${props.activeQuartier || ''}-${props.detailProperty?.id || ''}`}
          initialSnapVh={92}
          headerContent={getSheetHeader()}
          onHeightChange={handleSheetHeightChange}
        >
          {getSheetContent()}
        </UniversalSheet>
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
            properties={(props.filteredProperties.length > 0 ? props.filteredProperties : props.properties).filter(p => p.status !== 'rented' && p.available !== false) as any}
            onClose={() => setShowMobileSearch(false)}
            onSelectProperty={(id) => {
              const prop = props.properties.find(p => p.id === id);
              if (!prop) { setShowMobileSearch(false); return; }
              if (prop.quartier !== props.activeQuartier) {
                props.onQuartierChange(prop.quartier);
              }
              props.onViewDetails(prop);
              addToRecentlyViewed(prop);
              setMobileTab('map');
              nav.push({
                screen: 'carte-niveau3',
                propertyId: id,
                propertyTitle: prop.title,
                propertyQuartier: prop.quartier,
              });
              setShowMobileSearch(false);
              // Sheet opens at fullscreen directly via initialSnapVh — no setTimeout needed.
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
        maxHeightVh={92}
        initialHeightVh={55}
        snapPoints={[0, 55, 92]}
        overlayZIndex={210}
        drawerZIndex={211}
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
            priceBounds={mobileFilterOpts ? { min: mobileFilterOpts.priceMin, max: mobileFilterOpts.priceMax } : undefined}
            availableTypeValues={mobileFilterOpts?.typeValues}
            forceOpen={true}
            onAfterApply={(f) => {
              try { localStorage.setItem('sapsap_filters_v1', JSON.stringify(f)); } catch { /* noop */ }
              navigate(`/resultats?q=${encodeURIComponent(props.searchQuery || '')}`);
            }}
          />
        </div>
      </MobileDraggableDrawer>

      {/* ═══ HOME TAB — La fiche d'un bien ouvre désormais la page dédiée /property/:id (plein écran) ═══ */}

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
                    onClick={() => openPropertyPage(p.id)}
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

      {/* AI Describe sheet */}
      <AIDescribeSheet open={showAISheet} onClose={() => setShowAISheet(false)} />

      {/* Virtual tour modal */}
      <VirtualTourModal property={selectedProperty} open={modalOpen} onOpenChange={setModalOpen} pois={props.pois} />
    </div>
  );
}
