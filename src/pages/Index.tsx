import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockProperties, mockPois, mockQuartiers, isTypeFurnished, pricePerNight, getTypeLabel, CHAR_CHECKS, IDX_KEYWORD_MAP } from '@/lib/mockData';
import { useGeoCity } from '@/hooks/useGeoCity';

import { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNav } from '@/contexts/NavigationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileApp from '@/components/MobileApp';

import FilterBar, { FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import { filterProperties } from '@/lib/filterProperties';
import { computeFilterOptions } from '@/lib/filterOptions';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import TestimonialsSection from '@/components/TestimonialsSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import QuartiersSection from '@/components/QuartiersSection';
import { EngagementsSection, CommentCaMarcheSection } from '@/components/StorySections';
import FeaturesShowcase from '@/components/FeaturesShowcase';
import MapFeatureTour from '@/components/tours/MapFeatureTour';
import { Loader2, MapPin, Home, ChevronLeft, ChevronRight, X, RotateCcw, SlidersHorizontal, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-quartier-africain.jpg';

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
  currency?: string;
  city?: string;
  country?: string;
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


const FAVORITES_KEY = 'sapsap_favorites';
const FILTERS_KEY = 'sapsap_filters_v1';
const SEARCH_KEY = 'sapsap_search_query_v1';
const ITEMS_PER_PAGE = 25;
const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch { /* noop */ }
    return DEFAULT_FILTERS;
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem(FAVORITES_KEY); return saved ? new Set(JSON.parse(saved)) : new Set<string>(); } catch { return new Set<string>(); }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTransition, setPageTransition] = useState(false);
  const [mapQuartierTrigger, setMapQuartierTrigger] = useState<string | null>(null);
  const [activeQuartier, setActiveQuartier] = useState<string | null>(null);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [idxTags, setIdxTags] = useState<{ characteristic: string; emoji: string; label: string }[]>([]);
  const [searchFallbackHint, setSearchFallbackHint] = useState<string | null>(null);

  // Memoize previous context when user clicks "Voir sur la carte" so the
  // back button can restore exactly the previous view (detail panel + scroll).
  const focusReturnRef = useRef<{ detail: Property | null; scrollY: number } | null>(null);
  const [hasFocusReturn, setHasFocusReturn] = useState(false);
  const [forceMapTabTrigger, setForceMapTabTrigger] = useState(0);

  // Mobile state
  const isMobile = useIsMobile();
  const nav = useNav();

  const { toast } = useToast();
  

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); }, [favorites]);

  const { activeCity, wasAutoSwitched, dismissAutoSwitchBanner } = useGeoCity();
  const [showGeoBanner, setShowGeoBanner] = useState(false);
  useEffect(() => { if (wasAutoSwitched) setShowGeoBanner(true); }, [wasAutoSwitched]);

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeCity.id]);

  // Sync depuis l'URL (?q=, ?property=, ?openFilters=, ?exploreMap=) — venant ex. de la page /search ou /property/:id
  const urlSyncDoneRef = useRef(false);
  useEffect(() => {
    if (urlSyncDoneRef.current || properties.length === 0) return;
    urlSyncDoneRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const propId = params.get('property');
    const exploreMap = params.get('exploreMap') === '1';
    if (q && q.trim()) {
      handleSearch(q.trim());
    }
    if (propId) {
      const found = properties.find(p => p.id === propId);
      if (found) {
        if (exploreMap) {
          // Ouvrir la CARTE avec ce bien focus + radius + POI
          setFocusedPropertyId(found.id);
          setActiveQuartier(found.quartier);
          setMapQuartierTrigger(found.quartier);
          if (isMobile) {
            sessionStorage.setItem('sapsap_force_tab', 'map');
            sessionStorage.setItem('sapsap_focus_property', found.id);
          } else {
            // Desktop : afficher aussi la fiche détaillée à côté de la carte
            setDetailProperty(found);
          }
        } else {
          setDetailProperty(found);
          if (isMobile) {
            nav.push({ screen: 'carte-niveau3', propertyId: propId, propertyTitle: found.title, propertyQuartier: found.quartier });
          }
        }
      }
    }
    // Nettoyer l'URL pour ne pas re-déclencher au refresh involontaire
    if (q || propId || params.get('openFilters') || params.get('exploreMap')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [properties]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cc = activeCity.country;
      const allProps = mockProperties as unknown as Property[];
      // BF: garde le catalogue démo. Autres pays: pas de mock.
      const cityProps = cc === 'BF'
        ? allProps.filter((p: any) => p.country === 'BF')
        : [];
      const finalPois = cc === 'BF' ? (mockPois as unknown as POI[]) : [];
      const finalQuartiers = cc === 'BF' ? (mockQuartiers as unknown as Quartier[]) : [];

      // Merge real published properties from Supabase scoped to the active country
      let realProps: Property[] = [];
      try {
        const builder: any = supabase
          .from('properties')
          .select('*')
          .eq('admin_status', 'published')
          .neq('status', 'rented')
          .eq('country_code', cc);
        const { data } = await builder.order('published_at', { ascending: false, nullsFirst: false });

        if (data) {
          const mockIds = new Set(cityProps.map(p => p.id));
          realProps = (data as any[])
            .filter(r => !mockIds.has(r.id))
            .map(r => ({
              ...r,
              price: Number(r.price),
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              images: r.images ?? [],
              has_video: !!r.video_url,
              country: r.country_code,
              ...(r.features ?? {}),
            })) as unknown as Property[];
        }
      } catch (e) { console.warn('Supabase properties merge failed:', e); }

      const merged = [...realProps, ...cityProps];
      setProperties(merged);
      setFilteredProperties(merged);
      setPois(finalPois);
      setQuartiers(finalQuartiers);
    } catch (error: any) {
      console.warn('Error loading data:', error.message);
      setProperties([]);
      setFilteredProperties([]);
      setPois([]);
      setQuartiers([]);
    } finally {
      setLoading(false);
    }
  };


  const availableProperties = useCallback((props: Property[]) => {
    return props.filter(p => p.status !== 'rented' && p.available !== false);
  }, []);

  const applyFilters = useCallback(
    (source: Property[], query: string, f: FilterState, favsOnly: boolean, favSet: Set<string>) =>
      filterProperties(source as any, query, f, favsOnly, favSet, activeCity?.name) as Property[],
    [activeCity?.name]
  );


  const computeFilteredCount = useCallback((draftFilters: FilterState) => {
    return applyFilters(properties, searchQuery, draftFilters, showFavoritesOnly, favorites).length;
  }, [properties, searchQuery, showFavoritesOnly, favorites, applyFilters]);

  const detectIdxTags = useCallback((query: string) => {
    const q = query.toLowerCase();
    const detected: { characteristic: string; emoji: string; label: string }[] = [];
    IDX_KEYWORD_MAP.forEach(mapping => {
      if (mapping.keywords.some(kw => q.includes(kw))) {
        detected.push({ characteristic: mapping.characteristic, emoji: mapping.emoji, label: mapping.label });
      }
    });
    return detected;
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setDetailProperty(null);
    setFocusedPropertyId(null);
    setCurrentPage(1);
    const tags = detectIdxTags(query);
    setIdxTags(tags);
    const autoChars = tags.map(t => t.characteristic);
    const newFilters = { ...filters, characteristics: [...new Set([...filters.characteristics, ...autoChars])] };
    setFilters(newFilters);
    let filtered = applyFilters(properties, query, newFilters, showFavoritesOnly, favorites);
    let usedFallback = false;

    // Smart fallback (Lot C): if 0 exact results, show closest matches
    // (same quartier OR same type as the query terms) so the user always
    // sees something useful rather than an empty screen.
    if (filtered.length === 0 && query.trim()) {
      const q = query.toLowerCase();
      const allAvailable = properties.filter(p => p.status !== 'rented' && p.available !== false);
      const matchedQuartiers = new Set(
        allAvailable.filter(p => p.quartier.toLowerCase().includes(q) || q.includes(p.quartier.toLowerCase())).map(p => p.quartier)
      );
      const matchedTypes = new Set(
        allAvailable.filter(p => p.type.toLowerCase().includes(q) || getTypeLabel(p.type).toLowerCase().includes(q)).map(p => p.type)
      );
      const near = allAvailable.filter(p => matchedQuartiers.has(p.quartier) || matchedTypes.has(p.type)).slice(0, 12);
      if (near.length > 0) {
        filtered = near;
        usedFallback = true;
      }
    }

    setFilteredProperties(filtered);
    setSearchFallbackHint(usedFallback
      ? `Aucun bien ne correspond exactement à "${query}". Voici quelques biens proches qui pourraient vous intéresser.`
      : null);
    // Save recent search
    try {
      const recent = JSON.parse(localStorage.getItem('sapsap_recent_searches') || '[]');
      const updated = [query, ...recent.filter((s: string) => s !== query)].slice(0, 5);
      localStorage.setItem('sapsap_recent_searches', JSON.stringify(updated));
    } catch {}
    if (filtered.length > 0) {
      if (usedFallback) {
        toast({ title: '💡 Aucun résultat exact', description: `Voici ${filtered.length} bien(s) proche(s) de votre recherche.` });
      } else {
        toast({ title: '🔍 Résultats', description: `${filtered.length} bien(s) trouvé(s)` });
      }
    } else {
      toast({ title: 'Aucun résultat', description: 'Élargissez votre recherche.', variant: 'destructive' });
    }
  };

  const removeIdxTag = (characteristic: string) => {
    setIdxTags(prev => prev.filter(t => t.characteristic !== characteristic));
    const newChars = filters.characteristics.filter(c => c !== characteristic);
    const newFilters = { ...filters, characteristics: newChars };
    setFilters(newFilters);
    setFilteredProperties(applyFilters(properties, searchQuery, newFilters, showFavoritesOnly, favorites));
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Sync filters with /search and /resultats via shared localStorage key
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters)); } catch { /* noop */ }
    setDetailProperty(null);
    setFocusedPropertyId(null);
    setCurrentPage(1);
    setSearchFallbackHint(null);
    const results = applyFilters(properties, searchQuery, newFilters, showFavoritesOnly, favorites);
    setFilteredProperties(results);
    if (results.length > 0) {
      toast({ title: `✅ ${results.length} bien${results.length > 1 ? 's' : ''} correspond${results.length > 1 ? 'ent' : ''} à votre recherche` });
    } else {
      toast({ title: 'Aucun résultat', description: 'Essayez de décocher une ou deux options.', variant: 'destructive' });
    }
  };

  const handleFullReset = () => {
    setFilters(DEFAULT_FILTERS);
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(DEFAULT_FILTERS)); } catch { /* noop */ }
    setSearchQuery('');
    setIdxTags([]);
    setSearchFallbackHint(null);
    setDetailProperty(null);
    setFocusedPropertyId(null);
    setCurrentPage(1);
    setShowFavoritesOnly(false);
    setMapQuartierTrigger(null);
    setActiveQuartier(null);
    setMapResetTrigger(prev => prev + 1);
    const all = applyFilters(properties, '', DEFAULT_FILTERS, false, favorites);
    setFilteredProperties(all);
    toast({ title: `🔄 Filtres réinitialisés — ${all.length} biens affichés` });
  };

  const handleViewDetails = useCallback((property: Property) => {
    setDetailProperty(property);
    setFocusedPropertyId(property.id);
    addToRecentlyViewed(property);
    if (isMobile) {
      nav.push({ screen: 'carte-niveau3', propertyTitle: property.title, propertyQuartier: property.quartier, propertyId: property.id });
    } else {
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isMobile, nav]);

  const handlePropertyClick = useCallback((id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) handleViewDetails(prop);
  }, [properties, handleViewDetails]);

  const handleFocusOnMap = useCallback((id: string) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    // Save the previous context so the user can return to it (the card view
    // they were on, with the detail panel as it was, and the same scroll pos).
    focusReturnRef.current = {
      detail: detailProperty,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    };
    setHasFocusReturn(true);
    addToRecentlyViewed(prop);
    setActiveQuartier(prop.quartier);
    setFocusedPropertyId(id);
    if (isMobile) {
      // Mobile : fermer la fiche pour voir la carte plein écran
      setDetailProperty(null);
      setForceMapTabTrigger(t => t + 1);
      nav.push({
        screen: 'carte-niveau3',
        propertyId: id,
        propertyTitle: prop.title,
        propertyQuartier: prop.quartier,
      });
    } else {
      // Desktop : garder la fiche ouverte à côté de la carte
      setDetailProperty(prop);
      setTimeout(() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [properties, detailProperty, isMobile, nav]);

  const handleFocusReturn = useCallback(() => {
    const ret = focusReturnRef.current;
    setFocusedPropertyId(null);
    setHasFocusReturn(false);
    focusReturnRef.current = null;
    if (ret?.detail) setDetailProperty(ret.detail);
    if (!isMobile && ret) {
      setTimeout(() => window.scrollTo({ top: ret.scrollY, behavior: 'smooth' }), 50);
    }
  }, [isMobile]);

  const handleExploreOnMap = (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    if (isMobile) {
      setFocusedPropertyId(id);
      setDetailProperty(prop);
      setActiveQuartier(prop.quartier);
      nav.push({
        screen: 'carte-niveau3',
        propertyId: id,
        propertyTitle: prop.title,
        propertyQuartier: prop.quartier,
      });
    } else {
      setFocusedPropertyId(id);
      setDetailProperty(prop);
      setActiveQuartier(prop.quartier);
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuartierClick = (q: any) => {
    setDetailProperty(null);
    setFocusedPropertyId(null);
    const newFilters = { ...filters, quartier: q.name };
    setFilters(newFilters);
    setSearchQuery('');
    setIdxTags([]);
    setSearchFallbackHint(null);
    setCurrentPage(1);
    setFilteredProperties(applyFilters(properties, '', newFilters, showFavoritesOnly, favorites));
    setMapQuartierTrigger(q.name);
    
    if (!isMobile) document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast({ title: '💔 Retiré des favoris' }); }
      else { next.add(id); toast({ title: '❤️ Ajouté aux favoris' }); }
      if (showFavoritesOnly) setTimeout(() => setFilteredProperties(applyFilters(properties, searchQuery, filters, true, next)), 0);
      return next;
    });
  };

  const toggleFavoritesView = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setCurrentPage(1);
    setFilteredProperties(applyFilters(properties, searchQuery, filters, next, favorites));
  };

  const favoriteProperties = properties.filter(p => favorites.has(p.id));
  const quartierNames = [...new Set(properties.map(p => p.quartier))].sort();
  const filterOpts = useMemo(() => computeFilterOptions(properties as any), [properties]);
  const similarProperties = detailProperty
    ? availableProperties(properties).filter(p => p.id !== detailProperty.id && (p.quartier === detailProperty.quartier || p.type === detailProperty.type)).slice(0, 3)
    : [];
  const mapProperties = useMemo(() => availableProperties(filteredProperties), [filteredProperties, availableProperties]);

  // Pagination
  const displayProperties = availableProperties(filteredProperties);
  const totalPages = Math.ceil(displayProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = displayProperties.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (dir: 1 | -1) => {
    setPageTransition(true);
    setTimeout(() => {
      setCurrentPage(p => p + dir);
      setTimeout(() => setPageTransition(false), 50);
    }, 200);
  };

  const formatDisplayPrice = (p: Property) => {
    const fmtN = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
    const isFurnished = isTypeFurnished(p.type) || p.furnished;
    if (isFurnished) {
      const night = pricePerNight(p.price);
      return { price: fmtN(p.price), suffix: '/mois', nightPrice: fmtN(night), nightSuffix: '/nuit' };
    }
    return { price: fmtN(p.price), suffix: '/mois', nightPrice: null, nightSuffix: null };
  };

  const handleRecentlyViewedClick = (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) handleViewDetails(prop);
  };

  // Mobile tab change handler (for favorites sync)
  const handleMobileTabChange = useCallback((tab: string) => {
    if (tab === 'favorites') {
      setShowFavoritesOnly(true);
      setFilteredProperties(applyFilters(properties, searchQuery, filters, true, favorites));
    } else {
      if (showFavoritesOnly) {
        setShowFavoritesOnly(false);
        setFilteredProperties(applyFilters(properties, searchQuery, filters, false, favorites));
      }
    }
  }, [properties, searchQuery, filters, showFavoritesOnly, favorites, applyFilters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <Home className="h-6 w-6 text-primary-foreground animate-pulse" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement de SapSapHouse…</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileApp
        properties={properties}
        filteredProperties={filteredProperties}
        pois={pois}
        quartiers={quartiers}
        favorites={favorites}
        filters={filters}
        searchQuery={searchQuery}
        detailProperty={detailProperty}
        activeQuartier={activeQuartier}
        focusedPropertyId={focusedPropertyId}
        mapResetTrigger={mapResetTrigger}
        mapQuartierTrigger={mapQuartierTrigger}
        showFavoritesOnly={showFavoritesOnly}
        idxTags={idxTags}
        searchFallbackHint={searchFallbackHint}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onSearchQueryChange={setSearchQuery}
        onToggleFavorite={toggleFavorite}
        onPropertyClick={handlePropertyClick}
        onViewDetails={handleViewDetails}
        onExploreOnMap={handleExploreOnMap}
        onFocusOnMap={handleFocusOnMap}
        onFocusReturn={handleFocusReturn}
        hasFocusReturn={hasFocusReturn}
        forceMapTabTrigger={forceMapTabTrigger}
        onFullReset={handleFullReset}
        onQuartierChange={(q) => {
          setActiveQuartier(q);
          if (!q) setMapResetTrigger(prev => prev + 1);
        }}
        onExternalQuartierHandled={() => setMapQuartierTrigger(null)}
        onDetailClose={() => setDetailProperty(null)}
        onFocusClear={() => {
          setFocusedPropertyId(null);
          setDetailProperty(null);
        }}
        onMobileTabChange={handleMobileTabChange}
        onRemoveIdxTag={removeIdxTag}
        computeFilteredCount={computeFilteredCount}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT (>= 768px) — unchanged
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {showGeoBanner && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-lg">{activeCity.flag}</span>
              <span>
                Nous avons détecté que vous êtes au <strong>{activeCity.countryName}</strong>. Affichage des biens à <strong>{activeCity.name}</strong>.
              </span>
            </div>
            <button onClick={() => { setShowGeoBanner(false); dismissAutoSwitchBanner(); }} className="text-xs underline opacity-80 shrink-0">
              OK
            </button>
          </div>
        </div>
      )}


      {/* ① Hero immersif — quartier africain golden hour */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 'min(85vh, 780px)' }}>
        {/* Photo pleine largeur */}
        <img
          src={heroImage}
          alt="Quartier résidentiel moderne en Afrique de l'Ouest au coucher du soleil"
          width={1920}
          height={1280}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlays: assombrissement bas pour lisibilité + vignettage doux */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-transparent to-transparent" />

        {/* Contenu Hero */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-16 md:pb-24" style={{ minHeight: 'min(85vh, 780px)' }}>
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="font-display text-white leading-[1.02] tracking-tight font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                Mon bien Immo
                <br />
                <span className="text-white/85 font-medium">en un clic.</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/85 max-w-2xl font-normal">
                La plateforme immobilière moderne d'Afrique de l'Ouest. Villas, appartements, studios meublés — vérifiés, cartographiés, accessibles en toute confiance.
              </p>
            </motion.div>

            {/* Barre de recherche glassmorphique */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8"
            >
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl" />
                <div className="relative flex items-center gap-2 p-2">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                      placeholder={t('hero.placeholder_long')}
                      className="w-full h-12 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground/70"
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="h-12 px-6 md:px-7 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-sm font-semibold active:scale-[0.97] transition-all shadow-lg shadow-secondary/30 shrink-0"
                  >
                    {t('hero.bouton_chercher')}
                  </button>
                </div>
              </div>

              {/* Chips rapides */}
              <div className="flex gap-2 flex-wrap mt-4">
                {['Villa', 'Appartement', 'Studio meublé', 'Magasin', 'Bureau'].map(label => (
                  <button
                    key={label}
                    onClick={() => handleSearch(label)}
                    className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tags IDX persistants */}
              {idxTags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {idxTags.map(tag => (
                    <span key={tag.characteristic} className="inline-flex items-center gap-1 bg-white/95 text-foreground rounded-full px-3 py-1 text-xs font-medium shadow-sm">
                      {tag.emoji} {tag.label}
                      <button onClick={() => removeIdxTag(tag.characteristic)} className="ml-0.5 hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/85"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-secondary">✓</span> +100 biens vérifiés
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-secondary">✓</span> Carte interactive temps réel
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-secondary">✓</span> Sans intermédiaire caché
              </span>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1.5 text-white/70">
          <span className="text-[10px] uppercase tracking-widest">Explorer</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-white/70 to-transparent" />
        </div>
      </section>

      {/* ② Quartiers — exploration territoriale (Gestalt : grille homogène) */}
      {quartiers.length > 0 && (
        <QuartiersSection quartiers={quartiers as any} onQuartierClick={handleQuartierClick} />
      )}

      {/* ③ Engagements — 3 piliers de confiance (Hick's Law) */}
      <EngagementsSection />

      {/* ④ Carte interactive + Filters + Detail Panel */}
      <section id="map" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{t('sections.carte_interactive')}</h2>
        </div>

        <FilterBar
          onFilterChange={handleFilterChange}
          onReset={handleFullReset}
          quartiers={filterOpts.quartiers}
          totalCount={availableProperties(properties).length}
          filteredCount={displayProperties.length}
          favoritesCount={favorites.size}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesView={toggleFavoritesView}
          computeFilteredCount={computeFilteredCount}
          externalFilters={filters}
          priceBounds={{ min: filterOpts.priceMin, max: filterOpts.priceMax }}
          availableTypeValues={filterOpts.typeValues}
          onAfterApply={(f) => {
            try { localStorage.setItem('sapsap_filters_v1', JSON.stringify(f)); } catch { /* noop */ }
            navigate(`/resultats?q=${encodeURIComponent(searchQuery || '')}`);
          }}
        />

        <div className="flex gap-0 relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`relative transition-all duration-300 ${detailProperty ? 'w-full md:w-[calc(100%-360px)] lg:w-[calc(100%-420px)]' : 'w-full'}`}>
            <InteractiveMap
              properties={mapProperties} pois={pois} quartiers={quartiers}
              onPropertyClick={handlePropertyClick} focusedPropertyId={focusedPropertyId}
              onFocusClear={() => { setFocusedPropertyId(null); setDetailProperty(null); }}
              activeFilters={filters} externalQuartierSelect={mapQuartierTrigger}
              onExternalQuartierHandled={() => setMapQuartierTrigger(null)}
              panelOpen={!!detailProperty} onQuartierChange={setActiveQuartier} resetTrigger={mapResetTrigger}
              favoriteIds={favorites}
            />
            {/* Floating "Retour" button when user came from "Voir sur la carte" on a card */}
            {hasFocusReturn && focusedPropertyId && !detailProperty && (
              <motion.button
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                onClick={handleFocusReturn}
                className="absolute top-4 left-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Retour
              </motion.button>
            )}
          </motion.div>

          {detailProperty && (
            <div className="w-[360px] lg:w-[420px] shrink-0 border-l border-border hidden md:block">
              <div className="h-[620px] overflow-y-auto">
                <PropertyDetailPanel
                  property={detailProperty} onClose={() => { setDetailProperty(null); setFocusedPropertyId(null); }}
                  pois={pois} isFavorite={favorites.has(detailProperty.id)} onToggleFavorite={toggleFavorite}
                  onViewTour={(p) => { setSelectedProperty(p); setModalOpen(true); }}
                  similarProperties={similarProperties}
                  onSelectProperty={(id) => { const p = properties.find(pr => pr.id === id); if (p) { setDetailProperty(p); setFocusedPropertyId(id); addToRecentlyViewed(p); } }}
                  onExploreOnMap={handleExploreOnMap}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ③ Slogan + Featured Carousel */}
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Trouvez votre <span className="text-primary">chez vous</span> partout au Burkina Faso
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Location meublée · Bureau · Commerce · Découvrez nos biens mis en avant</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollable">
          {availableProperties(properties).slice(0, 8).map((p) => {
            const dp = formatDisplayPrice(p);
            return (
              <motion.button key={p.id} whileHover={{ y: -4 }} onClick={() => handleViewDetails(p)}
                className="shrink-0 w-64 snap-start bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-warm transition-all text-left"
              >
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'} alt={p.title} className="w-full h-36 object-cover" loading="lazy" />
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.quartier}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {dp.nightPrice || dp.price} {p.currency || 'FCFA'}
                    <span className="text-xs font-normal text-muted-foreground">
                      {' '}{dp.nightPrice ? '/nuit' : '/mois'}
                    </span>
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ④ Properties grid */}
      <section id="properties" className="container mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {showFavoritesOnly ? '❤️ Mes favoris' : searchQuery ? `Résultats pour "${searchQuery}"` : 'Tous les biens'}
          </h2>
          <span className="text-sm text-muted-foreground font-medium">
            <span className="text-foreground font-bold">{displayProperties.length}</span> résultat{displayProperties.length > 1 ? 's' : ''}
          </span>
        </div>

        {searchFallbackHint && (
          <p className="text-sm italic text-muted-foreground mb-4">
            {searchFallbackHint}
          </p>
        )}

        {paginatedProperties.length > 0 ? (
          <>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: pageTransition ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {paginatedProperties.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.02 }}>
                  <PropertyCard property={p} onViewDetails={handleViewDetails} isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite} onFocusOnMap={handleFocusOnMap} />
                </motion.div>
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => { setPageTransition(true); setTimeout(() => { setCurrentPage(p => Math.max(1, p - 1)); setTimeout(() => setPageTransition(false), 50); }, 100); }}
                    disabled={currentPage === 1}
                    className="h-10 px-4 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    ← Précédent
                  </button>
                  {(() => {
                    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2);
                    return pages.map((page, idx) => (
                      <>
                        {idx > 0 && pages[idx - 1] !== page - 1 && (
                          <span key={`e${page}`} className="px-1 text-muted-foreground">…</span>
                        )}
                        <button
                          key={page}
                          onClick={() => { setPageTransition(true); setTimeout(() => { setCurrentPage(page); setTimeout(() => setPageTransition(false), 50); }, 100); }}
                          className={`h-10 w-10 rounded-xl text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'}`}
                        >
                          {page}
                        </button>
                      </>
                    ));
                  })()}
                  <button
                    onClick={() => { setPageTransition(true); setTimeout(() => { setCurrentPage(p => Math.min(totalPages, p + 1)); setTimeout(() => setPageTransition(false), 50); }, 100); }}
                    disabled={currentPage === totalPages}
                    className="h-10 px-4 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, displayProperties.length)} sur {displayProperties.length} biens
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <div className="text-4xl mb-4">{showFavoritesOnly ? '❤️' : '🏠'}</div>
            <p className="text-lg font-semibold text-foreground mb-2">{showFavoritesOnly ? 'Aucun favori' : 'Aucun bien ne correspond exactement à cette sélection'}</p>
            <p className="text-sm text-muted-foreground mb-4">{showFavoritesOnly ? 'Ajoutez des biens en favoris avec le bouton ❤️' : 'Essayez de décocher une ou deux options.'}</p>
            {!showFavoritesOnly && (
              <Button variant="outline" onClick={handleFullReset} className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </section>

      <FeaturesShowcase />
      <CommentCaMarcheSection />
      <TestimonialsSection />
      <RecentlyViewed onViewProperty={handleRecentlyViewedClick} />


      <Footer />
      <VirtualTourModal property={selectedProperty} open={modalOpen} onOpenChange={setModalOpen} pois={pois} />
    </div>
  );
};

export default Index;
