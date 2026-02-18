import { useEffect, useRef } from 'react';
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
}

const POI_ICONS: Record<string, { emoji: string; color: string }> = {
  ecole:     { emoji: '🏫', color: '#3B82F6' },
  universite:{ emoji: '🎓', color: '#8B5CF6' },
  hopital:   { emoji: '🏥', color: '#EF4444' },
  marche:    { emoji: '🛒', color: '#F59E0B' },
  maquis:    { emoji: '🍽️', color: '#10B981' },
  restaurant:{ emoji: '🍽️', color: '#10B981' },
  banque:    { emoji: '🏦', color: '#6366F1' },
  transport: { emoji: '🚌', color: '#0EA5E9' },
  gym:       { emoji: '💪', color: '#F97316' },
  parc:      { emoji: '🌳', color: '#22C55E' },
};

const TYPE_COLORS: Record<string, string> = {
  maison:   '#1E40AF',
  bureau:   '#7C3AED',
  commerce: '#B45309',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price);

const InteractiveMap = ({ properties, pois, quartiers = [], onPropertyClick }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const quartierLayerRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [12.3714, -1.5197],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    // Quartier circles layer
    const quartierLayer = L.layerGroup().addTo(map);
    quartierLayerRef.current = quartierLayer;

    // Cluster group for properties
    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const size = count < 10 ? 38 : count < 30 ? 44 : 52;
        return L.divIcon({
          html: `<div style="
            background: #1E40AF;
            border: 3px solid white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: ${count < 10 ? 13 : 12}px;
            box-shadow: 0 3px 12px rgba(30,64,175,0.35);
          ">${count}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });
    map.addLayer(cluster);
    clusterGroupRef.current = cluster;

    // POI layer (hidden below zoom 14)
    const poiLayer = L.layerGroup();
    poiLayerRef.current = poiLayer;

    map.on('zoomend', () => {
      if (map.getZoom() >= 14) {
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
      quartierLayerRef.current = null;
    };
  }, []);

  // Update quartier circles
  useEffect(() => {
    if (!quartierLayerRef.current) return;
    quartierLayerRef.current.clearLayers();

    const colors = ['#1E40AF', '#7C3AED', '#0F766E', '#B45309', '#047857', '#0369A1', '#6D28D9'];

    quartiers.forEach((q, i) => {
      const color = colors[i % colors.length];
      L.circle([q.latitude, q.longitude], {
        color,
        fillColor: color,
        fillOpacity: 0.07,
        radius: 1800,
        weight: 1.5,
        dashArray: '6 4',
      })
        .bindTooltip(`<strong>${q.name}</strong>`, { permanent: false, direction: 'top' })
        .addTo(quartierLayerRef.current!);
    });
  }, [quartiers]);

  // Update property markers
  useEffect(() => {
    if (!clusterGroupRef.current) return;
    clusterGroupRef.current.clearLayers();

    properties.forEach((p) => {
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

      marker.bindPopup(`
        <div style="min-width:190px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#111;">${p.title}</div>
          <div style="color:#666;font-size:12px;margin-bottom:6px;">📍 ${p.quartier}</div>
          <div style="font-weight:700;font-size:16px;color:${color};margin-bottom:8px;">
            ${formatPrice(p.price)} FCFA/mois
          </div>
          ${!p.available ? '<div style="color:#9CA3AF;font-size:12px;font-weight:600;">🔒 LOUÉ</div>' : ''}
          ${p.available ? `<button onclick="window._sapsap_click('${p.id}')" style="
            background:${color};color:white;border:none;border-radius:6px;
            padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;width:100%;
          ">Voir la fiche →</button>` : ''}
        </div>
      `, { maxWidth: 220 });

      marker.on('click', () => {
        if (p.available && onPropertyClick) onPropertyClick(p.id);
      });

      clusterGroupRef.current.addLayer(marker);
    });

    // Global click handler for popup buttons
    (window as any)._sapsap_click = (id: string) => {
      if (onPropertyClick) onPropertyClick(id);
    };
  }, [properties, onPropertyClick]);

  // Update POI markers
  useEffect(() => {
    if (!poiLayerRef.current) return;
    poiLayerRef.current.clearLayers();

    pois.forEach((poi) => {
      const info = POI_ICONS[poi.type] || { emoji: '📍', color: '#6B7280' };
      const icon = L.divIcon({
        html: `<div style="
          background: white;
          border: 2px solid ${info.color};
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 1px 6px ${info.color}44;
        ">${info.emoji}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([poi.latitude, poi.longitude], { icon })
        .bindTooltip(`<strong>${poi.name}</strong><br/><span style="color:#666;font-size:11px;">${poi.type}</span>`, {
          direction: 'top',
        })
        .addTo(poiLayerRef.current!);
    });
  }, [pois]);

  return (
    <div className="relative w-full h-[560px] rounded-xl overflow-hidden border border-border shadow-card">
      <div ref={mapRef} className="w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-card text-xs space-y-1.5 z-[500]">
        <p className="font-semibold text-foreground mb-2">Légende</p>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#1E40AF'}}>🏠</span> Maison</div>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#7C3AED'}}>🏢</span> Bureau</div>
        <div className="flex items-center gap-2 text-muted-foreground"><span style={{color:'#B45309'}}>🏪</span> Commerce</div>
        <div className="border-t border-border mt-2 pt-2 text-muted-foreground/70 text-[10px]">
          POIs visibles à zoom ≥ 14
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
