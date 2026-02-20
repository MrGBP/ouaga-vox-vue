import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const OUAGA_CENTER: [number, number] = [12.3714, -1.5197];
const OUAGA_BOUNDS = L.latLngBounds(L.latLng(12.25, -1.65), L.latLng(12.50, -1.40));

const RADIUS_OPTIONS = [
  { label: '300 m', value: 300 },
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
];

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const distanceM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const fmtDist = (d: number) => (d < 1000 ? `${d} m` : `${(d / 1000).toFixed(1)} km`);

// Adaptive pin size: sqrt scale, min 48 max 88
const pinSize = (count: number, zoom: number): number => {
  const base = Math.round(48 + Math.sqrt(count) * 5);
  const capped = Math.min(Math.max(base, 48), 88);
  const zoomFactor = zoom >= 13 ? 1.1 : zoom >= 12 ? 1 : 0.92;
  return Math.round(capped * zoomFactor);
};

// Quartier pin HTML
const quartierPinHTML = (name: string, count: number, size: number) => {
  const fontSize = Math.max(11, Math.round(size * 0.22));
  const countSize = Math.max(13, Math.round(size * 0.26));
  return `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      background:white;
      border:2.5px solid hsl(220,70%,32%);
      border-radius:${size / 2}px;
      box-shadow:0 4px 16px hsla(220,70%,32%,0.22), 0 1px 4px rgba(0,0,0,0.08);
      cursor:pointer;
      gap:1px;
      transition:transform 0.15s;
    ">
      <span style="font-size:${countSize}px;font-weight:800;color:hsl(220,70%,32%);line-height:1;">${count}</span>
      <span style="font-size:${fontSize}px;font-weight:600;color:hsl(220,25%,42%);line-height:1;text-align:center;max-width:${size - 10}px;overflow:hidden;white-space:nowrap;">${name}</span>
    </div>
  `;
};

// Individual property pin
const propertyPinHTML = (p: Property, focused: boolean) => {
  const typeEmoji = p.type === 'maison' ? '🏠' : p.type === 'bureau' ? '🏢' : '🏪';
  const typeLabel = p.type === 'maison' ? 'Maison' : p.type === 'bureau' ? 'Bureau' : 'Commerce';
  const color = !p.available ? '#9CA3AF' : 'hsl(220,70%,32%)';
  const pulse = focused ? 'box-shadow:0 0 0 6px hsla(220,70%,32%,0.18),0 4px 20px hsla(220,70%,32%,0.35);' : '';
  return `
    <div style="
      background:${focused ? 'hsl(220,70%,32%)' : 'white'};
      border:2.5px solid ${focused ? 'white' : color};
      border-radius:12px;
      padding:6px 10px;
      font-family:system-ui,sans-serif;
      min-width:130px;
      text-align:center;
      ${pulse}
      cursor:pointer;
    ">
      <div style="font-size:13px;font-weight:800;color:${focused ? 'white' : color};line-height:1.2;">${fmt(p.price)} <span style="font-size:10px;font-weight:500;opacity:0.75">FCFA</span></div>
      <div style="font-size:10px;color:${focused ? 'rgba(255,255,255,0.8)' : '#666'};margin-top:2px;">${typeEmoji} ${typeLabel} · ${p.quartier}</div>
      ${!p.available ? `<div style="font-size:9px;color:${focused ? 'rgba(255,255,255,0.6)' : '#9CA3AF'};margin-top:2px;font-weight:600;">LOUÉ</div>` : ''}
    </div>
  `;
};

// ─── Component ────────────────────────────────────────────────────────────────
const InteractiveMap = ({
  properties,
  pois,
  quartiers = [],
  onPropertyClick,
  focusedPropertyId,
  onFocusClear,
}: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const quartierLayer = useRef<L.LayerGroup | null>(null);
  const propertyLayer = useRef<L.LayerGroup | null>(null);
  const focusLayer = useRef<L.LayerGroup | null>(null);
  const tentacleLayer = useRef<L.LayerGroup | null>(null);
  const overlayLayer = useRef<L.LayerGroup | null>(null);
  const zoomHandlerRef = useRef<(() => void) | null>(null);
  const [radius, setRadius] = useState(500);
  const [zoom, setZoom] = useState(12);
  const [showProperties, setShowProperties] = useState(false);

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const map = L.map(mapRef.current, {
      center: OUAGA_CENTER,
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

    const oLayer = L.layerGroup().addTo(map);
    const qLayer = L.layerGroup().addTo(map);
    const pLayer = L.layerGroup().addTo(map);
    const tLayer = L.layerGroup().addTo(map);
    const fLayer = L.layerGroup().addTo(map);

    overlayLayer.current = oLayer;
    quartierLayer.current = qLayer;
    propertyLayer.current = pLayer;
    tentacleLayer.current = tLayer;
    focusLayer.current = fLayer;

    map.on('zoomend', () => setZoom(map.getZoom()));
    mapInst.current = map;

    return () => {
      map.remove();
      mapInst.current = null;
      quartierLayer.current = null;
      propertyLayer.current = null;
      focusLayer.current = null;
      tentacleLayer.current = null;
      overlayLayer.current = null;
    };
  }, []);

  // ── Render quartier/property pins ─────────────────────────────────────────
  const renderPins = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    if (focusedPropertyId) return; // handled by focus effect

    const map = mapInst.current;
    const z = map.getZoom();

    // Build quartier → properties map
    const byQuartier = new Map<string, Property[]>();
    properties.forEach(p => {
      const arr = byQuartier.get(p.quartier) || [];
      arr.push(p);
      byQuartier.set(p.quartier, arr);
    });

    const showIndividual = showProperties || z >= 15;

    if (!showIndividual) {
      // Show quartier aggregate pins
      quartiers.forEach(q => {
        const qProps = byQuartier.get(q.name) || [];
        if (qProps.length === 0) return;
        const count = qProps.length;
        const sz = pinSize(count, z);
        const icon = L.divIcon({
          html: quartierPinHTML(q.name, count, sz),
          className: '',
          iconSize: [sz, sz],
          iconAnchor: [sz / 2, sz / 2],
        });
        const available = qProps.filter(p => p.available).length;
        const m = L.marker([q.latitude, q.longitude], { icon, zIndexOffset: 100 });
        m.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;min-width:130px;">
            <strong style="color:hsl(220,70%,32%)">${q.name}</strong><br/>
            <span style="font-size:11px;color:#555;">${count} biens · ${available} disponibles</span>
          </div>`,
          { direction: 'top', offset: [0, -(sz / 2 + 4)] }
        );
        m.on('click', () => map.flyTo([q.latitude, q.longitude], 15, { duration: 0.7 }));
        quartierLayer.current!.addLayer(m);
      });
    } else {
      // Show individual property pins
      properties.forEach(p => {
        const icon = L.divIcon({
          html: propertyPinHTML(p, false),
          className: '',
          iconSize: [140, 52],
          iconAnchor: [70, 26],
        });
        const m = L.marker([p.latitude, p.longitude], { icon });
        m.on('click', () => {
          if (onPropertyClick) onPropertyClick(p.id);
        });
        propertyLayer.current!.addLayer(m);
      });
    }
  }, [properties, quartiers, focusedPropertyId, showProperties, onPropertyClick]);

  useEffect(() => {
    if (!mapInst.current) return;
    const map = mapInst.current;

    // Remove previous handler
    if (zoomHandlerRef.current) {
      map.off('zoomend', zoomHandlerRef.current);
    }

    const handler = () => renderPins();
    zoomHandlerRef.current = handler;
    map.on('zoomend', handler);
    renderPins();

    return () => {
      map.off('zoomend', handler);
    };
  }, [renderPins]);

  // ── Focus mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!focusLayer.current || !tentacleLayer.current || !overlayLayer.current || !mapInst.current) return;

    focusLayer.current.clearLayers();
    tentacleLayer.current.clearLayers();
    overlayLayer.current.clearLayers();
    quartierLayer.current?.clearLayers();
    propertyLayer.current?.clearLayers();

    if (!focusedPropertyId) {
      renderPins();
      return;
    }

    const prop = properties.find(p => p.id === focusedPropertyId);
    if (!prop) return;

    const map = mapInst.current;
    map.flyTo([prop.latitude, prop.longitude], 16, { duration: 0.8 });

    // ── Dark overlay
    const bigBounds: L.LatLngTuple[] = [
      [11.0, -3.5], [11.0, 0.5],
      [13.8, 0.5], [13.8, -3.5],
    ];
    L.polygon(bigBounds, {
      color: 'transparent',
      fillColor: '#1a2540',
      fillOpacity: 0.3,
      interactive: false,
    }).addTo(overlayLayer.current);

    // ── Focused property pin
    const focusIcon = L.divIcon({
      html: propertyPinHTML(prop, true),
      className: '',
      iconSize: [150, 60],
      iconAnchor: [75, 30],
    });
    L.marker([prop.latitude, prop.longitude], { icon: focusIcon, zIndexOffset: 1000 })
      .on('click', () => { if (onPropertyClick) onPropertyClick(prop.id); })
      .addTo(focusLayer.current);

    // ── Radius circles
    const radiusConfig = [
      { r: 300, opacity: 0.10, dash: '8 4', weight: 1.5 },
      { r: 500, opacity: 0.07, dash: '10 5', weight: 1.2 },
      { r: 1000, opacity: 0.04, dash: '12 6', weight: 1 },
    ];
    radiusConfig.forEach(({ r, opacity, dash, weight }) => {
      if (r > radius) return;
      L.circle([prop.latitude, prop.longitude], {
        radius: r,
        color: 'hsl(220,70%,32%)',
        fillColor: 'hsl(220,70%,52%)',
        fillOpacity: opacity,
        weight,
        dashArray: dash,
        interactive: false,
      }).addTo(focusLayer.current!);
    });

    // ── POI tentacles: group by type, show count + closest distance
    // Collect all POIs within radius, grouped by type
    const groupedByType = new Map<string, POI[]>();
    pois.forEach(poi => {
      const d = distanceM(prop.latitude, prop.longitude, poi.latitude, poi.longitude);
      if (d > radius) return;
      const arr = groupedByType.get(poi.type) || [];
      arr.push(poi);
      groupedByType.set(poi.type, arr);
    });

    // For each type group: find closest POI, draw one tentacle to it, label with count
    groupedByType.forEach((groupPois, type) => {
      const info = POI_ICONS[type] || { emoji: '📍', color: '#6B7280', label: type };

      // Sort by distance, closest first
      const withDist = groupPois.map(poi => ({
        ...poi,
        distance: distanceM(prop.latitude, prop.longitude, poi.latitude, poi.longitude),
      })).sort((a, b) => a.distance - b.distance);

      const closest = withDist[0];
      const count = withDist.length;

      // Tentacle line to closest POI
      L.polyline(
        [[prop.latitude, prop.longitude], [closest.latitude, closest.longitude]],
        {
          color: info.color,
          weight: 1.3,
          opacity: 0.5,
          dashArray: '6 4',
          interactive: false,
        }
      ).addTo(tentacleLayer.current!);

      // Midpoint label: "Catégorie (N) – plus proche X m"
      const midLat = (prop.latitude + closest.latitude) / 2;
      const midLng = (prop.longitude + closest.longitude) / 2;
      const labelText = count > 1
        ? `${info.label} (${count}) · ${fmtDist(closest.distance)}`
        : `${info.label} · ${fmtDist(closest.distance)}`;

      L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `<div style="
            background:white;
            border:1px solid ${info.color}40;
            border-radius:20px;
            padding:2px 8px;
            font-family:system-ui,sans-serif;
            font-size:9px;
            color:${info.color};
            font-weight:700;
            white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,0.08);
            pointer-events:none;
          ">${labelText}</div>`,
          className: '',
          iconAnchor: [45, 8],
        }),
        interactive: false,
      }).addTo(tentacleLayer.current!);

      // POI dot at closest location
      L.marker([closest.latitude, closest.longitude], {
        icon: L.divIcon({
          html: `<div style="
            background:white;
            border:2px solid ${info.color};
            border-radius:50%;
            width:28px;
            height:28px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:13px;
            box-shadow:0 2px 8px ${info.color}30;
          ">${info.emoji}</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 500,
      })
        .bindTooltip(
          `<strong style="color:${info.color}">${info.label}</strong>${count > 1 ? ` <span style="opacity:0.7">(${count} à proximité)</span>` : ''}<br/><span style="font-size:11px;color:#666">Le plus proche : ${closest.name} · ${fmtDist(closest.distance)}</span>`,
          { direction: 'top' }
        )
        .addTo(tentacleLayer.current!);
    });

  }, [focusedPropertyId, properties, pois, radius, onPropertyClick, renderPins]);

  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden border border-border shadow-card">
      <div ref={mapRef} className="w-full h-full" />

      {/* ── Focus mode control bar ───────────────────────────────────────── */}
      {focusedPropertyId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2">
          <div className="bg-card/96 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-card flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Rayon</span>
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRadius(opt.value)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  radius === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={onFocusClear}
            className="bg-card/96 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Quitter le focus
          </button>
        </div>
      )}

      {/* ── Default controls ──────────────────────────────────────────────── */}
      {!focusedPropertyId && (
        <div className="absolute top-3 left-3 z-[500] flex items-center gap-2">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground shadow-card">
            {showProperties ? 'Vue biens individuels' : 'Vue quartiers'}
          </div>
          <button
            onClick={() => setShowProperties(prev => !prev)}
            className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-card"
          >
            {showProperties ? '🏘️ Vue quartiers' : '📍 Vue biens'}
          </button>
        </div>
      )}

      {/* ── Zoom badge ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-12 right-3 z-[500] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-[10px] font-mono text-muted-foreground shadow-card">
        zoom {zoom}
      </div>
    </div>
  );
};

export default InteractiveMap;
