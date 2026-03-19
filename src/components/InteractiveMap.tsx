import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { POI_CATALOG, isTypeFurnished, pricePerNight, getTypeEmoji, mockQuartiers } from '@/lib/mockData';

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
  status?: string;
  furnished?: boolean;
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
  bounds?: [[number, number], [number, number]];
}

interface ActiveFilters {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  hasVirtualTour: boolean;
  onlyAvailable?: boolean;
  surfaceRange?: string;
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
  panelOpen?: boolean;
  onQuartierChange?: (quartier: string | null) => void;
  resetTrigger?: number;
  favoriteIds?: Set<string>;
  sheetHeight?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OUAGA_CENTER: [number, number] = [12.3714, -1.5197];
const OUAGA_BOUNDS = L.latLngBounds(L.latLng(12.10, -1.85), L.latLng(12.60, -1.25));

const RADIUS_OPTIONS = [
  { label: '300 m', value: 300 },
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
];

const TILE_DEFAULT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_FOCUS = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

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

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  maison_villa_meublee: { bg: '#4C3A6A', border: '#7C6A9A', text: '#FFFFFF', emoji: '🛋️' },
  maison_villa_simple:  { bg: '#1B3A5C', border: '#3B6A9C', text: '#FFFFFF', emoji: '🔑' },
  appartement_meuble:   { bg: '#2A5D7C', border: '#4A8DAC', text: '#FFFFFF', emoji: '🛋️' },
  appartement_simple:   { bg: '#1B3A5C', border: '#4A7AAC', text: '#FFFFFF', emoji: '🔑' },
  studio_meuble:        { bg: '#5A4570', border: '#8A75A0', text: '#FFFFFF', emoji: '🛋️' },
  bureau:               { bg: '#1B3A5C', border: '#4A7AAC', text: '#FFFFFF', emoji: '🏢' },
  local_commercial:     { bg: '#6A4520', border: '#9A7550', text: '#FFFFFF', emoji: '🏪' },
};

const getTypeStyle = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] || { bg: '#475569', border: '#94A3B8', text: '#FFFFFF', emoji: getTypeEmoji(type) };

// ─── Pin HTML helpers ────────────────────────────────────────────────────────
const quartierClusterHTML = (name: string, count: number) => `
  <div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;">
    <div style="
      width:56px;height:56px;display:flex;align-items:center;justify-content:center;
      background:#FFFFFF;border:2.5px solid #1a3560;border-radius:50%;
      box-shadow:0 2px 12px rgba(26,53,96,0.18);transition:transform 0.15s;
    ">
      <span style="font-size:18px;font-weight:800;color:#1a3560;line-height:1;">${count}</span>
    </div>
    <span style="font-size:10px;font-weight:600;color:#1a3560;line-height:1.2;text-align:center;max-width:85px;word-wrap:break-word;">${name}</span>
  </div>
`;

const propertyPinHTML = (p: Property, focused: boolean) => {
  const ts = getTypeStyle(p.type);
  if (focused) {
    return `
      <div style="
        width:32px;height:32px;display:flex;align-items:center;justify-content:center;
        background:${ts.bg};border:3px solid ${ts.border};border-radius:50%;
        box-shadow:0 0 0 6px ${ts.border}30,0 0 0 12px ${ts.border}12,0 4px 16px rgba(0,0,0,0.25);
        animation:pulse 2s infinite;
      ">
        <span style="font-size:14px;">${ts.emoji}</span>
      </div>
    `;
  }
  const isFurnished = isTypeFurnished(p.type) || p.furnished;
  const effectivePrice = isFurnished ? pricePerNight(p.price) : p.price;
  const priceText = effectivePrice >= 1000000 ? `${(effectivePrice/1000000).toFixed(1)}M` : `${Math.round(effectivePrice/1000)}k`;
  const suffix = isFurnished ? '/n' : '';
  return `
    <div style="
      display:flex;align-items:center;gap:3px;
      background:${ts.bg};border:1.5px solid ${ts.border};border-radius:16px;
      padding:4px 8px 4px 6px;font-family:system-ui,sans-serif;white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;transition:transform 0.15s;
    ">
      <span style="font-size:11px;">${ts.emoji}</span>
      <span style="font-size:10px;font-weight:700;color:${ts.text};">${priceText}${suffix}</span>
    </div>
  `;
};

const offsetProperties = (props: Property[]): { prop: Property; lat: number; lng: number }[] => {
  const placed: { lat: number; lng: number }[] = [];
  const MIN_GAP = 0.0008;
  return props.map(p => {
    let lat = p.latitude;
    let lng = p.longitude;
    let attempts = 0;
    while (attempts < 20) {
      const overlap = placed.some(pl => Math.abs(pl.lat - lat) < MIN_GAP && Math.abs(pl.lng - lng) < MIN_GAP);
      if (!overlap) break;
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
  properties, pois, quartiers = [], onPropertyClick, focusedPropertyId,
  onFocusClear, activeFilters, externalQuartierSelect, onExternalQuartierHandled,
  panelOpen = false, onQuartierChange, resetTrigger, favoriteIds, sheetHeight,
}: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const quartierLayer = useRef<L.LayerGroup | null>(null);
  const propertyLayer = useRef<L.LayerGroup | null>(null);
  const focusLayer = useRef<L.LayerGroup | null>(null);
  const tentacleLayer = useRef<L.LayerGroup | null>(null);
  const favoriteLayer = useRef<L.LayerGroup | null>(null);
  const zoomHandlerRef = useRef<(() => void) | null>(null);
  const viewLevelRef = useRef<string>('global');

  const [activeRadius, setActiveRadius] = useState<number | null>(null);
  const [zoom, setZoom] = useState(12);
  const [selectedQuartier, setSelectedQuartier] = useState<string | null>(null);


  const viewLevel = focusedPropertyId ? 'focus' : selectedQuartier ? 'quartier' : 'global';
  viewLevelRef.current = viewLevel;

  useEffect(() => { onQuartierChange?.(selectedQuartier); }, [selectedQuartier, onQuartierChange]);

  // Reset trigger
  useEffect(() => {
    if (!resetTrigger || !mapInst.current) return;
    setSelectedQuartier(null);
    setActiveRadius(null);
    mapInst.current.setMinZoom(10);
    mapInst.current.setMaxBounds(OUAGA_BOUNDS);
    mapInst.current.flyTo(OUAGA_CENTER, 13, { duration: 0.7 });
  }, [resetTrigger]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, {
      center: OUAGA_CENTER, zoom: 13, zoomControl: false,
      maxBounds: OUAGA_BOUNDS, maxBoundsViscosity: 1.0, minZoom: 10, maxZoom: 18,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tile = L.tileLayer(TILE_DEFAULT, { attribution: '© <a href="https://openstreetmap.org">OSM</a>', maxZoom: 18 }).addTo(map);
    tileLayerRef.current = tile;

    const qLayer = L.layerGroup().addTo(map);
    const pLayer = L.layerGroup().addTo(map);
    const tLayer = L.layerGroup().addTo(map);
    const fLayer = L.layerGroup().addTo(map);
    const favLayer = L.layerGroup().addTo(map);
    quartierLayer.current = qLayer;
    propertyLayer.current = pLayer;
    tentacleLayer.current = tLayer;
    focusLayer.current = fLayer;
    favoriteLayer.current = favLayer;

    map.on('zoomend', () => setZoom(map.getZoom()));
    map.on('click', () => { if (viewLevelRef.current !== 'focus' && onFocusClear) onFocusClear(); });
    mapInst.current = map;

    const style = document.createElement('style');
    style.textContent = `@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 6px rgba(27,58,92,0.3), 0 0 0 12px rgba(27,58,92,0.1); } 50% { box-shadow: 0 0 0 10px rgba(27,58,92,0.2), 0 0 0 20px rgba(27,58,92,0.05); } }`;
    document.head.appendChild(style);
    return () => { map.remove(); mapInst.current = null; style.remove(); };
  }, []);

  // Tile switch
  useEffect(() => {
    if (!tileLayerRef.current || !mapInst.current) return;
    tileLayerRef.current.setUrl(viewLevel === 'focus' ? TILE_FOCUS : TILE_DEFAULT);
    const tilePane = mapInst.current.getPane('tilePane');
    if (tilePane) tilePane.style.filter = viewLevel === 'focus' ? 'grayscale(60%) brightness(0.88) saturate(0.4)' : 'none';
  }, [viewLevel]);

  // LEVEL 1: Global
  const renderGlobal = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    const filtered = properties;
    const byQ = new Map<string, Property[]>();
    filtered.forEach(p => { const arr = byQ.get(p.quartier) || []; arr.push(p); byQ.set(p.quartier, arr); });

    // Use mockQuartiers for bounds data
    const allQuartiers = quartiers.length > 0 ? quartiers : mockQuartiers;
    const quartiersToShow = activeFilters?.quartier && activeFilters.quartier !== 'all'
      ? allQuartiers.filter(q => q.name === activeFilters.quartier) : allQuartiers;

    quartiersToShow.forEach(q => {
      const qProps = byQ.get(q.name) || [];
      if (qProps.length === 0) return;
      const icon = L.divIcon({ html: quartierClusterHTML(q.name, qProps.length), className: '', iconSize: [80, 80], iconAnchor: [40, 40] });
      const m = L.marker([q.latitude, q.longitude], { icon, zIndexOffset: 100 });
      m.bindTooltip(`<div style="font-family:system-ui;min-width:130px;"><strong style="color:#1a3560">${q.name}</strong><br/><span style="font-size:11px;color:#555;">${qProps.length} biens disponibles</span></div>`, { direction: 'top', offset: [0, -44] });
      m.on('click', (e) => { L.DomEvent.stopPropagation(e); setSelectedQuartier(q.name); });
      quartierLayer.current!.addLayer(m);
    });
  }, [properties, quartiers, activeFilters]);

  // LEVEL 2: Quartier
  const renderQuartier = useCallback(() => {
    if (!quartierLayer.current || !propertyLayer.current || !mapInst.current) return;
    quartierLayer.current.clearLayers();
    propertyLayer.current.clearLayers();

    const allQProps = properties.filter(p => p.quartier === selectedQuartier);
    const qProps = allQProps;
    const map = mapInst.current;

    // Get quartier bounds from mockQuartiers
    const qData = mockQuartiers.find(q => q.name === selectedQuartier);
    if (qData?.bounds) {
      const qBounds = L.latLngBounds(
        L.latLng(qData.bounds[0][0], qData.bounds[0][1]),
        L.latLng(qData.bounds[1][0], qData.bounds[1][1])
      );
      map.flyToBounds(qBounds, { duration: 0.8, padding: [48, 48], maxZoom: 17 });
      setTimeout(() => {
        if (!mapInst.current) return;
        // Enlarge bounds by 15% for max bounds
        const enlarged = qBounds.pad(0.15);
        mapInst.current.setMaxBounds(enlarged);
        mapInst.current.setMinZoom(mapInst.current.getZoom() - 1);
      }, 900);
    } else {
      // Fallback
      const boundsSource = allQProps.length > 0 ? allQProps : qProps;
      if (boundsSource.length === 0) return;
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
      map.flyToBounds(qBounds, { duration: 0.8, padding: [40, 40], maxZoom: 17 });
      setTimeout(() => { if (!mapInst.current) return; mapInst.current.setMaxBounds(qBounds); mapInst.current.setMinZoom(mapInst.current.getZoom() - 1); }, 900);
    }

    if (qProps.length === 0) return;

    if (qProps.length > 12) {
      const gridSize = 0.003;
      const subClusters = new Map<string, Property[]>();
      qProps.forEach(p => {
        const key = `${Math.floor(p.latitude / gridSize)}_${Math.floor(p.longitude / gridSize)}`;
        const arr = subClusters.get(key) || [];
        arr.push(p);
        subClusters.set(key, arr);
      });

      subClusters.forEach((cluster) => {
        if (cluster.length === 1) {
          const p = cluster[0];
          const icon = L.divIcon({ html: propertyPinHTML(p, false), className: '', iconSize: [100, 28], iconAnchor: [50, 14] });
          const m = L.marker([p.latitude, p.longitude], { icon });
          m.on('click', (e) => { L.DomEvent.stopPropagation(e); if (onPropertyClick) onPropertyClick(p.id); });
          propertyLayer.current!.addLayer(m);
        } else {
          const avgLat = cluster.reduce((s, p) => s + p.latitude, 0) / cluster.length;
          const avgLng = cluster.reduce((s, p) => s + p.longitude, 0) / cluster.length;
          const icon = L.divIcon({ html: quartierClusterHTML(`${cluster.length} biens`, cluster.length), className: '', iconSize: [60, 60], iconAnchor: [30, 30] });
          const m = L.marker([avgLat, avgLng], { icon });
          m.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const cBounds = L.latLngBounds(cluster.map(p => L.latLng(p.latitude, p.longitude)));
            mapInst.current?.flyToBounds(cBounds.pad(0.3), { duration: 0.5, maxZoom: 18 });
          });
          propertyLayer.current!.addLayer(m);
        }
      });
    } else {
      const positioned = offsetProperties(qProps);
      positioned.forEach(({ prop, lat, lng }) => {
        const icon = L.divIcon({ html: propertyPinHTML(prop, false), className: '', iconSize: [100, 28], iconAnchor: [50, 14] });
        const m = L.marker([lat, lng], { icon });
        const isFurnished = isTypeFurnished(prop.type) || prop.furnished;
        const displayPrice = isFurnished ? pricePerNight(prop.price) : prop.price;
        const suffix = isFurnished ? '/nuit' : '/mois';
        m.bindTooltip(`<div style="font-family:system-ui;min-width:140px;"><strong style="color:#1a3560;font-size:12px;">${prop.title}</strong><br/><span style="font-size:11px;font-weight:700;color:#1a3560;">${new Intl.NumberFormat('fr-FR').format(displayPrice)} FCFA${suffix}</span><br/><span style="font-size:10px;color:#666;">${prop.bedrooms || '–'} ch. · ${prop.surface_area || '–'} m²</span></div>`, { direction: 'top', offset: [0, -8] });
        m.on('click', (e) => { L.DomEvent.stopPropagation(e); if (onPropertyClick) onPropertyClick(prop.id); });
        propertyLayer.current!.addLayer(m);
      });
    }
  }, [properties, selectedQuartier, onPropertyClick]);

  // LEVEL 3: Focus
  const renderFocus = useCallback(() => {
    if (!focusLayer.current || !tentacleLayer.current || !mapInst.current) return;
    focusLayer.current.clearLayers();
    tentacleLayer.current.clearLayers();
    quartierLayer.current?.clearLayers();
    propertyLayer.current?.clearLayers();

    const prop = properties.find(p => p.id === focusedPropertyId);
    if (!prop) return;

    const map = mapInst.current;
    map.flyTo([prop.latitude, prop.longitude], 15, { duration: 0.8 });
    setTimeout(() => {
      if (!mapInst.current) return;
      mapInst.current.invalidateSize({ animate: false });
      // Offset pin upward so it's visible above the sheet (40% height)
      const offsetPx = window.innerHeight * 0.20;
      mapInst.current.panBy([0, offsetPx], { animate: true, duration: 0.4 });
    }, 900);

    // Focused pin
    const focusIcon = L.divIcon({ html: propertyPinHTML(prop, true), className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
    L.marker([prop.latitude, prop.longitude], { icon: focusIcon, zIndexOffset: 1000 }).addTo(focusLayer.current);

    // Radius circles
    const radiusConfig = [
      { r: 300, fillOpacity: 0.15, dash: '', weight: 2, color: 'rgba(30,80,160,1)' },
      { r: 500, fillOpacity: 0.10, dash: '6 4', weight: 1.5, color: 'rgba(30,80,160,0.8)' },
      { r: 1000, fillOpacity: 0.07, dash: '4 4', weight: 1, color: 'rgba(30,80,160,0.6)' },
    ];
    radiusConfig.forEach(({ r, fillOpacity, dash, weight, color }) => {
      const isActive = activeRadius === r;
      const circle = L.circle([prop.latitude, prop.longitude], {
        radius: r, color, fillColor: 'rgba(30,80,160,0.1)', fillOpacity,
        weight: isActive ? weight + 2 : weight, dashArray: dash, interactive: true,
      });
      circle.on('click', (e) => { L.DomEvent.stopPropagation(e); setActiveRadius(prev => prev === r ? null : r); });
      circle.addTo(focusLayer.current!);

      const labelAngle = -45 * (Math.PI / 180);
      const labelLat = prop.latitude + (r / 111320) * Math.cos(labelAngle);
      const labelLng = prop.longitude + (r / (111320 * Math.cos(prop.latitude * Math.PI / 180))) * Math.sin(labelAngle);
      L.marker([labelLat, labelLng], {
        icon: L.divIcon({
          html: `<div style="font-size:9px;color:rgba(30,80,160,0.8);font-weight:600;font-family:system-ui;background:rgba(255,255,255,0.9);padding:1px 6px;border-radius:8px;white-space:nowrap;cursor:pointer;${isActive ? 'border:1.5px solid rgba(30,80,160,0.6);' : ''}">${fmtDist(r)}</div>`,
          className: '', iconAnchor: [16, 8],
        }),
        interactive: true,
      }).on('click', (e) => { L.DomEvent.stopPropagation(e); setActiveRadius(prev => prev === r ? null : r); }).addTo(focusLayer.current!);
    });

    // POI
    const maxDist = activeRadius || 1000;
    const allPoisInRange = pois
      .map(poi => ({ ...poi, distance: distanceM(prop.latitude, prop.longitude, poi.latitude, poi.longitude) }))
      .filter(p => p.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 25);

    const groupedByType = new Map<string, typeof allPoisInRange>();
    allPoisInRange.forEach(poi => { const arr = groupedByType.get(poi.type) || []; arr.push(poi); groupedByType.set(poi.type, arr); });

    groupedByType.forEach((groupPois, type) => {
      const info = POI_CATALOG[type] || { emoji: '📍', color: '#78909C', label: type, bg: '#ECEFF1' };
      const closest = groupPois[0];
      const count = groupPois.length;

      L.polyline([[prop.latitude, prop.longitude], [closest.latitude, closest.longitude]], { color: info.color, weight: 1.2, opacity: 0.4, dashArray: '5 4', interactive: false }).addTo(tentacleLayer.current!);

      const midLat = (prop.latitude + closest.latitude) / 2;
      const midLng = (prop.longitude + closest.longitude) / 2;
      const labelText = count > 1 ? `${info.label} (${count}) · ${fmtDist(closest.distance)}` : `${info.label} · ${fmtDist(closest.distance)}`;

      L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `<div style="background:rgba(255,255,255,0.92);border:1px solid ${info.color}30;border-radius:20px;padding:2px 8px;font-family:system-ui;font-size:9px;color:${info.color};font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.06);pointer-events:none;">${labelText}</div>`,
          className: '', iconAnchor: [45, 8],
        }),
        interactive: false,
      }).addTo(tentacleLayer.current!);
    });

    allPoisInRange.forEach(poi => {
      const info = POI_CATALOG[poi.type] || { emoji: '📍', color: '#78909C', label: poi.type, bg: '#ECEFF1' };
      let opacity = 1;
      if (poi.distance > 500) opacity = 0.5;
      else if (poi.distance > 300) opacity = 0.75;

      L.marker([poi.latitude, poi.longitude], {
        icon: L.divIcon({
          html: `<div style="background:${info.bg};border:1.5px solid ${info.color}80;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 1px 6px ${info.color}18;opacity:${opacity};">${info.emoji}</div>`,
          className: '', iconSize: [24, 24], iconAnchor: [12, 12],
        }),
        zIndexOffset: 500,
      }).bindTooltip(`<strong style="color:${info.color}">${info.label}</strong><br/><span style="font-size:11px;color:#666">${poi.name} · ${fmtDist(poi.distance)}</span>`, { direction: 'top' }).addTo(tentacleLayer.current!);
    });
  }, [focusedPropertyId, properties, pois, panelOpen, activeRadius]);

  // Invalidate on panel change
  useEffect(() => {
    if (!mapInst.current) return;
    setTimeout(() => mapInst.current?.invalidateSize({ animate: true }), 350);
  }, [panelOpen]);

  // Invalidate on sheet height change (debounced)
  useEffect(() => {
    if (!mapInst.current || sheetHeight === undefined) return;
    const timer = setTimeout(() => {
      mapInst.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [sheetHeight]);

  // External quartier
  useEffect(() => {
    if (!externalQuartierSelect || !mapInst.current) return;
    mapInst.current.setMinZoom(11);
    mapInst.current.setMaxBounds(OUAGA_BOUNDS);
    setSelectedQuartier(externalQuartierSelect);
    if (onExternalQuartierHandled) onExternalQuartierHandled();
  }, [externalQuartierSelect, onExternalQuartierHandled]);

  // Render favorite pins with hover radius
  const renderFavorites = useCallback(() => {
    if (!favoriteLayer.current || !mapInst.current || !favoriteIds || favoriteIds.size === 0) return;
    favoriteLayer.current.clearLayers();

    const favProps = properties.filter(p => favoriteIds.has(p.id));
    if (favProps.length === 0) return;

    // Only show favorite pins when in global or quartier view, not focus
    if (viewLevel === 'focus') return;

    let hoverCircles: L.Circle[] = [];
    favProps.forEach(p => {
      const icon = L.divIcon({
        html: `<div style="background:rgba(26,53,96,0.25);border:1.5px solid rgba(26,53,96,0.6);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;backdrop-filter:blur(2px);cursor:pointer;transition:all 200ms;">❤️</div>`,
        className: '', iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const marker = L.marker([p.latitude, p.longitude], { icon, zIndexOffset: 400 });
      marker.on('click', (e) => { L.DomEvent.stopPropagation(e); if (onPropertyClick) onPropertyClick(p.id); });
      marker.on('mouseover', () => {
        [300, 500, 1000].forEach(r => {
          const c = L.circle([p.latitude, p.longitude], {
            radius: r, color: 'rgba(30,80,160,0.6)', fillColor: 'rgba(30,80,160,0.08)',
            fillOpacity: 0.1, weight: 1, dashArray: '4 3', interactive: false,
          }).addTo(favoriteLayer.current!);
          hoverCircles.push(c);
        });
      });
      marker.on('mouseout', () => {
        hoverCircles.forEach(c => favoriteLayer.current?.removeLayer(c));
        hoverCircles = [];
      });
      favoriteLayer.current!.addLayer(marker);
    });
  }, [properties, favoriteIds, viewLevel, onPropertyClick]);

  // Master render
  useEffect(() => {
    if (!mapInst.current) return;
    focusLayer.current?.clearLayers();
    tentacleLayer.current?.clearLayers();
    quartierLayer.current?.clearLayers();
    propertyLayer.current?.clearLayers();
    favoriteLayer.current?.clearLayers();
    if (viewLevel === 'focus') renderFocus();
    else if (viewLevel === 'quartier') renderQuartier();
    else renderGlobal();
    renderFavorites();
  }, [viewLevel, renderGlobal, renderQuartier, renderFocus, activeFilters, renderFavorites]);

  // Re-render on zoom
  useEffect(() => {
    if (!mapInst.current || viewLevel !== 'global') return;
    const map = mapInst.current;
    if (zoomHandlerRef.current) map.off('zoomend', zoomHandlerRef.current);
    const handler = () => renderGlobal();
    zoomHandlerRef.current = handler;
    map.on('zoomend', handler);
    return () => { map.off('zoomend', handler); };
  }, [renderGlobal, viewLevel]);

  // Navigation
  const goBackToGlobal = () => {
    setSelectedQuartier(null);
    setActiveRadius(null);
    if (onFocusClear) onFocusClear();
    if (mapInst.current) {
      mapInst.current.setMinZoom(11);
      mapInst.current.setMaxBounds(OUAGA_BOUNDS);
      mapInst.current.flyTo(OUAGA_CENTER, 13, { duration: 0.7 });
    }
  };

  const goBackToQuartier = () => {
    setActiveRadius(null);
    if (onFocusClear) onFocusClear();
  };

  const handleRadiusClick = (r: number) => {
    setActiveRadius(prev => prev === r ? null : r);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] lg:h-[620px] lg:rounded-xl overflow-hidden lg:border lg:border-border lg:shadow-card">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Breadcrumb */}
      <div className="absolute top-3 left-3 z-[600] flex items-center gap-1.5">
        {viewLevel !== 'global' && (
          <button onClick={goBackToGlobal} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors backdrop-blur-sm border shadow-sm bg-card/90 text-foreground border-border hover:bg-muted active:scale-95">
            ← Ouagadougou
          </button>
        )}
        {viewLevel === 'focus' && selectedQuartier && (
          <button onClick={goBackToQuartier} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors backdrop-blur-sm border shadow-sm bg-card/90 text-foreground border-border hover:bg-muted active:scale-95">
            ← {selectedQuartier}
          </button>
        )}
      </div>

      {/* Radius controls */}
      {viewLevel === 'focus' && (
        <div className="absolute top-3 right-3 z-[600]">
          <div className="bg-card/92 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-card flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Rayon</span>
            {RADIUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => handleRadiusClick(opt.value)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors active:scale-95 ${
                  activeRadius === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Quartier bar */}
      {viewLevel === 'quartier' && selectedQuartier && (
        <div className="absolute bottom-4 left-4 right-4 z-[600]">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 shadow-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📍</span>
              <span className="text-sm font-semibold text-foreground">{selectedQuartier}</span>
              <span className="text-xs text-muted-foreground">— {properties.filter(p => p.quartier === selectedQuartier).length} biens</span>
            </div>
            <button onClick={goBackToGlobal} className="text-xs text-primary font-semibold hover:underline">← Retour</button>
          </div>
        </div>
      )}

      {/* Instruction */}
      {viewLevel === 'global' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
          <span className="text-xs text-muted-foreground bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 shadow-sm">
            Touchez un quartier pour entrer
          </span>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
