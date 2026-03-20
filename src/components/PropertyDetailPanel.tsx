import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, ChevronLeft, ChevronRight, MapPin, Bed, Bath,
  Maximize, Calendar, Phone, MessageCircle, Mail, Camera,
  Thermometer, Shield, Zap, TreePine, Droplets, Wifi,
  Map, Accessibility, Share2, PhoneCall, Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { POI_CATALOG, getTypeLabel, getTypeEmoji, isTypeFurnished, pricePerNight } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
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
  has_video?: boolean;
  video_url?: string;
  year_built?: number;
  has_ac?: boolean;
  has_guardian?: boolean;
  has_generator?: boolean;
  has_garden?: boolean;
  has_water?: boolean;
  has_internet?: boolean;
  has_kitchen?: boolean;
  has_fridge?: boolean;
  has_tv?: boolean;
  has_terrace?: boolean;
  has_pool?: boolean;
  has_parking_int?: boolean;
  has_parking_ext?: boolean;
  has_fence?: boolean;
  has_cameras?: boolean;
  has_paved_road?: boolean;
  has_water_tower?: boolean;
  status?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_photo?: string;
  furnished?: boolean;
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

type MediaItem = { type: 'photo'; url: string } | { type: 'video'; url: string };

const PropertyDetailPanel = ({
  property, onClose, pois, isFavorite = false, onToggleFavorite, onViewTour,
  similarProperties = [], onSelectProperty, onHighlightPoi, onExploreOnMap, isMobileOverride,
}: PropertyDetailPanelProps) => {
  const [mediaIdx, setMediaIdx] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [showAllPois, setShowAllPois] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState('');
  const [show360Overlay, setShow360Overlay] = useState(false);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const isMobile = isMobileOverride ?? false;

  // Reset media index when property changes
  useEffect(() => { setMediaIdx(0); setDescExpanded(false); setShowAllPois(false); setShowAllFeatures(false); }, [property?.id]);

  if (!property) return null;

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  const isFurnished = isTypeFurnished(property.type) || property.furnished || false;
  const nightPrice = isFurnished ? pricePerNight(property.price) : 0;
  const videoUrl = property.video_url || (property.has_video ? 'https://www.w3schools.com/html/mov_bbb.mp4' : null);

  // Build media items
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'photo' as const, url })),
    ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
  ];

  const photoCount = images.length;
  const videoCount = videoUrl ? 1 : 0;

  // Nearby POIs
  const nearbyPois = pois
    .map(poi => ({ ...poi, distance: distanceM(property.latitude, property.longitude, poi.latitude, poi.longitude) }))
    .filter(p => p.distance < 1500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 25);

  const visiblePois = showAllPois ? nearbyPois : nearbyPois.slice(0, 3);

  // Features
  // Essential features
  const essentialFeatures = [
    property.bedrooms && property.bedrooms > 0 && { icon: Bed, label: 'Chambres', value: property.bedrooms },
    property.bathrooms && property.bathrooms > 0 && { icon: Bath, label: 'SdB', value: property.bathrooms },
    property.surface_area && { icon: Maximize, label: 'Surface', value: `${property.surface_area}m²` },
    property.year_built && { icon: Calendar, label: 'Année', value: property.year_built },
  ].filter(Boolean) as { icon: any; label: string; value: any }[];

  // Equipment features
  const equipmentFeatures = [
    property.has_ac && { emoji: '❄️', label: 'Climatisation' },
    property.has_internet && { emoji: '📶', label: 'WiFi' },
    property.has_kitchen && { emoji: '🍳', label: 'Cuisine' },
    property.has_tv && { emoji: '📺', label: 'TV' },
    property.has_generator && { emoji: '⚡', label: 'Groupe élec.' },
    property.has_water && { emoji: '💧', label: 'Eau' },
    property.has_fridge && { emoji: '🧊', label: 'Frigo' },
    property.has_garden && { emoji: '🌳', label: 'Jardin' },
    property.has_terrace && { emoji: '🏖️', label: 'Terrasse' },
    property.has_pool && { emoji: '🏊', label: 'Piscine' },
  ].filter(Boolean) as { emoji: string; label: string }[];

  // Security & access features
  const securityFeatures = [
    property.has_guardian && { emoji: '🛡️', label: 'Gardien' },
    property.has_fence && { emoji: '🔒', label: 'Clôture' },
    property.has_cameras && { emoji: '📹', label: 'Caméras' },
    property.has_paved_road && { emoji: '🛣️', label: 'Goudronnée' },
    property.has_parking_int && { emoji: '🚗', label: 'Parking int.' },
    property.has_parking_ext && { emoji: '🅿️', label: 'Parking ext.' },
    property.has_water_tower && { emoji: '🗼', label: 'Château d\'eau' },
  ].filter(Boolean) as { emoji: string; label: string }[];

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

  // Ratings
  const ratings = [
    property.comfort_rating && { label: 'Confort', value: property.comfort_rating },
    property.security_rating && { label: 'Sécurité', value: property.security_rating },
    property.accessibility_rating && { label: 'Accessibilité', value: property.accessibility_rating },
  ].filter(Boolean) as { label: string; value: number }[];

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const msg = `🏠 ${property.title} — ${property.quartier}\n💰 ${fmt(property.price)} FCFA/mois${isFurnished ? ` · ${fmt(nightPrice)} FCFA/nuit` : ''}\n✅ Vérifié sur SapSapHouse\n👉 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Callback
  const handleCallback = () => {
    if (!callbackPhone.trim()) return;
    toast({ title: '📞 Demande envoyée', description: 'Vous serez contacté(e) sous 24h.' });
    setShowCallbackModal(false);
    setCallbackPhone('');
  };

  const currentMedia = mediaItems[mediaIdx];

  const panelContent = (
    <>
      {isMobile && (
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {/* ── Media Slider ── */}
      <div className="relative h-56 bg-muted overflow-hidden">
        {currentMedia?.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img src={currentMedia?.url || images[0]} alt={property.title} className="w-full h-full object-cover" />
        )}

        {/* Navigation arrows */}
        {mediaItems.length > 1 && (
          <>
            <button onClick={() => setMediaIdx(i => (i - 1 + mediaItems.length) % mediaItems.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1.5 shadow hover:bg-card active:scale-95 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setMediaIdx(i => (i + 1) % mediaItems.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1.5 shadow hover:bg-card active:scale-95 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {mediaItems.map((_, i) => (
            <button key={i} onClick={() => setMediaIdx(i)} className={`rounded-full transition-all ${i === mediaIdx ? 'bg-card w-3 h-1.5' : 'bg-card/60 w-1.5 h-1.5'}`} />
          ))}
        </div>

        {/* Video badge */}
        {currentMedia?.type === 'video' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-card/80 text-foreground gap-1 text-xs"><Play className="h-3 w-3" /> Vidéo</Badge>
          </div>
        )}

        {/* Top right actions */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {onToggleFavorite && (
            <button onClick={() => onToggleFavorite(property.id)} className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-all hover:scale-110 active:scale-95 ${isFavorite ? 'bg-secondary text-secondary-foreground' : 'bg-card/80 text-muted-foreground hover:text-secondary'}`}>
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center shadow hover:bg-card active:scale-95 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Media type buttons */}
      <div className="flex gap-2 px-5 pt-3">
        <Badge className="bg-muted text-foreground gap-1 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/80" onClick={() => setMediaIdx(0)}>
          📷 {photoCount} photo{photoCount > 1 ? 's' : ''}
        </Badge>
        {videoUrl && (
          <Badge className="bg-muted text-foreground gap-1 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/80" onClick={() => setShowVideoOverlay(true)}>
            🎥 1 vidéo
          </Badge>
        )}
        {property.virtual_tour_url && (
          <Badge className="bg-accent text-accent-foreground gap-1 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent/80" onClick={() => setShow360Overlay(true)}>
            🔭 Visite 360°
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Identity */}
        <div>
          <h3 className="text-lg font-bold text-foreground">{property.title}</h3>
          {isFurnished && nightPrice > 0 ? (
            <>
              <div className="text-2xl font-bold text-primary mt-1">
                {fmt(nightPrice)} FCFA <span className="text-sm font-medium text-muted-foreground">/nuit</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                soit {fmt(property.price)} FCFA /mois
              </div>
            </>
          ) : (
            <div className="text-2xl font-bold text-primary mt-1">
              {fmt(property.price)} FCFA <span className="text-sm font-medium text-muted-foreground">/mois</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="bg-primary/10 text-primary text-xs">
              {getTypeLabel(property.type)}
            </Badge>
          </div>
        </div>

        {/* Section: Essentiel */}
        {essentialFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Maximize className="h-3 w-3 text-primary" />
              </div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Essentiel</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {essentialFeatures.map((f, i) => (
                <div key={i} className="flex flex-col items-center bg-muted/50 rounded-lg p-2 text-center">
                  <f.icon className="h-4 w-4 text-primary mb-0.5" />
                  <span className="text-xs font-bold text-foreground">{f.value}</span>
                  <span className="text-[9px] text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Équipements */}
        {equipmentFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                <Zap className="h-3 w-3 text-accent-foreground" />
              </div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Équipements</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {equipmentFeatures.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1 text-xs text-foreground">
                  {f.emoji} {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Sécurité & Accès */}
        {securityFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-3 w-3 text-primary" />
              </div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sécurité & Accès</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {securityFeatures.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1 text-xs text-foreground">
                  {f.emoji} {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>{property.description}</p>
            {property.description.length > 150 && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-primary font-medium mt-1 hover:underline">
                {descExpanded ? 'Voir moins' : 'Lire plus'}
              </button>
            )}
          </div>
        )}

        {/* POI */}
        {nearbyPois.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Proches du bien</h4>
            <div className="space-y-1.5">
              {visiblePois.map(poi => {
                const cat = POI_CATALOG[poi.type] || { emoji: '📍', color: '#666', label: poi.type, bg: '#f5f5f5' };
                return (
                  <button key={poi.id} onClick={() => onHighlightPoi?.(poi.id)} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: cat.bg, color: cat.color }}>{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{poi.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.label}</p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{fmtDist(poi.distance)}</span>
                  </button>
                );
              })}
            </div>
            {nearbyPois.length > 3 && (
              <button onClick={() => setShowAllPois(!showAllPois)} className="text-xs text-primary font-medium mt-1 hover:underline">
                {showAllPois ? 'Voir moins' : `+${nearbyPois.length - 3} autres`}
              </button>
            )}
          </div>
        )}

        {/* Ratings — label left, score right, no icons */}
        {ratings.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Évaluations</h4>
            <div className="space-y-1.5">
              {ratings.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                  <span className="text-sm"><span className="font-bold text-primary">{typeof r.value === 'number' ? r.value.toFixed(1) : r.value}</span> <span className="text-muted-foreground">/ 5</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions — sticky bottom for mobile */}
        {isMobile ? (
          <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-card px-4 py-3 flex gap-3 -mx-5 -mb-5" style={{ marginLeft: -20, marginRight: -20, marginBottom: -20, paddingLeft: 16, paddingRight: 16 }}>
            {onExploreOnMap && (
              <button
                onClick={() => onExploreOnMap(property.id)}
                className="flex items-center justify-center gap-2 h-12 px-4 bg-primary/10 text-primary rounded-xl text-sm font-semibold active:scale-[0.97] transition-transform flex-shrink-0"
                style={{ minWidth: 52 }}
                title="Explorer sur la carte"
              >
                <Map className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowReservation(true)}
              className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold active:scale-[0.97] transition-transform"
            >
              📅 Réserver · {isFurnished && nightPrice > 0
                ? `${fmt(nightPrice)} FCFA/nuit`
                : `${fmt(property.price)} FCFA/mois`}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {property.type === 'bureau' || property.type === 'local_commercial' ? (
              <Button className="flex-1 bg-primary text-primary-foreground gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
                <Phone className="h-4 w-4" /> Contacter l'agent
              </Button>
            ) : (
              <Button onClick={() => setShowReservation(true)} className="flex-1 bg-primary text-primary-foreground gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
                <Calendar className="h-4 w-4" /> Réserver
              </Button>
            )}
            {onExploreOnMap && (
              <Button variant="outline" size="icon" onClick={() => onExploreOnMap(property.id)} className="shrink-0 h-10 w-10 hover:bg-muted active:scale-[0.98] transition-all" title="Explorer sur la carte">
                <Map className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* WhatsApp + Callback */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleWhatsAppShare} className="flex-1 gap-2 text-xs hover:bg-muted active:scale-[0.98]">
            📲 Partager WhatsApp
          </Button>
          <Button variant="outline" onClick={() => setShowCallbackModal(true)} className="flex-1 gap-2 text-xs hover:bg-muted active:scale-[0.98]">
            <PhoneCall className="h-3.5 w-3.5" /> Me rappeler
          </Button>
        </div>

        {/* Agent */}
        {property.agent_name && (
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              {property.agent_photo && <img src={property.agent_photo} alt={property.agent_name} className="w-10 h-10 rounded-full object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{property.agent_name}</p>
                <p className="text-[10px] text-muted-foreground">Répond en général en moins de 2h</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]"><Phone className="h-3 w-3" /> Appeler</Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]"><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs hover:bg-muted active:scale-[0.98]"><Mail className="h-3 w-3" /> Email</Button>
            </div>
          </div>
        )}

        {/* Similar */}
        {similarProperties.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Biens similaires dans ce quartier</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {similarProperties.slice(0, 3).map(sp => (
                <button key={sp.id} onClick={() => onSelectProperty?.(sp.id)} className="shrink-0 w-36 bg-muted/50 rounded-lg overflow-hidden hover:ring-1 hover:ring-primary/30 active:scale-[0.98] transition-all">
                  <img src={sp.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'} alt={sp.title} className="w-full h-20 object-cover" />
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

      {/* Callback Modal */}
      <AnimatePresence>
        {showCallbackModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800] flex items-center justify-center bg-foreground/40" onClick={() => setShowCallbackModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-xl p-5 w-80 shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-foreground mb-3">📞 Demande de rappel</h3>
              <input
                type="tel"
                placeholder="Votre numéro de téléphone"
                value={callbackPhone}
                onChange={e => setCallbackPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground mb-3"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCallbackModal(false)} className="flex-1 text-xs">Annuler</Button>
                <Button onClick={handleCallback} className="flex-1 text-xs bg-primary text-primary-foreground">Envoyer</Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Vous serez contacté(e) sous 24h</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservation Flow */}
      <AnimatePresence>
        {showReservation && <ReservationFlow property={property} onClose={() => setShowReservation(false)} />}
      </AnimatePresence>

      {/* ── Fullscreen 360° Overlay ── */}
      <AnimatePresence>
        {show360Overlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: '#000' }}
          >
            <iframe
              src={property.virtual_tour_url || ''}
              className="w-full h-full border-none"
              allowFullScreen
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
            />
            <button
              onClick={() => setShow360Overlay(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl text-card z-[10000] hover:bg-card/20 transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fullscreen Video Overlay ── */}
      <AnimatePresence>
        {showVideoOverlay && videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: '#000' }}
          >
            <video
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
            <button
              onClick={() => setShowVideoOverlay(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl text-card z-[10000] hover:bg-card/20 transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
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
