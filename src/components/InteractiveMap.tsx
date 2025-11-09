import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';

interface Property {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  type: string;
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

const InteractiveMap = ({ properties, pois, quartiers = [], onPropertyClick }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Ouagadougou
    const map = L.map(mapRef.current).setView([12.3714, -1.5197], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and circles
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Add quartier polygons (represented as circles for visualization)
    quartiers.forEach((quartier) => {
      const circle = L.circle([quartier.latitude, quartier.longitude], {
        color: 'hsl(20 85% 45%)',
        fillColor: 'hsl(20 85% 45%)',
        fillOpacity: 0.1,
        radius: 2000, // 2km radius
        weight: 2,
      }).addTo(map);

      circle.bindPopup(`
        <div style="min-width: 150px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold;">${quartier.name}</h4>
          <p style="margin: 0; color: #666; font-size: 12px;">Quartier de Ouagadougou</p>
        </div>
      `);
    });

    // Add property markers
    properties.forEach((property) => {
      const markerColor = property.type === 'maison' ? '#D35400' : 
                         property.type === 'bureau' ? '#F39C12' : '#27AE60';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${markerColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🏠</div>`,
        iconSize: [32, 32],
      });

      const marker = L.marker([property.latitude, property.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${property.title}</h3>
            <p style="margin: 0 0 4px 0; color: #666;">${property.type}</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${markerColor};">
              ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(property.price)}
            </p>
          </div>
        `);

      marker.on('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property.id);
        }
      });
    });

    // Add POI markers
    pois.forEach((poi) => {
      const poiIcons: Record<string, string> = {
        ecole: '🏫',
        marche: '🛒',
        hopital: '🏥',
        maquis: '🍽️',
        banque: '🏦',
        transport: '🚌',
      };

      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: `<div style="background-color: white; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #27AE60; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px;">${poiIcons[poi.type] || '📍'}</div>`,
        iconSize: [28, 28],
      });

      L.marker([poi.latitude, poi.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4 style="margin: 0 0 4px 0;">${poi.name}</h4>
            <p style="margin: 0; color: #666; text-transform: capitalize;">${poi.type}</p>
          </div>
        `);
    });
  }, [properties, pois, quartiers, onPropertyClick]);

  return (
    <Card className="overflow-hidden shadow-soft">
      <div ref={mapRef} className="w-full h-[500px]" />
    </Card>
  );
};

export default InteractiveMap;
