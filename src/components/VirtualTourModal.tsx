import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Maximize, Star } from 'lucide-react';

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
  virtual_tour_url?: string;
}

interface VirtualTourModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VirtualTourModal = ({ property, open, onOpenChange }: VirtualTourModalProps) => {
  if (!property) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{property.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Virtual Tour Viewer */}
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
            {property.virtual_tour_url ? (
              <iframe
                src={property.virtual_tour_url}
                className="w-full h-full"
                allowFullScreen
                title="Visite virtuelle 360°"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <img
                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end">
                    <div className="p-6 w-full">
                      <p className="text-sm text-muted-foreground">
                        🎬 Visite virtuelle 360° bientôt disponible
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">{property.type}</Badge>
              <Badge className="bg-accent">Disponible</Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{property.address}, {property.quartier}</span>
            </div>

            <div className="text-3xl font-bold text-primary">
              {formatPrice(property.price)}
            </div>

            <p className="text-foreground leading-relaxed">
              {property.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              {property.bedrooms !== undefined && property.bedrooms > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <Bed className="h-6 w-6 text-primary" />
                  <span className="text-sm text-muted-foreground">Chambres</span>
                  <span className="font-semibold">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && property.bathrooms > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <Bath className="h-6 w-6 text-primary" />
                  <span className="text-sm text-muted-foreground">Salles de bain</span>
                  <span className="font-semibold">{property.bathrooms}</span>
                </div>
              )}
              {property.surface_area && (
                <div className="flex flex-col items-center gap-2">
                  <Maximize className="h-6 w-6 text-primary" />
                  <span className="text-sm text-muted-foreground">Surface</span>
                  <span className="font-semibold">{property.surface_area}m²</span>
                </div>
              )}
              {property.comfort_rating && (
                <div className="flex flex-col items-center gap-2">
                  <Star className="h-6 w-6 text-secondary fill-secondary" />
                  <span className="text-sm text-muted-foreground">Confort</span>
                  <span className="font-semibold">{property.comfort_rating}/5</span>
                </div>
              )}
            </div>

            {property.security_rating && (
              <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <Star className="h-8 w-8 text-accent fill-accent" />
                <div>
                  <p className="font-semibold">Note de sécurité</p>
                  <p className="text-2xl font-bold text-accent">{property.security_rating}/5</p>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {property.images && property.images.length > 1 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Galerie photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${property.title} - Photo ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTourModal;
