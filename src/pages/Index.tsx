import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import Header from '@/components/Header';
import VoiceSearch from '@/components/VoiceSearch';
import FilterBar, { FilterState } from '@/components/FilterBar';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
import QuartiersSection from '@/components/QuartiersSection';
import { Loader2 } from 'lucide-react';
import heroImage from '@/assets/ouaga-hero.jpg';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  quartier: string;
  address: string;
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

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    quartier: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    minComfort: 0,
    minSecurity: 0,
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const { speak } = useVoiceSynthesis();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [propertiesResponse, poisResponse, quartiersResponse] = await Promise.all([
        supabase.from('properties').select('*').eq('available', true),
        supabase.from('pois').select('*'),
        supabase.from('quartiers').select('*'),
      ]);

      if (propertiesResponse.error) throw propertiesResponse.error;
      if (poisResponse.error) throw poisResponse.error;
      if (quartiersResponse.error) throw quartiersResponse.error;

      setProperties(propertiesResponse.data || []);
      setFilteredProperties(propertiesResponse.data || []);
      setPois(poisResponse.data || []);
      setQuartiers(quartiersResponse.data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (propsToFilter: Property[], searchTerm: string = '', currentFilters: FilterState = filters) => {
    let filtered = propsToFilter;

    // Apply search query
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      filtered = filtered.filter((prop) => {
        return (
          prop.title.toLowerCase().includes(lowerQuery) ||
          prop.quartier.toLowerCase().includes(lowerQuery) ||
          prop.type.toLowerCase().includes(lowerQuery) ||
          prop.description.toLowerCase().includes(lowerQuery) ||
          prop.price.toString().includes(lowerQuery)
        );
      });
    }

    // Apply type filter
    if (currentFilters.type !== 'all') {
      filtered = filtered.filter((prop) => prop.type === currentFilters.type);
    }

    // Apply quartier filter
    if (currentFilters.quartier !== 'all') {
      filtered = filtered.filter((prop) => prop.quartier === currentFilters.quartier);
    }

    // Apply price range filter
    filtered = filtered.filter(
      (prop) => prop.price >= currentFilters.minPrice && prop.price <= currentFilters.maxPrice
    );

    // Apply comfort filter
    if (currentFilters.minComfort > 0) {
      filtered = filtered.filter((prop) => (prop.comfort_rating || 0) >= currentFilters.minComfort);
    }

    // Apply security filter
    if (currentFilters.minSecurity > 0) {
      filtered = filtered.filter((prop) => (prop.security_rating || 0) >= currentFilters.minSecurity);
    }

    return filtered;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = applyFilters(properties, query, filters);
    setFilteredProperties(filtered);

    if (filtered.length > 0) {
      const resultText = `J'ai trouvé ${filtered.length} ${filtered.length > 1 ? 'résultats' : 'résultat'} correspondant à votre recherche.`;
      speak(resultText);
      
      toast({
        title: 'Résultats trouvés',
        description: resultText,
      });
    } else {
      speak("Désolé, aucun bien ne correspond à vos critères. Essayez d'élargir votre recherche.");
      toast({
        title: 'Aucun résultat',
        description: 'Essayez avec d\'autres critères ou mots-clés.',
        variant: 'destructive',
      });
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const filtered = applyFilters(properties, searchQuery, newFilters);
    setFilteredProperties(filtered);
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setModalOpen(true);
    speak(`Voici les détails de : ${property.title}`);
  };

  const handlePropertyClick = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      handleViewDetails(property);
    }
  };

  const handleQuartierClick = (quartier: Quartier) => {
    setSearchQuery(quartier.name);
    handleSearch(quartier.name);
    speak(`Voici les biens disponibles dans le quartier ${quartier.name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Ouagadougou cityscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Trouvez votre{' '}
              <span className="text-primary">bien immobilier</span>
              <br />en un clic
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              🎤 Recherche vocale · 🗺️ Carte interactive · 🎬 Visites 360°
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 w-full"
          >
            <VoiceSearch
              onSearchQuery={handleSearch}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </motion.div>
        </div>
      </section>

      {/* Quartiers Section */}
      <QuartiersSection quartiers={quartiers} onQuartierClick={handleQuartierClick} />

      {/* Filters Section */}
      <section className="container mx-auto px-4 py-8">
        <FilterBar
          onFilterChange={handleFilterChange}
          quartiers={[...new Set(properties.map((p) => p.quartier))]}
        />
      </section>

      {/* Map Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Explorez sur la carte
          </h2>
          <InteractiveMap
            properties={filteredProperties}
            pois={pois}
            quartiers={quartiers}
            onPropertyClick={handlePropertyClick}
          />
        </motion.div>
      </section>

      {/* Properties Grid */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            {searchQuery ? 'Résultats de recherche' : 'Propriétés disponibles'}
            <span className="text-primary ml-2">({filteredProperties.length})</span>
          </h2>
          
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                Aucune propriété ne correspond à votre recherche.
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Virtual Tour Modal */}
      <VirtualTourModal
        property={selectedProperty}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
