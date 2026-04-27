import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

const PIN = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export default function MapPicker({ lat, lng, onChange, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([lat || 12.3714, lng || -1.5197], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(map);
    const marker = L.marker([lat || 12.3714, lng || -1.5197], { draggable: true, icon: PIN }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onChange(+p.lat.toFixed(6), +p.lng.toFixed(6));
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6));
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} style={{ height, borderRadius: 8, overflow: 'hidden' }} className="border border-border" />
      <p className="text-[11px] text-muted-foreground">Clique sur la carte ou déplace le marqueur pour définir la position.</p>
    </div>
  );
}
