import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Bed, Bath, Maximize, Star, Camera, Play,
  ChevronLeft, ChevronRight, Clock, X, Shield, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

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
  virtual_tour_url?: string;
  available: boolean;
}

interface POI {
  id: string;
  name: string;
  type: string;
  quartier: string;
  latitude: number;
  longitude: number;
}

interface VirtualTourModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pois?: POI[];
}

const POI_ICONS: Record<string, string> = {
  ecole: '🏫', universite: '🎓', hopital: '🏥', marche: '🛒',
  maquis: '🍽️', restaurant: '🍽️', banque: '🏦', transport: '🚌', gym: '💪', parc: '🌳',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price) + ' FCFA';

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const VirtualTourModal = ({ property, open, onOpenChange, pois = [] }: VirtualTourModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'video' | 'tour360' | 'map'>('photos');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Nearby POIs
  const nearbyPois = property
    ? pois
        .filter((poi) => poi.quartier === property.quartier)
        .map((poi) => ({
          ...poi,
          distance: getDistance(property.latitude, property.longitude, poi.latitude, poi.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6)
    : [];

  // Mini-map init
  useEffect(() => {
    if (!mapRef.current || !property || !open || activeTab !== 'map') return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    setTimeout(() => {
      if (!mapRef.current) return;
      const map = L.map(mapRef.current, {
        center: [property.latitude, property.longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OSM',
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:#1E40AF;border:3px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(30,64,175,0.4);">🏠</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([property.latitude, property.longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong>${property.title}</strong><br/>${property.quartier}`)
        .openPopup();

      // Add nearby POIs
      nearbyPois.forEach((poi) => {
        const emoji = POI_ICONS[poi.type] || '📍';
        const poiIcon = L.divIcon({
          html: `<div style="background:white;border:2px solid #3B82F6;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;">${emoji}</div>`,
          className: '',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
          .addTo(map)
          .bindTooltip(poi.name, { direction: 'top' });
      });

      mapInstanceRef.current = map;
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [property, open, activeTab]);

  // Reservation countdown
  useEffect(() => {
    if (!reserved) return;
    const end = Date.now() + 24 * 3600 * 1000;
    const tick = () => {
      const remaining = Math.max(0, end - Date.now());
      setCountdown(remaining);
      if (remaining > 0) setTimeout(tick, 1000);
    };
    tick();
  }, [reserved]);

  if (!property) return null;

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  const typeLabels: Record<string, string> = { maison: 'Maison', bureau: 'Bureau', commerce: 'Commerce' };

  const handleReserve = () => {
    setReserving(true);
    setTimeout(() => {
      setReserving(false);
      setReserved(true);
      toast({
        title: '✅ Réservation confirmée !',
        description: 'Ce bien est réservé pour vous pendant 24h. Notre équipe vous contactera.',
      });
    }, 1500);
  };

  const formatCountdown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'video', label: 'Vidéo HD', icon: Play },
    { key: 'tour360', label: 'Visite 360°', icon: Zap },
    { key: 'map', label: 'Carte & POIs', icon: MapPin },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {typeLabels[property.type] || property.type}
                </Badge>
                {property.virtual_tour_url && (
                  <Badge className="bg-accent text-accent-foreground text-xs gap-1">
                    <Camera className="h-3 w-3" /> 360° Disponible
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground truncate">{property.title}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{property.address}, {property.quartier}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-primary">{formatPrice(property.price)}</div>
              <div className="text-xs text-muted-foreground">par mois</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
                  activeTab === key
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Photos */}
              {activeTab === 'photos' && (
                <div className="space-y-3">
                  <div className="relative h-72 md:h-80 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={images[photoIdx]}
                      alt={`Photo ${photoIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoIdx((i) => (i - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card border border-border rounded-full p-2 shadow-card transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPhotoIdx((i) => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card border border-border rounded-full p-2 shadow-card transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoIdx(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? 'bg-card w-4' : 'bg-card/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="absolute top-3 right-3 bg-foreground/60 text-card text-xs px-2 py-1 rounded-full">
                      {photoIdx + 1} / {images.length}
                    </div>
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`h-16 rounded-lg overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-primary' : 'border-transparent'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vidéo */}
              {activeTab === 'video' && (
                <div className="h-72 md:h-80 rounded-xl overflow-hidden bg-muted relative flex items-center justify-center">
                  <img src={images[0]} alt="" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-warm">
                      <Play className="h-7 w-7 text-primary-foreground ml-1" />
                    </div>
                    <div className="bg-card/90 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                      <p className="font-semibold text-foreground text-sm">Visite vidéo HD</p>
                      <p className="text-xs text-muted-foreground">Aperçu cinématique du bien · 2 min 30s</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tour 360° */}
              {activeTab === 'tour360' && (
                <div className="h-72 md:h-80 rounded-xl overflow-hidden bg-muted relative">
                  {property.virtual_tour_url ? (
                    <iframe
                      src={property.virtual_tour_url}
                      className="w-full h-full"
                      allowFullScreen
                      title="Visite 360°"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={images[0]} alt="" className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="text-4xl">🔭</div>
                        <div className="bg-card/90 rounded-xl px-5 py-3 text-center">
                          <p className="font-semibold text-foreground">Visite 360° bientôt disponible</p>
                          <p className="text-xs text-muted-foreground mt-1">Compatible Matterport · Kuula · Nodalview</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Carte & POIs */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div ref={mapRef} className="h-56 rounded-xl overflow-hidden border border-border" />
                  {nearbyPois.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Points d'intérêt proches</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {nearbyPois.map((poi) => (
                          <div
                            key={poi.id}
                            className="flex items-center gap-2.5 bg-muted rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="text-lg">{POI_ICONS[poi.type] || '📍'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground text-xs truncate">{poi.name}</p>
                              <p className="text-muted-foreground text-xs capitalize">{poi.type}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 font-medium">
                              {poi.distance < 1000 ? `${poi.distance}m` : `${(poi.distance / 1000).toFixed(1)}km`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Property specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {property.bedrooms !== undefined && property.bedrooms > 0 && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Bed className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold text-foreground">{property.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Chambres</div>
              </div>
            )}
            {property.bathrooms !== undefined && property.bathrooms > 0 && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Bath className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold text-foreground">{property.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Salles de bain</div>
              </div>
            )}
            {property.surface_area && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Maximize className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold text-foreground">{property.surface_area}m²</div>
                <div className="text-xs text-muted-foreground">Surface</div>
              </div>
            )}
            {property.comfort_rating && (
              <div className="bg-muted rounded-xl p-3 text-center">
                <Star className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold text-foreground">{property.comfort_rating}/5</div>
                <div className="text-xs text-muted-foreground">Confort</div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
          </div>

          {/* Ratings */}
          {(property.comfort_rating || property.security_rating) && (
            <div className="flex gap-4">
              {property.comfort_rating && (
                <div className="flex-1 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                  <Star className="h-5 w-5 text-primary mx-auto mb-1 fill-primary" />
                  <div className="text-lg font-bold text-primary">{property.comfort_rating}/5</div>
                  <div className="text-xs text-muted-foreground">Confort</div>
                </div>
              )}
              {property.security_rating && (
                <div className="flex-1 bg-accent/5 border border-accent/20 rounded-xl p-3 text-center">
                  <Shield className="h-5 w-5 text-accent mx-auto mb-1" />
                  <div className="text-lg font-bold text-accent">{property.security_rating}/5</div>
                  <div className="text-xs text-muted-foreground">Sécurité</div>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
            {reserved ? (
              <div className="flex-1 bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Réservé — Expire dans</p>
                  <p className="text-xl font-bold text-accent font-mono">{formatCountdown(countdown)}</p>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleReserve}
                disabled={reserving}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 text-sm font-semibold"
              >
                <Clock className="h-4 w-4" />
                {reserving ? 'Réservation en cours…' : 'Réserver 24h (utilisateurs vérifiés)'}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 h-12 text-sm gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Camera className="h-4 w-4" />
              Comparer ce bien
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTourModal;
