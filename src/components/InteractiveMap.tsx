import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  price: number;
  type: string;
  quartier: string;
  address?: string;
  available: boolean;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  comfort_rating?: number;
  security_rating?: number;
  images?: string[];
  virtual_tour_url?: string;
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

// Harmonious muted POI palette for focus mode
const POI_ICONS: Record<string, { emoji: string; color: string; label: string }> = {
  ecole:      { emoji: '🏫', color: '#64748B', label: 'École' },
  universite: { emoji: '🎓', color: '#7C8DB0', label: 'Université' },
  hopital:    { emoji: '🏥', color: '#94A3B8', label: 'Santé' },
  marche:     { emoji: '🛒', color: '#78909C', label: 'Marché' },
  maquis:     { emoji: '🍽️', color: '#6B8E84', label: 'Restaurant' },
  restaurant: { emoji: '🍽️', color: '#6B8E84', label: 'Restaurant' },
  banque:     { emoji: '🏦', color: '#7986CB', label: 'Banque' },
  transport:  { emoji: '🚌', color: '#5C97A5', label: 'Transport' },
  gym:        { emoji: '💪', color: '#8D7B6A', label: 'Sport' },
  parc:       { emoji: '🌳', color: '#6D9B7A', label: 'Parc' },
};

const TILE_DEFAULT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
// Desaturated tile for focus mode — CartoDB Positron (light, clean, muted)
const TILE_FOCUS = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

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

// Adaptive pin size
const pinSize = (count: number, zoom: number): number => {
  const base = Math.round(48 + Math.sqrt(count) * 5);
  const capped = Math.min(Math.max(base, 48), 88);
  const zoomFactor = zoom >= 13 ? 1.1 : zoom >= 12 ? 1 : 0.92;
  return Math.round(capped * zoomFactor);
};

// Quartier pin HTML
const quartierPinHTML = (name: string, count: number, size: number, isActive = false) => {
  const fontSize = Math.max(11, Math.round(size * 0.22));
  const countSize = Math.max(13, Math.round(size * 0.26));
  const borderColor = isActive ? 'hsl(220,70%,42%)' : 'hsl(220,70%,32%)';
  const bg = isActive ? 'hsl(220,70%,32%)' : 'white';
  const textColor = isActive ? 'white' : 'hsl(220,70%,32%)';
  const subColor = isActive ? 'rgba(255,255,255,0.8)' : 'hsl(220,25%,42%)';
  return `
    <div style="
      width:${size}px;height:${size}px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:${bg};border:2.5px solid ${borderColor};border-radius:${size / 2}px;
      box-shadow:0 4px 16px hsla(220,70%,32%,0.22);cursor:pointer;gap:1px;transition:transform 0.15s;
    ">
      <span style="font-size:${countSize}px;font-weight:800;color:${textColor};line-height:1;">${count}</span>
      <span style="font-size:${fontSize}px;font-weight:600;color:${subColor};line-height:1;text-align:center;max-width:${size - 10}px;overflow:hidden;white-space:nowrap;">${name}</span>
    </div>
  `;
};

// Property pin HTML
const propertyPinHTML = (p: Property, focused: boolean) => {
  const typeEmoji = p.type === 'maison' ? '🏠' : p.type === 'bureau' ? '🏢' : '🏪';
  const typeLabel = p.type === 'maison' ? 'Maison' : p.type === 'bureau' ? 'Bureau' : 'Commerce';
  const color = !p.available ? '#9CA3AF' : 'hsl(220,70%,32%)';
  const pulse = focused ? 'box-shadow:0 0 0 8px hsla(220,70%,50%,0.2),0 0 0 16px hsla(220,70%,50%,0.08),0 4px 20px hsla(220,70%,32%,0.35);' : '';
  return `
    <div style="
      background:${focused ? 'hsl(220,70%,32%)' : 'white'};
      border:2.5px solid ${focused ? 'hsl(220,70%,50%)' : color};
      border-radius:12px;padding:6px 10px;font-family:system-ui,sans-serif;min-width:130px;text-align:center;
      ${pulse}cursor:pointer;transition:all 0.2s;
    ">
      <div style="font-size:13px;font-weight:800;color:${focused ? 'white' : color};line-height:1.2;">${fmt(p.price)} <span style="font-size:10px;font-weight:500;opacity:0.75">FCFA</span></div>
      <div style="font-size:10px;color:${focused ? 'rgba(255,255,255,0.8)' : '#666'};margin-top:2px;">${typeEmoji} ${typeLabel} · ${p.quartier}</div>
      ${!p.available ? `<div style="font-size:9px;color:${focused ? 'rgba(255,255,255,0.6)' : '#9CA3AF'};margin-top:2px;font-weight:600;">LOUÉ</div>` : ''}
    </div>
  `;
};

// Smart offset to avoid overlapping markers in quartier view
const offsetProperties = (props: Property[]): { prop: Property; lat: number; lng: number }[] => {
  const placed: { lat: number; lng: number }[] = [];
  const MIN_GAP = 0.0008; // ~80m

  return props.map(p => {
    let lat = p.latitude;
    let lng = p.longitude;
    let attempts = 0;

    while (attempts < 20) {
      const overlap = placed.some(pl =>
        Math.abs(pl.lat - lat) < MIN_GAP && Math.abs(pl.lng - lng) < MIN_GAP
      );
      if (!overlap) break;
      // Spiral offset
      const angle = (attempts * 137.5 * Math.PI) / 180;
      const r = MIN_GAP * (1 + attempts * 0.3);
      lat = p.latitude + r * Math.cos(angle);
      lng = p.longitude + r * Math.sin(angle);
      attempts++;
    }

    placed.push({ lat, lng });
    return { prop: p, lat, lng };
  });
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const quartierLayer = useRef<L.LayerGroup | null>(null);
  const propertyLayer = useRef<L.LayerGroup | null>(null);
  const focusLayer = useRef<L.LayerGroup | null>(null);
  const tentacleLayer = useRef<L.LayerGroup | null>(null);
  const overlayLayer = useRef<L.LayerGroup | null>(null);
  const zoomHandlerRef = useRef<(() => void) | null>(null);

  const [radius, setRadius] = useState(500);
  const [zoom, setZoom] = useState(12);
  const [selectedQuartier, setSelectedQuartier] = useState<string | null>(null);

  // Determine current view level
  const viewLevel = focusedPropertyId ? 'focus' : selectedQuartier ? 'quartier' : 'global';

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

    const tile = L.tileLayer(TILE_DEFAULT, {
      attribution: '© <a href="https://openstreetmap.org">OSM</a> · © <a href="https://carto.com">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);
    tileLayerRef.current = tile;

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
      tileLayerRef.current = null;
      quartierLayer.current = null;
      propertyLayer.current = null;
      focusLayer.current = null;
      tentacleLayer.current = null;
      overlayLayer.current = null;
    };
  }, []);

  // ── Switch tile layer based on view level ─────────────────────────────────
  useEffect(() => {
    if (!tileLayerRef.current || !mapInst.current) return;
    const newUrl = viewLevel === 'focus' ? TILE_FOCUS : TILE_DEFAULT;
    tileLayerRef.current.setUrl(newUrl);
  }, [viewLevel]);

  // ── Build quartier → properties map ────────────────────────────────────────
  const byQuartier = new Map<string, Property[]>();
  properties.forEach(p => {
    const arr = byQuartier.get(p.quartier) || [];
    arr.push(p);
    byQuartier.set(p.quartier, arr);
  });

  // ── LEVEL 1: Global view — quartier pins ──────────────────────────────────
  const renderGlobal = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    const z = mapInst.current.getZoom();
    const byQ = new Map<string, Property[]>();
    properties.forEach(p => {
      const arr = byQ.get(p.quartier) || [];
      arr.push(p);
      byQ.set(p.quartier, arr);
    });

    quartiers.forEach(q => {
      const qProps = byQ.get(q.name) || [];
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
      m.on('click', () => {
        setSelectedQuartier(q.name);
      });
      quartierLayer.current!.addLayer(m);
    });
  }, [properties, quartiers]);

  // ── LEVEL 2: Quartier view — only that quartier's properties ──────────────
  const renderQuartier = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    const qProps = properties.filter(p => p.quartier === selectedQuartier);
    if (qProps.length === 0) return;

    // Compute bounding box and fit
    const lats = qProps.map(p => p.latitude);
    const lngs = qProps.map(p => p.longitude);
    const bounds = L.latLngBounds(
      L.latLng(Math.min(...lats) - 0.003, Math.min(...lngs) - 0.005),
      L.latLng(Math.max(...lats) + 0.003, Math.max(...lngs) + 0.005)
    );
    mapInst.current.flyToBounds(bounds, { duration: 0.8, padding: [40, 40] });

    // Smart offset to avoid overlap
    const positioned = offsetProperties(qProps);

    positioned.forEach(({ prop, lat, lng }) => {
      const icon = L.divIcon({
        html: propertyPinHTML(prop, false),
        className: '',
        iconSize: [140, 52],
        iconAnchor: [70, 26],
      });
      const m = L.marker([lat, lng], { icon });
      m.on('click', () => {
        if (onPropertyClick) onPropertyClick(prop.id);
      });
      propertyLayer.current!.addLayer(m);
    });
  }, [properties, selectedQuartier, onPropertyClick]);

  // ── LEVEL 3: Focus mode — single property, desaturated, POI tentacles ─────
  const renderFocus = useCallback(() => {
    if (!focusLayer.current || !tentacleLayer.current || !overlayLayer.current || !mapInst.current) return;
    focusLayer.current.clearLayers();
    tentacleLayer.current.clearLayers();
    overlayLayer.current.clearLayers();
    quartierLayer.current?.clearLayers();
    propertyLayer.current?.clearLayers();

    const prop = properties.find(p => p.id === focusedPropertyId);
    if (!prop) return;

    const map = mapInst.current;
    // Offset center to leave room for floating panel (shift right slightly)
    map.flyTo([prop.latitude, prop.longitude], 16, { duration: 0.8 });

    // Subtle desaturation overlay (very light, preserving readability)
    const bigBounds: L.LatLngTuple[] = [
      [11.0, -3.5], [11.0, 0.5], [13.8, 0.5], [13.8, -3.5],
    ];
    L.polygon(bigBounds, {
      color: 'transparent',
      fillColor: '#0F1729',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(overlayLayer.current);

    // Focused property pin with pulsing ring
    const focusIcon = L.divIcon({
      html: propertyPinHTML(prop, true),
      className: '',
      iconSize: [150, 60],
      iconAnchor: [75, 30],
    });
    L.marker([prop.latitude, prop.longitude], { icon: focusIcon, zIndexOffset: 1000 })
      .addTo(focusLayer.current);

    // Radius circles — harmonious, proportionate
    const radiusConfig = [
      { r: 300, opacity: 0.06, dash: '6 4', weight: 1.5, color: 'hsl(220,50%,55%)' },
      { r: 500, opacity: 0.04, dash: '8 5', weight: 1.2, color: 'hsl(220,40%,60%)' },
      { r: 1000, opacity: 0.025, dash: '10 6', weight: 1, color: 'hsl(220,30%,65%)' },
    ];
    radiusConfig.forEach(({ r, opacity, dash, weight, color }) => {
      if (r > radius) return;
      L.circle([prop.latitude, prop.longitude], {
        radius: r,
        color,
        fillColor: 'hsl(220,50%,60%)',
        fillOpacity: opacity,
        weight,
        dashArray: dash,
        interactive: false,
      }).addTo(focusLayer.current!);

      // Radius label
      const labelAngle = -45 * (Math.PI / 180);
      const labelLat = prop.latitude + (r / 111320) * Math.cos(labelAngle);
      const labelLng = prop.longitude + (r / (111320 * Math.cos(prop.latitude * Math.PI / 180))) * Math.sin(labelAngle);
      L.marker([labelLat, labelLng], {
        icon: L.divIcon({
          html: `<div style="font-size:9px;color:hsl(220,40%,55%);font-weight:600;font-family:system-ui;background:rgba(255,255,255,0.85);padding:1px 5px;border-radius:8px;white-space:nowrap;">${fmtDist(r)}</div>`,
          className: '',
          iconAnchor: [16, 8],
        }),
        interactive: false,
      }).addTo(focusLayer.current!);
    });

    // POI tentacles — grouped by type, harmonious colors
    const groupedByType = new Map<string, POI[]>();
    pois.forEach(poi => {
      const d = distanceM(prop.latitude, prop.longitude, poi.latitude, poi.longitude);
      if (d > radius) return;
      const arr = groupedByType.get(poi.type) || [];
      arr.push(poi);
      groupedByType.set(poi.type, arr);
    });

    groupedByType.forEach((groupPois, type) => {
      const info = POI_ICONS[type] || { emoji: '📍', color: '#78909C', label: type };

      const withDist = groupPois.map(poi => ({
        ...poi,
        distance: distanceM(prop.latitude, prop.longitude, poi.latitude, poi.longitude),
      })).sort((a, b) => a.distance - b.distance);

      const closest = withDist[0];
      const count = withDist.length;

      // Tentacle line
      L.polyline(
        [[prop.latitude, prop.longitude], [closest.latitude, closest.longitude]],
        { color: info.color, weight: 1.2, opacity: 0.4, dashArray: '5 4', interactive: false }
      ).addTo(tentacleLayer.current!);

      // Midpoint label
      const midLat = (prop.latitude + closest.latitude) / 2;
      const midLng = (prop.longitude + closest.longitude) / 2;
      const labelText = count > 1
        ? `${info.label} (${count}) · ${fmtDist(closest.distance)}`
        : `${info.label} · ${fmtDist(closest.distance)}`;

      L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `<div style="
            background:rgba(255,255,255,0.92);border:1px solid ${info.color}30;border-radius:20px;
            padding:2px 8px;font-family:system-ui;font-size:9px;color:${info.color};font-weight:600;
            white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.06);pointer-events:none;
          ">${labelText}</div>`,
          className: '',
          iconAnchor: [45, 8],
        }),
        interactive: false,
      }).addTo(tentacleLayer.current!);

      // POI marker — muted, harmonious
      L.marker([closest.latitude, closest.longitude], {
        icon: L.divIcon({
          html: `<div style="
            background:rgba(255,255,255,0.92);border:1.5px solid ${info.color}80;border-radius:50%;
            width:26px;height:26px;display:flex;align-items:center;justify-content:center;
            font-size:12px;box-shadow:0 1px 6px ${info.color}18;
          ">${info.emoji}</div>`,
          className: '',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        zIndexOffset: 500,
      })
        .bindTooltip(
          `<strong style="color:${info.color}">${info.label}</strong>${count > 1 ? ` <span style="opacity:0.6">(${count})</span>` : ''}<br/><span style="font-size:11px;color:#666">${closest.name} · ${fmtDist(closest.distance)}</span>`,
          { direction: 'top' }
        )
        .addTo(tentacleLayer.current!);
    });
  }, [focusedPropertyId, properties, pois, radius]);

  // ── Master render dispatcher ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;

    // Clear all layers first
    focusLayer.current?.clearLayers();
    tentacleLayer.current?.clearLayers();
    overlayLayer.current?.clearLayers();
    quartierLayer.current?.clearLayers();
    propertyLayer.current?.clearLayers();

    if (viewLevel === 'focus') {
      renderFocus();
    } else if (viewLevel === 'quartier') {
      renderQuartier();
    } else {
      renderGlobal();
      // Re-render on zoom for global view
    }
  }, [viewLevel, renderGlobal, renderQuartier, renderFocus]);

  // Re-render global on zoom changes
  useEffect(() => {
    if (!mapInst.current || viewLevel !== 'global') return;
    const map = mapInst.current;

    if (zoomHandlerRef.current) map.off('zoomend', zoomHandlerRef.current);
    const handler = () => renderGlobal();
    zoomHandlerRef.current = handler;
    map.on('zoomend', handler);

    return () => { map.off('zoomend', handler); };
  }, [renderGlobal, viewLevel]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goBackToGlobal = () => {
    setSelectedQuartier(null);
    if (onFocusClear) onFocusClear();
    mapInst.current?.flyTo(OUAGA_CENTER, 12, { duration: 0.7 });
  };

  const goBackToQuartier = () => {
    if (onFocusClear) onFocusClear();
    // Stay in quartier view, re-render will happen via effect
  };

  const focusedProp = focusedPropertyId ? properties.find(p => p.id === focusedPropertyId) : null;

  const renderStars = (rating: number | undefined | null) => {
    if (!rating) return <span className="text-muted-foreground text-xs">N/A</span>;
    return (
      <span className="text-xs">
        {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
        <span className="text-muted-foreground ml-1">{rating}/5</span>
      </span>
    );
  };

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-border shadow-card">
      {/* Map fills full width always */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* ── Breadcrumb Navigation ─────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[600] flex items-center gap-1.5">
        {/* Global button always visible */}
        <button
          onClick={goBackToGlobal}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors backdrop-blur-sm border shadow-sm ${
            viewLevel === 'global'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card/90 text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          🏘️ Ouagadougou
        </button>

        {(viewLevel === 'quartier' || viewLevel === 'focus') && selectedQuartier && (
          <>
            <span className="text-muted-foreground text-xs">›</span>
            <button
              onClick={goBackToQuartier}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors backdrop-blur-sm border shadow-sm ${
                viewLevel === 'quartier'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/90 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              📍 {selectedQuartier}
            </button>
          </>
        )}

        {viewLevel === 'focus' && focusedProp && (
          <>
            <span className="text-muted-foreground text-xs">›</span>
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-primary text-primary-foreground border border-primary shadow-sm truncate max-w-[140px]">
              🏠 {focusedProp.title}
            </span>
          </>
        )}
      </div>

      {/* ── Radius controls (focus mode) ────────────────────────────── */}
      {viewLevel === 'focus' && (
        <div className="absolute top-3 right-3 z-[600]">
          <div className="bg-card/92 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-card flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Rayon</span>
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
        </div>
      )}

      {/* ── Floating Detail Panel (focus mode) — discrete bottom-left ── */}
      {viewLevel === 'focus' && focusedProp && (
        <div className="absolute bottom-4 left-4 z-[600] w-[320px] max-h-[380px] overflow-y-auto bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg">
          {/* Compact image */}
          {focusedProp.images && focusedProp.images.length > 0 ? (
            <div className="relative h-28 overflow-hidden rounded-t-2xl">
              <img src={focusedProp.images[0]} alt={focusedProp.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
              {focusedProp.images.length > 1 && (
                <span className="absolute bottom-1.5 right-2 bg-card/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
                  +{focusedProp.images.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="h-16 bg-muted rounded-t-2xl flex items-center justify-center text-2xl">🏠</div>
          )}

          <div className="p-3 space-y-2.5">
            {/* Title & Price */}
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight truncate">{focusedProp.title}</h3>
              <p className="text-base font-extrabold text-primary mt-0.5">
                {fmt(focusedProp.price)} <span className="text-[10px] font-medium text-muted-foreground">FCFA/mois</span>
              </p>
            </div>

            {/* Status & Type */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                focusedProp.available ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${focusedProp.available ? 'bg-accent' : 'bg-muted-foreground'}`} />
                {focusedProp.available ? 'Disponible' : 'Loué'}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">{focusedProp.type}</span>
              {focusedProp.address && (
                <span className="text-[10px] text-muted-foreground truncate">· {focusedProp.address}</span>
              )}
            </div>

            {/* Key specs — compact grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {focusedProp.bedrooms != null && (
                <div className="bg-muted/40 rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-foreground">{focusedProp.bedrooms}</div>
                  <div className="text-[9px] text-muted-foreground">Ch.</div>
                </div>
              )}
              {focusedProp.bathrooms != null && (
                <div className="bg-muted/40 rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-foreground">{focusedProp.bathrooms}</div>
                  <div className="text-[9px] text-muted-foreground">SdB</div>
                </div>
              )}
              {focusedProp.surface_area != null && (
                <div className="bg-muted/40 rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-foreground">{focusedProp.surface_area}</div>
                  <div className="text-[9px] text-muted-foreground">m²</div>
                </div>
              )}
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-muted-foreground">Confort {renderStars(focusedProp.comfort_rating)}</span>
              <span className="text-muted-foreground">Sécurité {renderStars(focusedProp.security_rating)}</span>
            </div>

            {/* Description — truncated */}
            {focusedProp.description && (
              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{focusedProp.description}</p>
            )}

            {/* Close */}
            <button
              onClick={goBackToQuartier}
              className="w-full py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-semibold text-muted-foreground transition-colors"
            >
              ✕ Fermer le focus
            </button>
          </div>
        </div>
      )}

      {/* ── Zoom badge ──────────────────────────────────────────────── */}
      <div className="absolute bottom-12 right-3 z-[500] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-[10px] font-mono text-muted-foreground shadow-card">
        zoom {zoom}
      </div>
    </div>
  );
};

export default InteractiveMap;
