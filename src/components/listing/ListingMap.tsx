import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTypeEmoji, getTypeLabel, pricePerNight, type Property } from '@/lib/mockData';
import { getRentMode } from '@/lib/typeHelpers';
import { Plus, Minus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TILE_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const TILE_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const TILE_PLAN = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const fmtShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.0', '')}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
export const coordsOf = (p: Property): [number, number] | null => {
  const lat = p.display_lat ?? p.latitude; const lng = p.display_lng ?? p.longitude;
  return typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : null;
};
export const displayPrice = (p: Property) => {
  const mode = getRentMode(p as any);
  return { value: mode === 'nuit' ? pricePerNight(p.price) : p.price, mode };
};

const pinHtml = (p: Property, active: boolean, fav: boolean, mobile: boolean) => {
  const { value, mode } = displayPrice(p);
  return `<div class="ssh-pin${active ? ' is-active' : ''}">
    ${mobile ? '' : `<span class="ssh-pin-ico">${getTypeEmoji(p.type)}</span>`}
    <span class="ssh-pin-price">${mobile ? new Intl.NumberFormat('fr-FR').format(value) : fmtShort(value)}${mobile ? ` F / ${mode}` : ''}</span>${fav ? '<span class="ssh-pin-fav">♥</span>' : ''}
  </div>`;
};

interface Props {
  properties: Property[];
  activeId: string | null;
  favorites: Set<string>;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  mobile?: boolean;
  visible?: boolean;
  onSelect?: (id: string | null) => void;
}

const ListingMap = ({ properties, activeId, favorites, onHover, onOpen, onToggleFavorite, mobile = false, visible = true, onSelect }: Props) => {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.TileLayer | null>(null);
  const labels = useRef<L.TileLayer | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const [sat, setSat] = useState(true);
  const lastKey = useRef('');

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true, zoomSnap: 0.5, wheelPxPerZoomLevel: 120 })
      .setView([12.3714, -1.5197], 12);
    base.current = L.tileLayer(TILE_SAT, { maxZoom: 19 }).addTo(m);
    labels.current = L.tileLayer(TILE_LABELS, { maxZoom: 19, opacity: 0.85 }).addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; markers.current.clear(); };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !mobile) return;
    const clear = () => onSelect?.(null);
    m.on('click', clear);
    return () => { m.off('click', clear); };
  }, [mobile, onSelect]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => map.current?.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!map.current || !base.current) return;
    base.current.setUrl(sat ? TILE_SAT : TILE_PLAN);
    if (sat && !labels.current) labels.current = L.tileLayer(TILE_LABELS, { maxZoom: 19, opacity: 0.85 }).addTo(map.current);
    if (!sat && labels.current) { labels.current.remove(); labels.current = null; }
  }, [sat]);

  // Markers
  useEffect(() => {
    const m = map.current; if (!m) return;
    markers.current.forEach(mk => mk.remove());
    markers.current.clear();
    const pts: [number, number][] = [];
    properties.forEach(p => {
      const c = coordsOf(p); if (!c) return;
      pts.push(c);
      const mk = L.marker(c, { bubblingMouseEvents: false, icon: L.divIcon({ className: 'ssh-pin-wrap', html: pinHtml(p, p.id === activeId, favorites.has(p.id), mobile), iconSize: [0, 0] }), riseOnHover: true })
        .addTo(m)
        .on('mouseover', () => { if (!mobile) onHover(p.id); })
        .on('mouseout', () => { if (!mobile) onHover(null); })
        .on('click', () => { if (mobile) onSelect?.(p.id); else onOpen(p.id); });
      markers.current.set(p.id, mk);
    });
    const key = properties.map(p => p.id).join(',');
    if (key !== lastKey.current && pts.length) {
      lastKey.current = key;
      m.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, favorites, mobile, onSelect, onOpen, onHover]);

  // Active highlight
  useEffect(() => {
    markers.current.forEach((mk, id) => {
      const p = properties.find(x => x.id === id); if (!p) return;
      mk.setIcon(L.divIcon({ className: 'ssh-pin-wrap', html: pinHtml(p, id === activeId, favorites.has(id), mobile), iconSize: [0, 0] }));
      mk.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId, properties, favorites, mobile]);

  const active = properties.find(p => p.id === activeId);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const m = map.current;
    const update = () => {
      const c = active && coordsOf(active);
      if (!m || !c) { setPos(null); return; }
      const pt = m.latLngToContainerPoint(c); setPos({ x: pt.x, y: pt.y });
    };
    update();
    m?.on('move zoom', update);
    return () => { m?.off('move zoom', update); };
  }, [active]);

  const z = (d: number) => map.current?.setZoom((map.current.getZoom() || 12) + d);

  return (
    <div className="relative w-full h-full">
      <div ref={el} className="absolute inset-0" />
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
        <Button size="icon" variant="secondary" onClick={() => z(1)} aria-label="Zoomer" className="h-9 w-9 shadow-md"><Plus className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => z(-1)} aria-label="Dézoomer" className="h-9 w-9 bg-card shadow-md"><Minus className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => setSat(s => !s)} aria-label="Changer de vue" title={sat ? 'Vue plan' : 'Vue satellite'} className="h-9 w-9 bg-card shadow-md mt-1"><Layers className="h-4 w-4" /></Button>
      </div>

      {!mobile && active && pos && (
        <div
          className="absolute z-[600] w-56 -translate-x-1/2 bg-card rounded-2xl shadow-elevation-3 overflow-hidden pointer-events-auto"
          style={{ left: pos.x, top: pos.y - 22, transform: 'translate(-50%, -100%)' }}
          onMouseEnter={() => onHover(active.id)}
          onMouseLeave={() => onHover(null)}
        >
          <div className="relative h-28 bg-muted">
            {active.images?.[0] && <img src={active.images[0]} alt={active.title} className="w-full h-full object-cover" />}
            <button
              onClick={() => onToggleFavorite(active.id)}
              aria-label="Coup de cœur"
              className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center ${favorites.has(active.id) ? 'bg-secondary text-secondary-foreground' : 'bg-card/90 text-foreground'}`}
            >♥</button>
          </div>
          <button onClick={() => onOpen(active.id)} className="block w-full text-left p-3">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{active.title}</p>
            <p className="text-xs text-muted-foreground">{active.quartier} · {getTypeLabel(active.type)}</p>
            <p className="text-sm font-bold text-secondary mt-1">
              {new Intl.NumberFormat('fr-FR').format(displayPrice(active).value)} FCFA<span className="text-xs font-normal text-muted-foreground"> / {displayPrice(active).mode}</span>
            </p>
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingMap;
