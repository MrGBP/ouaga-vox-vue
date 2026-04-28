import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTypeLabel, isTypeFurnished, pricePerNight } from '@/lib/mockData';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  quartier: string;
  bedrooms?: number;
  surface_area?: number;
  furnished?: boolean;
  images?: string[];
}

interface FocusMapBannerProps {
  property: Property | null;
  onOpenDetails: () => void;
  onClose: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

/**
 * Bandeau flottant affiché en mode focus map (carte avec radius + POI, sans fiche ouverte).
 * Permet à l'utilisateur de savoir quel bien il regarde et de rouvrir la fiche.
 */
const FocusMapBanner = ({ property, onOpenDetails, onClose }: FocusMapBannerProps) => {
  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto"
          style={{ maxWidth: 'min(560px, calc(100% - 24px))', width: '100%' }}
        >
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-warm overflow-hidden">
            <div className="flex items-stretch gap-3 p-2.5">
              {/* Thumbnail */}
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  loading="lazy"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 font-semibold">
                    {getTypeLabel(property.type)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5 min-w-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{property.quartier}</span>
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-foreground truncate leading-tight">
                  {property.title}
                </h3>
                <div className="text-xs font-bold text-primary mt-0.5">
                  {(() => {
                    const isF = isTypeFurnished(property.type) || property.furnished;
                    if (isF) {
                      const n = pricePerNight(property.price);
                      return <>{fmt(n)} FCFA<span className="font-normal text-muted-foreground"> /nuit</span></>;
                    }
                    return <>{fmt(property.price)} FCFA<span className="font-normal text-muted-foreground"> /mois</span></>;
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  onClick={onOpenDetails}
                  size="sm"
                  className="h-9 px-3 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Revoir la fiche</span>
                  <span className="sm:hidden">Fiche</span>
                </Button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Fermer le mode carte"
                  title="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FocusMapBanner;
