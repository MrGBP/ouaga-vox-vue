import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockProperties, mockPois, mockQuartiers } from '@/lib/mockData';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import Header from '@/components/Header';
import VoiceSearch from '@/components/VoiceSearch';
import FilterBar, { FilterState, DEFAULT_FILTERS } from '@/components/FilterBar';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
import QuartiersSection from '@/components/QuartiersSection';
import AIComparator from '@/components/AIComparator';
import AIProfileSection from '@/components/AIProfileSection';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import { Loader2, MapPin, Home, Sparkles } from 'lucide-react';
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
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
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
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const { toast } = useToast();
  const { speak } = useVoiceSynthesis();

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, poisRes, quartiersRes] = await Promise.all([
        supabase.from('properties').select('*').order('price', { ascending: false }),
        supabase.from('pois').select('*'),
        supabase.from('quartiers').select('*'),
      ]);

      const props = (propertiesRes.data && propertiesRes.data.length > 0) ? propertiesRes.data : null;
      const poisData = (poisRes.data && poisRes.data.length > 0) ? poisRes.data : null;
      const quartiersData = (quartiersRes.data && quartiersRes.data.length > 0) ? quartiersRes.data : null;

      const finalProps = props || mockProperties;
      const finalPois = poisData || mockPois;
      const finalQuartiers = quartiersData || mockQuartiers;

      setProperties(finalProps);
      setFilteredProperties(finalProps);
      setPois(finalPois);
      setQuartiers(finalQuartiers);
    } catch (error: any) {
      console.warn('DB error, using mock data:', error.message);
      setProperties(mockProperties);
      setFilteredProperties(mockProperties);
      setPois(mockPois);
      setQuartiers(mockQuartiers);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((
    source: Property[],
    query: string,
    f: FilterState,
    favsOnly: boolean,
    favSet: Set<string>
  ) => {
    let result = [...source];

    if (favsOnly) result = result.filter(p => favSet.has(p.id));

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.quartier.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.price.toString().includes(q)
      );
    }

    if (f.type !== 'all') result = result.filter(p => p.type === f.type);
    if (f.quartier !== 'all') result = result.filter(p => p.quartier === f.quartier);
    result = result.filter(p => p.price >= f.minPrice && p.price <= f.maxPrice);
    if (f.minBedrooms > 0) result = result.filter(p => (p.bedrooms || 0) >= f.minBedrooms);
    if (f.hasVirtualTour) result = result.filter(p => !!p.virtual_tour_url);
    if (f.onlyAvailable) result = result.filter(p => p.available);
    if (f.surfaceRange && f.surfaceRange !== 'all') {
      const sr = f.surfaceRange;
      if (sr === '<50') result = result.filter(p => (p.surface_area || 0) < 50);
      else if (sr === '50-150') result = result.filter(p => (p.surface_area || 0) >= 50 && (p.surface_area || 0) <= 150);
      else if (sr === '150-300') result = result.filter(p => (p.surface_area || 0) >= 150 && (p.surface_area || 0) <= 300);
      else if (sr === '>300') result = result.filter(p => (p.surface_area || 0) > 300);
    }

    return result;
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = applyFilters(properties, query, filters, showFavoritesOnly, favorites);
    setFilteredProperties(filtered);

    if (filtered.length > 0) {
      const msg = `J'ai trouvé ${filtered.length} résultat${filtered.length > 1 ? 's' : ''} pour "${query}".`;
      speak(msg);
      toast({ title: '🔍 Résultats', description: msg });
    } else {
      speak("Aucun bien ne correspond à votre recherche.");
      toast({ title: 'Aucun résultat', description: 'Élargissez votre recherche.', variant: 'destructive' });
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setFilteredProperties(applyFilters(properties, searchQuery, newFilters, showFavoritesOnly, favorites));
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

  const handlePropertyClick = (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setFocusedPropertyId(id);
      setDetailProperty(prop);
    }
  };

  const handleFocusOnMap = (id: string) => {
    setFocusedPropertyId(id);
    const prop = properties.find(p => p.id === id);
    if (prop) setDetailProperty(prop);
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [mapQuartierTrigger, setMapQuartierTrigger] = useState<string | null>(null);

  const handleQuartierClick = (q: Quartier) => {
    const newFilters = { ...filters, quartier: q.name };
    setFilters(newFilters);
    setSearchQuery('');
    setFilteredProperties(applyFilters(properties, '', newFilters, showFavoritesOnly, favorites));
    setMapQuartierTrigger(q.name);
    speak(`Voici les biens disponibles dans le quartier ${q.name}`);
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: '💔 Retiré des favoris' });
      } else {
        next.add(id);
        toast({ title: '❤️ Ajouté aux favoris' });
      }
      if (showFavoritesOnly) {
        setTimeout(() => {
          setFilteredProperties(applyFilters(properties, searchQuery, filters, true, next));
        }, 0);
      }
      return next;
    });
  };

  const toggleFavoritesView = () => {
    const next = !showFavoritesOnly;
    setShowFavoritesOnly(next);
    setFilteredProperties(applyFilters(properties, searchQuery, filters, next, favorites));
  };

  const favoriteProperties = properties.filter(p => favorites.has(p.id));
  const quartierNames = [...new Set(properties.map(p => p.quartier))].sort();

  // Similar properties for detail panel
  const similarProperties = detailProperty
    ? properties.filter(p => p.id !== detailProperty.id && (p.quartier === detailProperty.quartier || p.type === detailProperty.type)).slice(0, 3)
    : [];

  const mapProperties = showFavoritesOnly ? filteredProperties : properties;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative h-[65vh] min-h-[520px] overflow-hidden">
        <img src={heroImage} alt="Ouagadougou" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl space-y-4"
          >
            <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Ouagadougou, Burkina Faso
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight">
              Mon{' '}
              <span className="text-primary bg-card px-2 rounded-lg">bien Immo</span>
              <br />en un clic
            </h1>
            <p className="text-base md:text-lg text-card/90 font-medium">
              {properties.length} biens · Ouagadougou · {quartierNames.length} quartiers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 w-full max-w-2xl"
          >
            <VoiceSearch
              onSearchQuery={handleSearch}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </motion.div>
        </div>
      </section>

      {/* Quartiers */}
      <section id="quartiers">
        <QuartiersSection quartiers={quartiers} onQuartierClick={handleQuartierClick} />
      </section>

      {/* Map + Filters */}
      <section id="map" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Carte interactive</h2>
        </div>

        <FilterBar
          onFilterChange={handleFilterChange}
          quartiers={quartierNames}
          totalCount={properties.length}
          filteredCount={filteredProperties.length}
          favoritesCount={favorites.size}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesView={toggleFavoritesView}
        />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <InteractiveMap
              properties={mapProperties}
              pois={pois}
              quartiers={quartiers}
              onPropertyClick={handlePropertyClick}
              focusedPropertyId={focusedPropertyId}
              onFocusClear={() => {
                setFocusedPropertyId(null);
                setDetailProperty(null);
              }}
              activeFilters={filters}
              externalQuartierSelect={mapQuartierTrigger}
              onExternalQuartierHandled={() => setMapQuartierTrigger(null)}
            />
          </motion.div>
        </div>
      </section>

      {/* Properties grid */}
      <section id="properties" className="container mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {showFavoritesOnly ? '❤️ Mes favoris' : searchQuery ? `Résultats pour "${searchQuery}"` : 'Tous les biens'}
          </h2>
          <span className="text-sm text-muted-foreground font-medium">
            <span className="text-foreground font-bold">{filteredProperties.length}</span> résultat{filteredProperties.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProperties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <PropertyCard
                  property={p}
                  onViewDetails={handleViewDetails}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={toggleFavorite}
                  onFocusOnMap={handleFocusOnMap}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <div className="text-4xl mb-4">{showFavoritesOnly ? '❤️' : '🏠'}</div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {showFavoritesOnly ? 'Aucun favori' : 'Aucun bien correspond'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {showFavoritesOnly ? 'Ajoutez des biens en favoris avec le bouton ❤️' : 'Essayez de modifier vos filtres.'}
            </p>
            {!showFavoritesOnly && (
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setFilteredProperties(applyFilters(properties, searchQuery, DEFAULT_FILTERS, false, favorites));
                }}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Réinitialiser tout ×
              </button>
            )}
          </div>
        )}
      </section>

      {/* AI Section */}
      <section id="ia" className="container mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Intelligence IA</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AIComparator favorites={favoriteProperties} priorities={[]} />
          <AIProfileSection properties={properties} onHighlightProperty={handleFocusOnMap} />
        </div>
      </section>

      <VirtualTourModal
        property={selectedProperty}
        open={modalOpen}
        onOpenChange={setModalOpen}
        pois={pois}
      />

      {/* Property Detail Panel */}
      {detailProperty && (
        <PropertyDetailPanel
          property={detailProperty}
          onClose={() => {
            setDetailProperty(null);
            setFocusedPropertyId(null);
          }}
          pois={pois}
          isFavorite={favorites.has(detailProperty.id)}
          onToggleFavorite={toggleFavorite}
          onViewTour={(p) => {
            setSelectedProperty(p);
            setModalOpen(true);
          }}
          similarProperties={similarProperties}
          onSelectProperty={(id) => {
            const p = properties.find(pr => pr.id === id);
            if (p) {
              setDetailProperty(p);
              setFocusedPropertyId(id);
            }
          }}
        />
      )}
    </div>
  );
};

export default Index;
