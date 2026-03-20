import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockProperties, mockPois, mockQuartiers, isTypeFurnished, pricePerNight, getTypeLabel, CHAR_CHECKS, IDX_KEYWORD_MAP } from '@/lib/mockData';

import { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNav } from '@/contexts/NavigationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileApp from '@/components/MobileApp';

import FilterBar, { FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
import AIComparator from '@/components/AIComparator';
import AIProfileSection from '@/components/AIProfileSection';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import TestimonialsSection from '@/components/TestimonialsSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import { Loader2, MapPin, Home, Sparkles, ChevronLeft, ChevronRight, X, RotateCcw, SlidersHorizontal, Heart, Search } from 'lucide-react';
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

const FAVORITES_KEY = 'sapsap_favorites';
const ITEMS_PER_PAGE = 25;
const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
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

  // Mobile state
  const isMobile = useIsMobile();
  const nav = useNav();

  const { toast } = useToast();
  

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); }, [favorites]);
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const finalProps = mockProperties as unknown as Property[];
      const finalPois = mockPois as unknown as POI[];
      const finalQuartiers = mockQuartiers as unknown as Quartier[];
      setProperties(finalProps);
      setFilteredProperties(finalProps);
      setPois(finalPois);
      setQuartiers(finalQuartiers);
    } catch (error: any) {
      console.warn('Error loading data:', error.message);
      setProperties(mockProperties as unknown as Property[]);
      setFilteredProperties(mockProperties as unknown as Property[]);
      setPois(mockPois as unknown as POI[]);
      setQuartiers(mockQuartiers as unknown as Quartier[]);
    } finally {
      setLoading(false);
    }
  };

  const availableProperties = useCallback((props: Property[]) => {
    return props.filter(p => p.status !== 'rented' && p.available !== false);
  }, []);

  const applyFilters = useCallback((source: Property[], query: string, f: FilterState, favsOnly: boolean, favSet: Set<string>) => {
    let result = source.filter(p => p.status !== 'rented' && p.available !== false);
    if (favsOnly) result = result.filter(p => favSet.has(p.id));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.quartier.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        getTypeLabel(p.type).toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.price.toString().includes(q)
      );
    }
    if (f.type !== 'all') result = result.filter(p => p.type === f.type);
    if (f.quartier !== 'all') result = result.filter(p => p.quartier === f.quartier);
    result = result.filter(p => p.price >= f.minPrice && p.price <= f.maxPrice);
    if (f.minBedrooms > 0) result = result.filter(p => (p.bedrooms || 0) >= f.minBedrooms);
    if (f.hasVirtualTour) result = result.filter(p => !!p.virtual_tour_url);
    if (f.surfaceRange && f.surfaceRange !== 'all') {
      const sr = f.surfaceRange;
      if (sr === '<50') result = result.filter(p => (p.surface_area || 0) < 50);
      else if (sr === '50-150') result = result.filter(p => (p.surface_area || 0) >= 50 && (p.surface_area || 0) <= 150);
      else if (sr === '150-300') result = result.filter(p => (p.surface_area || 0) >= 150 && (p.surface_area || 0) <= 300);
      else if (sr === '>300') result = result.filter(p => (p.surface_area || 0) > 300);
    }
    if (f.characteristics.length > 0) {
      const OR_GROUPS = [
        ['bed_1', 'bed_2', 'bed_3', 'bed_4plus'],
        ['bath_1', 'bath_2plus'],
      ];
      const orGroupChecks: ((p: any) => boolean)[] = [];
      const andKeys: string[] = [];
      const assignedToGroup = new Set<string>();
      OR_GROUPS.forEach(group => {
        const activeInGroup = f.characteristics.filter(c => group.includes(c));
        if (activeInGroup.length > 0) {
          activeInGroup.forEach(k => assignedToGroup.add(k));
          orGroupChecks.push((p: any) => activeInGroup.some(c => CHAR_CHECKS[c]?.(p)));
        }
      });
      f.characteristics.forEach(c => {
        if (!assignedToGroup.has(c)) andKeys.push(c);
      });
      result = result.filter(p => {
        const orPass = orGroupChecks.every(check => check(p));
        const andPass = andKeys.every(c => CHAR_CHECKS[c]?.(p as any));
        return orPass && andPass;
      });
    }
    if (f.minSurface > 0) {
      result = result.filter(p => (p.surface_area || 0) >= f.minSurface);
    }
    return result;
  }, []);

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
    const filtered = applyFilters(properties, query, newFilters, showFavoritesOnly, favorites);
    setFilteredProperties(filtered);
    // Save recent search
    try {
      const recent = JSON.parse(localStorage.getItem('sapsap_recent_searches') || '[]');
      const updated = [query, ...recent.filter((s: string) => s !== query)].slice(0, 5);
      localStorage.setItem('sapsap_recent_searches', JSON.stringify(updated));
    } catch {}
    if (filtered.length > 0) {
      toast({ title: '🔍 Résultats', description: `${filtered.length} bien(s) trouvé(s)` });
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
    setDetailProperty(null);
    setFocusedPropertyId(null);
    setCurrentPage(1);
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
    setSearchQuery('');
    setIdxTags([]);
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
    if (prop) {
      if (isMobile) {
        setDetailProperty(prop);
        setFocusedPropertyId(id);
        addToRecentlyViewed(prop);
      } else {
        handleViewDetails(prop);
      }
    }
  }, [properties, handleViewDetails, isMobile]);

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
    setCurrentPage(1);
    setFilteredProperties(applyFilters(properties, '', newFilters, showFavoritesOnly, favorites));
    setMapQuartierTrigger(q.name);
    speak(`Voici les biens disponibles dans le quartier ${q.name}`);
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
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onSearchQueryChange={setSearchQuery}
        onToggleFavorite={toggleFavorite}
        onPropertyClick={handlePropertyClick}
        onViewDetails={handleViewDetails}
        onExploreOnMap={handleExploreOnMap}
        onFocusOnMap={handleFocusOnMap}
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

      {/* ① Hero + IDX */}
      <section className="relative h-[65vh] min-h-[520px] overflow-hidden">
        <img src={heroImage} alt="Ouagadougou" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight">
              Mon bien Immo<br />en un clic
            </h1>
            <p className="text-sm text-card/70" style={{ fontSize: '14px' }}>
              + 100 biens · Maisons · Villas · Studios · Bureaux · Locaux · Plusieurs quartiers et régions du Burkina
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="mt-8 w-full" style={{ maxWidth: '605px' }}>
            <VoiceSearch onSearchQuery={handleSearch} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
            {idxTags.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mt-3">
                {idxTags.map(tag => (
                  <span key={tag.characteristic} className="inline-flex items-center gap-1 bg-card/90 text-foreground rounded-full px-3 py-1 text-xs font-medium shadow-sm">
                    {tag.emoji} {tag.label}
                    <button onClick={() => removeIdxTag(tag.characteristic)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ② Carte interactive + Filters + Detail Panel */}
      <section id="map" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Carte interactive</h2>
        </div>

        <FilterBar
          onFilterChange={handleFilterChange}
          onReset={handleFullReset}
          quartiers={quartierNames}
          totalCount={availableProperties(properties).length}
          filteredCount={displayProperties.length}
          favoritesCount={favorites.size}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesView={toggleFavoritesView}
          computeFilteredCount={computeFilteredCount}
          externalFilters={filters}
        />

        <div className="flex gap-0 relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`transition-all duration-300 ${detailProperty ? 'w-full md:w-[calc(100%-360px)] lg:w-[calc(100%-420px)]' : 'w-full'}`}>
            <InteractiveMap
              properties={mapProperties} pois={pois} quartiers={quartiers}
              onPropertyClick={handlePropertyClick} focusedPropertyId={focusedPropertyId}
              onFocusClear={() => { setFocusedPropertyId(null); setDetailProperty(null); }}
              activeFilters={filters} externalQuartierSelect={mapQuartierTrigger}
              onExternalQuartierHandled={() => setMapQuartierTrigger(null)}
              panelOpen={!!detailProperty} onQuartierChange={setActiveQuartier} resetTrigger={mapResetTrigger}
              favoriteIds={favorites}
            />
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
                  {dp.nightPrice ? (
                    <>
                      <p className="text-sm font-bold text-primary mt-1">{dp.nightPrice} FCFA <span className="text-xs font-normal text-muted-foreground">/nuit</span></p>
                      <p className="text-xs text-muted-foreground">soit {dp.price} FCFA /mois</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-primary mt-1">{dp.price} FCFA <span className="text-xs font-normal text-muted-foreground">/mois</span></p>
                  )}
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
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button variant="outline" size="icon" disabled={currentPage === 1}
                  onClick={() => handlePageChange(-1)} className="h-10 w-10 disabled:opacity-30">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="icon" disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(1)} className="h-10 w-10 disabled:opacity-30">
                  <ChevronRight className="h-5 w-5" />
                </Button>
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

      <TestimonialsSection />
      <RecentlyViewed onViewProperty={handleRecentlyViewedClick} />

      <section id="ia" className="container mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">SapSap AI Engine</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AIComparator favorites={favoriteProperties} priorities={[]} />
          <AIProfileSection properties={properties} onHighlightProperty={handleFocusOnMap} />
        </div>
      </section>

      <Footer />
      <VirtualTourModal property={selectedProperty} open={modalOpen} onOpenChange={setModalOpen} pois={pois} />
    </div>
  );
};

export default Index;
