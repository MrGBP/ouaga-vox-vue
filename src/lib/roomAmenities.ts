// Chambre meublée : commodités propres à la chambre vs espaces partagés de la maison.
// Stockées dans properties.features : __room_private (string[]), __room_shared (string[]), __room_bathroom.
export interface AmenityDef { key: string; label: string; emoji: string }

export const ROOM_PRIVATE: AmenityDef[] = [
  { key: 'clim', label: 'Climatisation', emoji: '❄️' },
  { key: 'ventilateur', label: 'Ventilateur', emoji: '🌀' },
  { key: 'tv', label: 'Télévision', emoji: '📺' },
  { key: 'serrure', label: 'Serrure individuelle', emoji: '🔑' },
  { key: 'bureau', label: 'Espace de travail', emoji: '💼' },
  { key: 'armoire', label: 'Armoire / placard', emoji: '🚪' },
  { key: 'frigo', label: 'Mini-frigo', emoji: '🧊' },
  { key: 'balcon', label: 'Balcon privé', emoji: '🪟' },
  { key: 'wifi', label: 'Wi-Fi dans la chambre', emoji: '📶' },
];

export const ROOM_SHARED: AmenityDef[] = [
  { key: 'cuisine', label: 'Cuisine équipée', emoji: '🍳' },
  { key: 'salon', label: 'Salon commun', emoji: '🛋️' },
  { key: 'wifi', label: 'Wi-Fi', emoji: '📶' },
  { key: 'machine_laver', label: 'Machine à laver', emoji: '🧺' },
  { key: 'groupe', label: 'Groupe électrogène', emoji: '⚡' },
  { key: 'forage', label: 'Forage / château d’eau', emoji: '💧' },
  { key: 'gardien', label: 'Gardien', emoji: '🛡️' },
  { key: 'parking', label: 'Parking', emoji: '🚗' },
  { key: 'cour', label: 'Cour / jardin', emoji: '🌳' },
];

export type RoomBathroom = 'privative' | 'partagee';

export const isRoomType = (type: string) => type === 'chambre_meublee';

export const readRoomAmenities = (features: any) => {
  const f = features && typeof features === 'object' ? features : {};
  const arr = (v: any) => (Array.isArray(v) ? v.filter((x: any) => typeof x === 'string') : []);
  return {
    privateKeys: arr(f.__room_private) as string[],
    sharedKeys: arr(f.__room_shared) as string[],
    bathroom: (f.__room_bathroom === 'privative' || f.__room_bathroom === 'partagee' ? f.__room_bathroom : null) as RoomBathroom | null,
  };
};
