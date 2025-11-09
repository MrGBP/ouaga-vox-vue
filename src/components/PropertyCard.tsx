import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Maximize, Star, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

const PropertyCard = ({ property, onViewDetails }: PropertyCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maison': return 'bg-primary';
      case 'bureau': return 'bg-secondary';
      case 'commerce': return 'bg-accent';
      default: return 'bg-muted';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full shadow-soft hover:shadow-warm transition-all">
        <div className="relative h-48 overflow-hidden">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <Badge className={`absolute top-3 left-3 ${getTypeColor(property.type)}`}>
            {property.type}
          </Badge>
          {property.available && (
            <Badge className="absolute top-3 right-3 bg-accent">
              Disponible
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 text-foreground line-clamp-1">
            {property.title}
          </h3>
          
          <div className="flex items-center gap-1 text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{property.quartier}</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {property.description}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {property.bedrooms !== undefined && property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms !== undefined && property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.bathrooms}</span>
              </div>
            )}
            {property.surface_area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.surface_area}m²</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            {property.comfort_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-secondary fill-secondary" />
                <span className="text-sm font-medium">{property.comfort_rating}</span>
                <span className="text-xs text-muted-foreground">Confort</span>
              </div>
            )}
            {property.security_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-medium">{property.security_rating}</span>
                <span className="text-xs text-muted-foreground">Sécurité</span>
              </div>
            )}
          </div>

          <div className="text-2xl font-bold text-primary">
            {formatPrice(property.price)}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={() => onViewDetails(property)} 
            className="w-full"
            variant="default"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir détails & Visite 360°
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PropertyCard;
