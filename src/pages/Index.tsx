import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockProperties, mockPois, mockQuartiers, isTypeFurnished, pricePerNight, getTypeLabel, CHAR_CHECKS, IDX_KEYWORD_MAP } from '@/lib/mockData';
import { useGeoCity } from '@/hooks/useGeoCity';
import { useFavorites } from '@/hooks/useFavorites';

import { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNav } from '@/contexts/NavigationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileApp from '@/components/MobileApp';

import { FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import { filterProperties } from '@/lib/filterProperties';
import { computeFilterOptions } from '@/lib/filterOptions';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import TestimonialsSection from '@/components/TestimonialsSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import { EngagementsSection, CommentCaMarcheSection } from '@/components/StorySections';
import FeaturesShowcase from '@/components/FeaturesShowcase';
import HeroSearchSuggestions, { useHeroTypewriter } from '@/components/HeroSearchSuggestions';
import MapFeatureTour from '@/components/tours/MapFeatureTour';
import { Loader2, MapPin, Home, ChevronLeft, ChevronRight, X, RotateCcw, SlidersHorizontal, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-quartier-africain.jpg';
import IntentSwitch, { readIntent, type HomeIntent } from '@/components/home/IntentSwitch';
import FurnishedBentoHero from '@/components/home/FurnishedBentoHero';
import HomeMockup from '@/components/home/HomeMockup';
import { prioritizeCity } from '@/lib/cityDiscovery';
const HOME_MOCKUP_ONLY = true;

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


const FILTERS_KEY = 'sapsap_filters_v1';
const SEARCH_KEY = 'sapsap_search_query_v1';
const ITEMS_PER_PAGE = 25;
const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [intent, setIntent] = useState<HomeIntent>(readIntent);
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
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTransition, setPageTransition] = useState(false);
  const [mapQuartierTrigger, setMapQuartierTrigger] = useState<string | null>(null);
  const [activeQuartier, setActiveQuartier] = useState<string | null>(null);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [idxTags, setIdxTags] = useState<{ characteristic: string; emoji: string; label: string }[]>([]);
  const [searchFallbackHint, setSearchFallbackHint] = useState<string | null>(null);
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const heroTypewriter = useHeroTypewriter(!heroSearchFocused && searchQuery.length === 0);

  // Memoize previous context when user clicks "Voir sur la carte" so the
  // back button can restore exactly the previous view (detail panel + scroll).
  const focusReturnRef = useRef<{ detail: Property | null; scrollY: number } | null>(null);
  const [hasFocusReturn, setHasFocusReturn] = useState(false);
  const [forceMapTabTrigger, setForceMapTabTrigger] = useState(0);

  // Mobile state
  const isMobile = useIsMobile();
  const nav = useNav();

  const { toast } = useToast();
  

  useEffect(() => { if (showFavoritesOnly) setFilteredProperties(prev => prev.filter(p => favorites.has(p.id))); }, [favorites, showFavoritesOnly]);

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
      // Quartiers du Burkina uniquement (zone géographique de Ouagadougou/BF)
      const isBF = (q: any) => q.latitude > 9 && q.latitude < 15.5 && q.longitude > -5.6 && q.longitude < 2.5;
      const finalQuartiers = cc === 'BF' ? (mockQuartiers as unknown as Quartier[]).filter(isBF) : [];

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

      const merged = prioritizeCity([...realProps, ...cityProps], activeCity.name);
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
        toast({ title: '💡 Aucun résultat exact', description: 'Voici des logements proches de votre recherche.' });
      } else {
        toast({ title: '🔍 Résultats', description: 'Votre sélection est prête.' });
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
      toast({ title: 'Votre sélection a été mise à jour' });
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
    toast({ title: 'Filtres réinitialisés' });
  };

  const handleViewDetails = useCallback((property: Property) => {
    if (!isMobile) {
      addToRecentlyViewed(property);
      navigate(`/property/${encodeURIComponent(property.id)}`);
      return;
    }
    setDetailProperty(property);
    setFocusedPropertyId(property.id);
    addToRecentlyViewed(property);
    nav.push({ screen: 'carte-niveau3', propertyTitle: property.title, propertyQuartier: property.quartier, propertyId: property.id });
  }, [isMobile, nav, navigate]);

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
      setTimeout(() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
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
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
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
    
    if (!isMobile) document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
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
      <>
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
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT (>= 768px) — unchanged
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <HomeMockup properties={availableProperties(properties)} onOpenFilters={() => navigate('/resultats')} />

      {/* Accès Reels — explorer tout le catalogue */}
      <section className="container mx-auto px-4 pb-4">
        <button
          onClick={() => navigate('/reels')}
          className="w-full flex items-center justify-between gap-4 rounded-3xl bg-primary text-primary-foreground px-6 py-5 hover:bg-primary/95 transition group"
        >
          <span className="text-left">
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-secondary">Explorer</span>
            <span className="block font-display text-xl font-bold mt-1">Parcourez tout le catalogue en mode Reels</span>
            <span className="block text-sm opacity-80">Maisons, appartements, meublés, magasins… en plein écran.</span>
          </span>
          <span className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center group-hover:translate-x-1 transition">▶</span>
        </button>
      </section>

      {/* ③ Engagements — 3 piliers de confiance (Hick's Law) */}
      <EngagementsSection />

      {/* ③ Slogan + Featured Carousel */}
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Trouvez votre <span className="text-primary">chez vous</span> partout au Burkina Faso
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Chaque demeure est meublée et prête à vivre — pour une nuit comme pour plusieurs mois.</p>
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
              <nav className="mt-10 flex justify-center gap-4" aria-label="Autres logements">
                <Button variant="outline" size="icon" aria-label="Logements précédents" title="Précédent" disabled={currentPage === 1} onClick={() => handlePageChange(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label="Logements suivants" title="Suivant" disabled={currentPage === totalPages} onClick={() => handlePageChange(1)}><ChevronRight className="h-4 w-4" /></Button>
              </nav>
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

      <CommentCaMarcheSection />
      <TestimonialsSection />
      <RecentlyViewed onViewProperty={handleRecentlyViewedClick} />


      <Footer />
      <VirtualTourModal property={selectedProperty} open={modalOpen} onOpenChange={setModalOpen} pois={pois} />
    </div>
  );
};

export default Index;
