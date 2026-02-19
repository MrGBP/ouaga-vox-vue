import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface Property {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  type: string;
  quartier: string;
  available: boolean;
}

interface POI {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

interface Quartier {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  properties: Property[];
  pois: POI[];
  quartiers?: Quartier[];
  onPropertyClick?: (propertyId: string) => void;
  focusedPropertyId?: string | null;
  onFocusClear?: () => void;
}

const POI_ICONS: Record<string, { emoji: string; color: string; label: string }> = {
  ecole:      { emoji: '🏫', color: '#3B82F6', label: 'École' },
  universite: { emoji: '🎓', color: '#8B5CF6', label: 'Université' },
  hopital:    { emoji: '🏥', color: '#EF4444', label: 'Santé' },
  marche:     { emoji: '🛒', color: '#F59E0B', label: 'Marché' },
  maquis:     { emoji: '🍽️', color: '#10B981', label: 'Restaurant' },
  restaurant: { emoji: '🍽️', color: '#10B981', label: 'Restaurant' },
  banque:     { emoji: '🏦', color: '#6366F1', label: 'Banque' },
  transport:  { emoji: '🚌', color: '#0EA5E9', label: 'Transport' },
  gym:        { emoji: '💪', color: '#F97316', label: 'Sport' },
  parc:       { emoji: '🌳', color: '#22C55E', label: 'Parc' },
};

const TYPE_COLORS: Record<string, string> = {
  maison:   '#1E40AF',
  bureau:   '#7C3AED',
  commerce: '#B45309',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price);

// Ouagadougou bounds
const OUAGA_BOUNDS = L.latLngBounds(
  L.latLng(12.25, -1.65),
  L.latLng(12.50, -1.40)
);

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const InteractiveMap = ({ properties, pois, quartiers = [], onPropertyClick, focusedPropertyId, onFocusClear }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const tentacleLayerRef = useRef<L.LayerGroup | null>(null);
  const focusLayerRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [12.3714, -1.5197],
      zoom: 12,
      zoomControl: false,
      maxBounds: OUAGA_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 11,
      maxZoom: 18,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const size = count < 10 ? 40 : count < 30 ? 48 : 56;
        return L.divIcon({
          html: `<div style="
            background: hsl(220, 70%, 32%);
            border: 3px solid white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: ${count < 10 ? 14 : 13}px;
            box-shadow: 0 3px 12px hsla(220,70%,32%,0.35);
          ">${count}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });
    map.addLayer(cluster);
    clusterGroupRef.current = cluster;

    const poiLayer = L.layerGroup();
    poiLayerRef.current = poiLayer;
    const tentacleLayer = L.layerGroup().addTo(map);
    tentacleLayerRef.current = tentacleLayer;
    const focusLayer = L.layerGroup().addTo(map);
    focusLayerRef.current = focusLayer;

    map.on('zoomend', () => {
      const zoom = map.getZoom();
      if (zoom >= 14 && !focusedPropertyId) {
        if (!map.hasLayer(poiLayer)) map.addLayer(poiLayer);
      } else {
        if (map.hasLayer(poiLayer)) map.removeLayer(poiLayer);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
      poiLayerRef.current = null;
      tentacleLayerRef.current = null;
      focusLayerRef.current = null;
    };
  }, []);

  // Update property markers
  useEffect(() => {
    if (!clusterGroupRef.current) return;
    clusterGroupRef.current.clearLayers();

    const isFocusMode = !!focusedPropertyId;

    properties.forEach((p) => {
      // In focus mode, only show the focused property in the cluster
      if (isFocusMode && p.id !== focusedPropertyId) return;

      const color = p.available ? (TYPE_COLORS[p.type] || '#1E40AF') : '#9CA3AF';
      const emoji = p.type === 'maison' ? '🏠' : p.type === 'bureau' ? '🏢' : '🏪';

      const icon = L.divIcon({
        html: `<div style="
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px ${color}55;
          ${!p.available ? 'opacity:0.6;' : ''}
        ">${emoji}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon });

      // Popup with 2-3 key infos: price, type, quartier
      marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:15px;color:${color};margin-bottom:4px;">
            ${formatPrice(p.price)} FCFA<span style="font-size:11px;color:#888;font-weight:400">/mois</span>
          </div>
          <div style="font-size:12px;color:#444;margin-bottom:2px;">${emoji} ${p.type === 'maison' ? 'Maison' : p.type === 'bureau' ? 'Bureau' : 'Commerce'}</div>
          <div style="font-size:12px;color:#666;">📍 ${p.quartier}</div>
          ${!p.available ? '<div style="color:#9CA3AF;font-size:11px;font-weight:600;margin-top:4px;">🔒 LOUÉ</div>' : ''}
        </div>
      `, { maxWidth: 200 });

      marker.on('click', () => {
        if (p.available && onPropertyClick) onPropertyClick(p.id);
      });

      clusterGroupRef.current.addLayer(marker);
    });

    (window as any)._sapsap_click = (id: string) => {
      if (onPropertyClick) onPropertyClick(id);
    };
  }, [properties, onPropertyClick, focusedPropertyId]);

  // Focus mode: tentacles to nearby POIs
  useEffect(() => {
    if (!tentacleLayerRef.current || !focusLayerRef.current || !mapInstanceRef.current) return;
    tentacleLayerRef.current.clearLayers();
    focusLayerRef.current.clearLayers();

    if (!focusedPropertyId) return;

    const prop = properties.find(p => p.id === focusedPropertyId);
    if (!prop) return;

    const map = mapInstanceRef.current;

    // Fly to focused property
    map.flyTo([prop.latitude, prop.longitude], 15, { duration: 0.8 });

    // Subtle radius circle
    L.circle([prop.latitude, prop.longitude], {
      radius: 1200,
      color: 'hsl(220, 70%, 32%)',
      fillColor: 'hsl(220, 70%, 32%)',
      fillOpacity: 0.04,
      weight: 1,
      dashArray: '8 4',
    }).addTo(focusLayerRef.current);

    // Find nearby POIs and group by type (closest per type)
    const nearbyPois = pois
      .map(poi => ({
        ...poi,
        distance: getDistance(prop.latitude, prop.longitude, poi.latitude, poi.longitude),
      }))
      .filter(poi => poi.distance < 2000)
      .sort((a, b) => a.distance - b.distance);

    // Group by type, keep closest per type
    const byType = new Map<string, typeof nearbyPois[0]>();
    nearbyPois.forEach(poi => {
      if (!byType.has(poi.type)) byType.set(poi.type, poi);
    });

    const closestPerType = Array.from(byType.values());

    // Draw tentacle lines + POI markers
    closestPerType.forEach(poi => {
      const info = POI_ICONS[poi.type] || { emoji: '📍', color: '#6B7280', label: poi.type };
      const distLabel = poi.distance < 1000 ? `${poi.distance}m` : `${(poi.distance / 1000).toFixed(1)}km`;

      // Tentacle line
      const line = L.polyline(
        [[prop.latitude, prop.longitude], [poi.latitude, poi.longitude]],
        {
          color: info.color,
          weight: 1.5,
          opacity: 0.5,
          dashArray: '6 4',
        }
      );
      line.addTo(tentacleLayerRef.current!);

      // Midpoint label
      const midLat = (prop.latitude + poi.latitude) / 2;
      const midLng = (prop.longitude + poi.longitude) / 2;
      const midLabel = L.divIcon({
        html: `<div style="
          background: white;
          border: 1px solid ${info.color}44;
          border-radius: 8px;
          padding: 2px 6px;
          font-size: 10px;
          color: ${info.color};
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">${info.label} · ${distLabel}</div>`,
        className: '',
        iconAnchor: [40, 8],
      });
      L.marker([midLat, midLng], { icon: midLabel, interactive: false }).addTo(tentacleLayerRef.current!);

      // POI marker
      const poiIcon = L.divIcon({
        html: `<div style="
          background: white;
          border: 2px solid ${info.color};
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 1px 4px ${info.color}33;
        ">${info.emoji}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
        .bindTooltip(`<strong>${poi.name}</strong><br/><span style="color:#666;font-size:11px;">${info.label} · ${distLabel}</span>`, {
          direction: 'top',
        })
        .addTo(tentacleLayerRef.current!);
    });
  }, [focusedPropertyId, properties, pois]);

  // Update POI markers (non-focus mode only)
  useEffect(() => {
    if (!poiLayerRef.current) return;
    poiLayerRef.current.clearLayers();
    if (focusedPropertyId) return; // Don't show generic POIs in focus mode

    pois.forEach((poi) => {
      const info = POI_ICONS[poi.type] || { emoji: '📍', color: '#6B7280', label: poi.type };
      const icon = L.divIcon({
        html: `<div style="
          background: white;
          border: 2px solid ${info.color};
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 1px 4px ${info.color}33;
        ">${info.emoji}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([poi.latitude, poi.longitude], { icon })
        .bindTooltip(`<strong>${poi.name}</strong><br/><span style="color:#666;font-size:11px;">${info.label}</span>`, {
          direction: 'top',
        })
        .addTo(poiLayerRef.current!);
    });
  }, [pois, focusedPropertyId]);

  return (
    <div className="relative w-full h-[560px] rounded-xl overflow-hidden border border-border shadow-card">
      <div ref={mapRef} className="w-full h-full" />

      {/* Focus mode indicator */}
      {focusedPropertyId && (
        <button
          onClick={onFocusClear}
          className="absolute top-4 left-4 z-[500] bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-card text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Mode Focus actif
          <span className="text-muted-foreground ml-1">✕ Quitter</span>
        </button>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-card text-xs space-y-1.5 z-[500]">
        <p className="font-semibold text-foreground mb-2">Légende</p>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#1E40AF'}}>🏠</span> Maison</div>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#7C3AED'}}>🏢</span> Bureau</div>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#B45309'}}>🏪</span> Commerce</div>
        {!focusedPropertyId && (
          <div className="border-t border-border mt-2 pt-2 text-muted-foreground/70 text-[10px]">
            Cliquez un bien pour le mode Focus
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
