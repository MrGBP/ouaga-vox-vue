import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, ChevronLeft, ChevronRight, MapPin, Bed, Bath,
  Maximize, Calendar, Phone, MessageCircle, Mail, Camera,
  Thermometer, Shield, Zap, TreePine, Droplets, Wifi,
  Map, Accessibility,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { POI_CATALOG } from '@/lib/mockData';
import ReservationFlow from './ReservationFlow';

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
  year_built?: number;
  has_ac?: boolean;
  has_guardian?: boolean;
  has_generator?: boolean;
  has_garden?: boolean;
  has_water?: boolean;
  has_internet?: boolean;
  status?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_photo?: string;
  furnished?: boolean;
  has_video?: boolean;
}

interface POI {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

interface PropertyDetailPanelProps {
  property: Property | null;
  onClose: () => void;
  pois: POI[];
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onViewTour?: (property: Property) => void;
  similarProperties?: Property[];
  onSelectProperty?: (id: string) => void;
  onHighlightPoi?: (poiId: string) => void;
  onExploreOnMap?: (id: string) => void;
  isMobileOverride?: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const distanceM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const fmtDist = (d: number) => (d < 1000 ? `${d}m` : `${(d / 1000).toFixed(1)}km`);

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison meublée', villa: 'Villa', bureau: 'Bureau',
  commerce: 'Commerce', boutique: 'Boutique', terrain: 'Terrain',
  appartement: 'Appartement',
};

const PropertyDetailPanel = ({
  property,
  onClose,
  pois,
  isFavorite = false,
  onToggleFavorite,
  onViewTour,
  similarProperties = [],
  onSelectProperty,
  onHighlightPoi,
  onExploreOnMap,
  isMobileOverride,
}: PropertyDetailPanelProps) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const isMobile = isMobileOverride ?? false;

  if (!property) return null;

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];

  // Price display: furnished → per night
  const isFurnished = property.furnished || false;
  const displayPrice = isFurnished ? Math.round(property.price / 26) : property.price;
  const priceSuffix = isFurnished ? '/nuit' : '/mois';

  // Nearby POIs
  const nearbyPois = pois
    .map(poi => ({ ...poi, distance: distanceM(property.latitude, property.longitude, poi.latitude, poi.longitude) }))
    .filter(p => p.distance < 1500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // Features grid
  const features = [
    property.bedrooms && property.bedrooms > 0 && { icon: Bed, label: 'Chambres', value: property.bedrooms },
    property.bathrooms && property.bathrooms > 0 && { icon: Bath, label: 'SdB', value: property.bathrooms },
    property.surface_area && { icon: Maximize, label: 'Surface', value: `${property.surface_area}m²` },
    property.year_built && { icon: Calendar, label: 'Année', value: property.year_built },
    property.has_ac && { icon: Thermometer, label: 'Clim', value: '✓' },
    property.has_guardian && { icon: Shield, label: 'Gardien', value: '✓' },
    property.has_generator && { icon: Zap, label: 'Groupe', value: '✓' },
    property.has_garden && { icon: TreePine, label: 'Jardin', value: '✓' },
    property.has_water && { icon: Droplets, label: 'Eau', value: '✓' },
    property.has_internet && { icon: Wifi, label: 'Internet', value: '✓' },
  ].filter(Boolean) as { icon: any; label: string; value: any }[];

  // Ratings — numeric "X.X / 5", no stars
  const ratings = [
    property.comfort_rating && { label: 'Confort', value: property.comfort_rating, emoji: '🛋️', LucideIcon: null },
    property.security_rating && { label: 'Sécurité', value: property.security_rating, emoji: '🔒', LucideIcon: null },
    property.accessibility_rating && { label: 'Accessibilité', value: property.accessibility_rating, emoji: null, LucideIcon: Accessibility },
  ].filter(Boolean) as { label: string; value: number; emoji: string | null; LucideIcon: any }[];

  const panelContent = (
    <>
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {/* ① Galerie photos */}
      <div className="relative h-56 bg-muted">
        <img
          src={images[photoIdx]}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1.5 shadow hover:bg-card active:scale-95 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPhotoIdx(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1.5 shadow hover:bg-card active:scale-95 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIdx ? 'bg-card w-3' : 'bg-card/60'}`} />
              ))}
            </div>
          </>
        )}

        {/* Close + Favorite */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(property.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-all hover:scale-110 active:scale-95 ${
                isFavorite ? 'bg-secondary text-secondary-foreground' : 'bg-card/80 text-muted-foreground hover:text-secondary'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center shadow hover:bg-card active:scale-95 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ② Visite 360° / Vidéo */}
        {(property.virtual_tour_url || property.has_video) && (
          <div className="flex gap-2">
            {property.virtual_tour_url && (
              <Badge
                className="bg-accent text-accent-foreground cursor-pointer gap-1 px-3 py-1.5 hover:bg-accent/80 active:scale-95 transition-all"
                onClick={() => onViewTour?.(property)}
              >
                <Camera className="h-3.5 w-3.5" /> Visite 360°
              </Badge>
            )}
            {property.has_video && (
              <Badge className="bg-muted text-foreground gap-1 px-3 py-1.5">
                🎬 Vidéo HD
              </Badge>
            )}
          </div>
        )}

        {/* Identity — Title + Price + Type */}
        <div>
          <h3 className="text-lg font-bold text-foreground">{property.title}</h3>
          <div className="text-2xl font-bold text-primary mt-1">
            {fmt(displayPrice)} FCFA <span className="text-sm font-medium text-muted-foreground">{priceSuffix}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {isFurnished ? 'Location courte durée · min 1 nuit' : 'Location mensuelle'}
            </span>
            <Badge className="bg-primary/10 text-primary text-xs">
              {TYPE_LABELS[property.type] || property.type}
            </Badge>
            {isFurnished && (
              <Badge className="bg-accent/20 text-accent-foreground text-xs">Meublé</Badge>
            )}
          </div>
        </div>

        {/* ③ Caractéristiques principales */}
        {features.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Caractéristiques</h4>
            <div className="grid grid-cols-5 gap-2">
              {features.map((f, i) => (
                <div key={i} className="flex flex-col items-center bg-muted/50 rounded-lg p-2 text-center">
                  <f.icon className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-xs font-bold text-foreground">{f.value}</span>
                  <span className="text-[9px] text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ④ Description détaillée */}
        {property.description && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
              {property.description}
            </p>
            {property.description.length > 150 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-xs text-primary font-medium mt-1 hover:underline"
              >
                {descExpanded ? 'Voir moins' : 'Lire plus'}
              </button>
            )}
          </div>
        )}

        {/* ⑤ POI proches */}
        {nearbyPois.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Proches du bien</h4>
            <div className="space-y-1.5">
              {nearbyPois.map(poi => {
                const cat = POI_CATALOG[poi.type] || { emoji: '📍', color: '#666', label: poi.type, bg: '#f5f5f5' };
                return (
                  <button
                    key={poi.id}
                    onClick={() => onHighlightPoi?.(poi.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left"
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{poi.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.label}</p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{fmtDist(poi.distance)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ⑥ Notes et évaluations — numeric "X / 5", no stars */}
        {ratings.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Évaluations</h4>
            <div className="flex flex-wrap gap-2">
              {ratings.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  {r.LucideIcon ? <r.LucideIcon className="h-4 w-4 text-primary" /> : <span className="text-sm">{r.emoji}</span>}
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                  <span className="text-sm font-bold text-primary">{r.value} / 5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑦ Actions — Réserver + Explorer (no Comparer) */}
        <div className="flex gap-2">
          {property.type === 'bureau' || property.type === 'commerce' ? (
            <Button className="flex-1 bg-primary text-primary-foreground gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
              <Phone className="h-4 w-4" />
              Contacter l'agent
            </Button>
          ) : (
            <Button
              onClick={() => setShowReservation(true)}
              className="flex-1 bg-primary text-primary-foreground gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              <Calendar className="h-4 w-4" />
              Réserver
            </Button>
          )}
          {onExploreOnMap && (
            <Button
              variant="outline"
              onClick={() => onExploreOnMap(property.id)}
              className="gap-2 hover:bg-muted active:scale-[0.98] transition-all"
              title="Explorer sur la carte"
            >
              <Map className="h-4 w-4" />
              🗺️ Explorer
            </Button>
          )}
        </div>

        {/* Agent */}
        {property.agent_name && (
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              {property.agent_photo && (
                <img src={property.agent_photo} alt={property.agent_name} className="w-10 h-10 rounded-full object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{property.agent_name}</p>
                <p className="text-[10px] text-muted-foreground">Répond en général en moins de 2h</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]">
                <Phone className="h-3 w-3" /> Appeler
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]">
                <Mail className="h-3 w-3" /> Email
              </Button>
            </div>
          </div>
        )}

        {/* Similar properties */}
        {similarProperties.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Biens similaires</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {similarProperties.slice(0, 3).map(sp => (
                <button
                  key={sp.id}
                  onClick={() => onSelectProperty?.(sp.id)}
                  className="shrink-0 w-36 bg-muted/50 rounded-lg overflow-hidden hover:ring-1 hover:ring-primary/30 active:scale-[0.98] transition-all"
                >
                  <img
                    src={sp.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'}
                    alt={sp.title}
                    className="w-full h-20 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-[10px] font-medium text-foreground truncate">{sp.title}</p>
                    <p className="text-xs font-bold text-primary">{fmt(sp.price)} FCFA</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reservation Flow Modal */}
      <AnimatePresence>
        {showReservation && (
          <ReservationFlow
            property={property}
            onClose={() => setShowReservation(false)}
          />
        )}
      </AnimatePresence>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border shadow-lg bg-card overflow-y-auto z-[700]"
        >
          {panelContent}
        </motion.div>
      </AnimatePresence>
    );
  }

  return <div className="bg-card">{panelContent}</div>;
};

export default PropertyDetailPanel;
