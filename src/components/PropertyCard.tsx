import { motion } from 'framer-motion';
import { MapPin, Bed, Maximize, Eye, Camera, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  quartier: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  comfort_rating?: number;
  security_rating?: number;
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

const typeLabels: Record<string, string> = {
  maison: 'Maison',
  bureau: 'Bureau',
  commerce: 'Commerce',
};

const PropertyCard = ({ property, onViewDetails }: PropertyCardProps) => {
  const isRented = !property.available;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price) + ' FCFA';

  const imgSrc = property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isRented ? 0 : -4 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-warm transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={imgSrc}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${!isRented ? 'group-hover:scale-105' : ''}`}
          loading="lazy"
        />

        {/* Overlay LOUÉ */}
        {isRented && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-card/95 rounded-xl px-5 py-3 shadow-lg">
                <Lock className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground tracking-widest uppercase">Loué</span>
              </div>
            </div>
          </div>
        )}

        {/* Badges top */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 font-semibold">
            {typeLabels[property.type] || property.type}
          </Badge>
          {property.virtual_tour_url && !isRented && (
            <Badge className="bg-foreground/80 text-card text-xs px-2 py-0.5 gap-1">
              <Camera className="h-3 w-3" />
              360°
            </Badge>
          )}
        </div>

        {/* Badge loué coin */}
        {isRented && (
          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 font-bold">
            LOUÉ
          </Badge>
        )}
      </div>

      {/* Content — 3 infos clés max */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-2">
          {property.title}
        </h3>

        {/* 3 infos clés : Prix | Chambres | Quartier */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lg font-bold text-primary">
            {formatPrice(property.price)}
          </div>
          <span className="text-muted-foreground text-sm">/mois</span>
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
      <div className="px-4 pb-4">
        <Button
          onClick={() => !isRented && onViewDetails(property)}
          disabled={isRented}
          variant={isRented ? 'outline' : 'default'}
          className={`w-full text-sm gap-2 ${!isRented ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-muted-foreground cursor-not-allowed'}`}
        >
          <Eye className="h-4 w-4" />
          {isRented ? 'Indisponible' : 'Voir la fiche complète'}
        </Button>
      </div>
    </motion.article>
  );
};

export default PropertyCard;
