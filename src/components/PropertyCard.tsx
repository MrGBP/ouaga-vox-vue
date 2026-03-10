import { motion } from 'framer-motion';
import { MapPin, Bed, Maximize, Eye, Camera, Heart, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTypeLabel, getTypeEmoji, isTypeFurnished, pricePerNight } from '@/lib/mockData';

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
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
  furnished?: boolean;
  created_at?: string;
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onFocusOnMap?: (id: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const PropertyCard = ({ property, onViewDetails, isFavorite = false, onToggleFavorite, onFocusOnMap }: PropertyCardProps) => {
  const isFurnished = isTypeFurnished(property.type) || property.furnished || false;
  const nightPrice = isFurnished ? pricePerNight(property.price) : 0;
  const imgSrc = property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop';

  // Badge "Nouveau" — créé il y a moins de 7 jours
  const isNew = property.created_at
    ? (Date.now() - new Date(property.created_at).getTime()) < 7 * 86400000
    : false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-warm transition-all duration-300 cursor-pointer"
      onClick={() => onViewDetails(property)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img src={imgSrc} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 font-semibold">
            {getTypeLabel(property.type)}
          </Badge>
          {property.virtual_tour_url && (
            <Badge className="bg-foreground/80 text-card text-xs px-2 py-0.5 gap-1">
              <Camera className="h-3 w-3" /> 360°
            </Badge>
          )}
          {isNew && (
            <Badge className="text-xs px-2 py-0.5 font-semibold" style={{ background: '#1a3560', color: '#fff', borderRadius: 6, fontSize: 10 }}>
              Nouveau
            </Badge>
          )}
        </div>

        {/* Heart */}
        <div className="absolute top-3 right-3">
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(property.id); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                isFavorite ? 'bg-secondary text-secondary-foreground' : 'bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-secondary'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-2">{property.title}</h3>

        {/* Pricing: nightly first for furnished */}
        <div className="mb-3">
          {isFurnished && nightPrice > 0 ? (
            <>
              <div className="text-lg font-bold text-primary">
                {fmt(nightPrice)} FCFA <span className="text-sm font-normal text-muted-foreground">/nuit</span>
              </div>
              <div className="text-xs text-muted-foreground">
                soit {fmt(property.price)} FCFA /mois
              </div>
            </>
          ) : (
            <div className="text-lg font-bold text-primary">
              {fmt(property.price)} FCFA <span className="text-sm font-normal text-muted-foreground">/mois</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{property.quartier}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {property.bedrooms !== undefined && property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                <span>{property.bedrooms} ch.</span>
              </div>
            )}
            {property.surface_area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                <span>{property.surface_area}m²</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 flex gap-2">
        {onFocusOnMap && (
          <Button
            onClick={(e) => { e.stopPropagation(); onFocusOnMap(property.id); }}
            variant="outline" size="icon"
            className="shrink-0 h-9 w-9 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            title="Voir sur la carte"
          >
            <Map className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={(e) => { e.stopPropagation(); onViewDetails(property); }} className="flex-1 text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Eye className="h-4 w-4" /> Voir la fiche
        </Button>
      </div>
    </motion.article>
  );
};

export default PropertyCard;
