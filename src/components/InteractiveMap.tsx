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

interface ActiveFilters {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  hasVirtualTour: boolean;
  onlyAvailable: boolean;
}

interface InteractiveMapProps {
  properties: Property[];
  pois: POI[];
  quartiers?: Quartier[];
  onPropertyClick?: (propertyId: string) => void;
  focusedPropertyId?: string | null;
  onFocusClear?: () => void;
  activeFilters?: ActiveFilters;
  externalQuartierSelect?: string | null;
  onExternalQuartierHandled?: () => void;
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

// Type-based color palette for property pins
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  maison:      { bg: '#1E40AF', border: '#3B82F6', text: '#FFFFFF', emoji: '🏠' },
  villa:       { bg: '#7C3AED', border: '#A78BFA', text: '#FFFFFF', emoji: '🏡' },
  appartement: { bg: '#0891B2', border: '#22D3EE', text: '#FFFFFF', emoji: '🏬' },
  bureau:      { bg: '#B45309', border: '#F59E0B', text: '#FFFFFF', emoji: '🏢' },
  commerce:    { bg: '#059669', border: '#34D399', text: '#FFFFFF', emoji: '🏪' },
  boutique:    { bg: '#047857', border: '#10B981', text: '#FFFFFF', emoji: '🛍️' },
  terrain:     { bg: '#65A30D', border: '#A3E635', text: '#FFFFFF', emoji: '🌿' },
  entrepot:    { bg: '#6B7280', border: '#9CA3AF', text: '#FFFFFF', emoji: '🏭' },
};

const getTypeStyle = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] || { bg: '#475569', border: '#94A3B8', text: '#FFFFFF', emoji: '📍' };

// Property pin HTML — compact dot style for quartier view, minimal for focus
const propertyPinHTML = (p: Property, focused: boolean) => {
  const ts = getTypeStyle(p.type);
  const unavailableOpacity = !p.available ? 'opacity:0.5;' : '';

  if (focused) {
    // Focus mode: just a clean pin marker, no text
    return `
      <div style="
        width:32px;height:32px;display:flex;align-items:center;justify-content:center;
        background:${ts.bg};border:3px solid ${ts.border};border-radius:50%;
        box-shadow:0 0 0 6px ${ts.border}30,0 0 0 12px ${ts.border}12,0 4px 16px rgba(0,0,0,0.25);
        ${unavailableOpacity}
      ">
        <span style="font-size:14px;">${ts.emoji}</span>
      </div>
    `;
  }

  // Quartier view: compact pill with color by type
  return `
    <div style="
      display:flex;align-items:center;gap:3px;
      background:${ts.bg};border:1.5px solid ${ts.border};border-radius:16px;
      padding:3px 8px 3px 5px;font-family:system-ui,sans-serif;white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;transition:transform 0.15s;
      ${unavailableOpacity}
    ">
      <span style="font-size:11px;">${ts.emoji}</span>
      <span style="font-size:10px;font-weight:700;color:${ts.text};">${fmt(p.price)}</span>
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
  activeFilters,
  externalQuartierSelect,
  onExternalQuartierHandled,
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

  // Helper: apply active filters to a property list
  const applyMapFilters = useCallback((props: Property[]) => {
    if (!activeFilters) return props;
    let result = props;
    if (activeFilters.type !== 'all') result = result.filter(p => p.type === activeFilters.type);
    result = result.filter(p => p.price >= activeFilters.minPrice && p.price <= activeFilters.maxPrice);
    if (activeFilters.minBedrooms > 0) result = result.filter(p => (p.bedrooms || 0) >= activeFilters.minBedrooms);
    if (activeFilters.hasVirtualTour) result = result.filter(p => !!p.virtual_tour_url);
    if (activeFilters.onlyAvailable) result = result.filter(p => p.available);
    return result;
  }, [activeFilters]);

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
    const filtered = applyMapFilters(properties);
    const byQ = new Map<string, Property[]>();
    filtered.forEach(p => {
      const arr = byQ.get(p.quartier) || [];
      arr.push(p);
      byQ.set(p.quartier, arr);
    });

    // If quartier filter is active, only show that quartier
    const quartiersToShow = activeFilters?.quartier && activeFilters.quartier !== 'all'
      ? quartiers.filter(q => q.name === activeFilters.quartier)
      : quartiers;

    quartiersToShow.forEach(q => {
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
  }, [properties, quartiers, applyMapFilters, activeFilters]);

  // ── LEVEL 2: Quartier view — only that quartier's properties ──────────────
  const renderQuartier = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    const allQProps = properties.filter(p => p.quartier === selectedQuartier);
    const qProps = applyMapFilters(allQProps);
    if (qProps.length === 0) return;

    const map = mapInst.current;

    // Use ALL quartier properties for bounding box (not filtered), so the view stays consistent
    const boundsSource = allQProps.length > 0 ? allQProps : qProps;
    const lats = boundsSource.map(p => p.latitude);
    const lngs = boundsSource.map(p => p.longitude);
    const latCenter = (Math.min(...lats) + Math.max(...lats)) / 2;
    const lngCenter = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latSpread = Math.max(Math.max(...lats) - Math.min(...lats), 0.008);
    const lngSpread = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.010);
    const pad = 0.4;
    const qBounds = L.latLngBounds(
      L.latLng(latCenter - latSpread * (0.5 + pad), lngCenter - lngSpread * (0.5 + pad)),
      L.latLng(latCenter + latSpread * (0.5 + pad), lngCenter + lngSpread * (0.5 + pad))
    );

    // Fly to bounds first, then lock hard
    map.flyToBounds(qBounds, { duration: 0.8, padding: [30, 30], maxZoom: 17 });

    // Apply strict lock after fly animation completes
    setTimeout(() => {
      if (!mapInst.current) return;
      mapInst.current.setMaxBounds(qBounds);
      mapInst.current.setMinZoom(mapInst.current.getZoom() - 1);
    }, 900);

    // Smart offset to avoid overlap
    const positioned = offsetProperties(qProps);

    positioned.forEach(({ prop, lat, lng }) => {
      const icon = L.divIcon({
        html: propertyPinHTML(prop, false),
        className: '',
        iconSize: [100, 28],
        iconAnchor: [50, 14],
      });
      const m = L.marker([lat, lng], { icon });
      m.bindTooltip(
        `<div style="font-family:system-ui,sans-serif;min-width:140px;">
          <strong style="color:hsl(220,70%,32%);font-size:12px;">${prop.title}</strong><br/>
          <span style="font-size:11px;font-weight:700;color:hsl(220,70%,32%);">${fmt(prop.price)} FCFA/mois</span><br/>
          <span style="font-size:10px;color:#666;">${prop.bedrooms || '–'} ch. · ${prop.surface_area || '–'} m² · ${prop.available ? '✅ Dispo' : '🔒 Loué'}</span>
        </div>`,
        { direction: 'top', offset: [0, -8] }
      );
      m.on('click', () => {
        if (onPropertyClick) onPropertyClick(prop.id);
      });
      propertyLayer.current!.addLayer(m);
    });
  }, [properties, selectedQuartier, onPropertyClick, applyMapFilters]);

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

    // Focused property pin — clean circular marker, no text
    const focusIcon = L.divIcon({
      html: propertyPinHTML(prop, true),
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
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

  // ── External quartier selection (from QuartiersSection) ───────────────────
  useEffect(() => {
    if (!externalQuartierSelect || !mapInst.current) return;
    // Unlock bounds first
    mapInst.current.setMinZoom(11);
    mapInst.current.setMaxBounds(OUAGA_BOUNDS);
    setSelectedQuartier(externalQuartierSelect);
    if (onExternalQuartierHandled) onExternalQuartierHandled();
  }, [externalQuartierSelect, onExternalQuartierHandled]);

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
    }
  }, [viewLevel, renderGlobal, renderQuartier, renderFocus, activeFilters]);

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
    if (mapInst.current) {
      // Fully unlock map bounds
      mapInst.current.setMinZoom(11);
      mapInst.current.setMaxBounds(OUAGA_BOUNDS);
      mapInst.current.flyTo(OUAGA_CENTER, 12, { duration: 0.7 });
    }
  };

  const goBackToQuartier = () => {
    if (onFocusClear) onFocusClear();
    // Unlock temporarily — renderQuartier will re-lock to the quartier
    if (mapInst.current) {
      mapInst.current.setMinZoom(11);
      mapInst.current.setMaxBounds(OUAGA_BOUNDS);
    }
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

        {viewLevel === 'focus' && (
          <>
            <span className="text-muted-foreground text-xs">›</span>
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-primary text-primary-foreground border border-primary shadow-sm">
              🔍 Focus
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

      {/* ── Type legend (quartier view) ─────────────────────────────── */}
      {viewLevel === 'quartier' && (
        <div className="absolute bottom-4 left-4 z-[600] bg-card/92 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-card">
          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Types de biens</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TYPE_COLORS).map(([type, style]) => (
              <span key={type} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>
                {style.emoji} {type}
              </span>
            ))}
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
