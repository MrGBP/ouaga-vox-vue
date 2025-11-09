import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import VoiceSearch from '@/components/VoiceSearch';
import PropertyCard from '@/components/PropertyCard';
import InteractiveMap from '@/components/InteractiveMap';
import VirtualTourModal from '@/components/VirtualTourModal';
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

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

      const [propertiesResponse, poisResponse] = await Promise.all([
        supabase.from('properties').select('*').eq('available', true),
        supabase.from('pois').select('*'),
      ]);

      if (propertiesResponse.error) throw propertiesResponse.error;
      if (poisResponse.error) throw poisResponse.error;

      setProperties(propertiesResponse.data || []);
      setFilteredProperties(propertiesResponse.data || []);
      setPois(poisResponse.data || []);
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

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = properties.filter((prop) => {
      return (
        prop.title.toLowerCase().includes(lowerQuery) ||
        prop.quartier.toLowerCase().includes(lowerQuery) ||
        prop.type.toLowerCase().includes(lowerQuery) ||
        prop.description.toLowerCase().includes(lowerQuery)
      );
    });

    setFilteredProperties(filtered);

    if (filtered.length > 0) {
      const resultText = `J'ai trouvé ${filtered.length} ${filtered.length > 1 ? 'résultats' : 'résultat'} pour votre recherche.`;
      speak(resultText);
      
      toast({
        title: 'Résultats trouvés',
        description: resultText,
      });
    } else {
      speak("Désolé, je n'ai trouvé aucun résultat pour votre recherche.");
      toast({
        title: 'Aucun résultat',
        description: 'Essayez avec d\'autres mots-clés.',
        variant: 'destructive',
      });
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              Trouvez votre{' '}
              <span className="text-primary">logement idéal</span>
              <br />à Ouagadougou
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Recherche vocale · Carte interactive · Visites 360°
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
