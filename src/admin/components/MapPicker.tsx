import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useGeoCity } from '@/hooks/useGeoCity';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  /** Use satellite imagery instead of street map. Default true. */
  satellite?: boolean;
  /** Lock the view: restrict pan/zoom to a small area around the marker. Default true when lat/lng provided. */
  locked?: boolean;
  /** Radius (km) for locked bounds. Default 0.8 km. */
  lockRadiusKm?: number;
}

const PIN = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function makeBounds(lat: number, lng: number, radiusKm: number): L.LatLngBoundsExpression {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]];
}

export default function MapPicker({ lat, lng, onChange, height = 280, satellite = true, locked = true, lockRadiusKm = 0.8 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  const { activeCity } = useGeoCity();
  const fallbackCenter: [number, number] = activeCity?.center ?? [12.3714, -1.5197];
  const initZoom = activeCity?.zoom ?? 13;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const startLat = lat || fallbackCenter[0];
    const startLng = lng || fallbackCenter[1];
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: !locked,
    }).setView([startLat, startLng], locked ? 17 : initZoom);

    const tileUrl = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attrib = satellite
      ? 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
      : '© OpenStreetMap';
    tileRef.current = L.tileLayer(tileUrl, { maxZoom: 19, attribution: attrib }).addTo(map);

    const marker = L.marker([startLat, startLng], { draggable: true, icon: PIN }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onChange(+p.lat.toFixed(6), +p.lng.toFixed(6));
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6));
    });

    if (locked && lat && lng) {
      const b = makeBounds(lat, lng, lockRadiusKm);
      map.setMaxBounds(b);
      map.setMinZoom(16);
      map.setMaxZoom(19);
    }

    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + bounds when lat/lng change externally (quartier selection)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    if (!lat || !lng) return;
    markerRef.current.setLatLng([lat, lng]);
    if (locked) {
      const b = makeBounds(lat, lng, lockRadiusKm);
      mapRef.current.setMaxBounds(b);
      mapRef.current.setView([lat, lng], 17, { animate: true });
    } else {
      mapRef.current.panTo([lat, lng]);
    }
  }, [lat, lng, locked, lockRadiusKm]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} style={{ height, borderRadius: 8, overflow: 'hidden' }} className="border border-border" />
      <p className="text-[11px] text-muted-foreground">Clique sur la carte ou déplace le marqueur pour ajuster la position exacte du bien.</p>
    </div>
  );
}
