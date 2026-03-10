// SapSapHouse — 100 biens de démonstration, 16 quartiers, POI catalog

export interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  quartier: string;
  address: string;
  latitude: number;
  longitude: number;
  bedrooms?: number;
  bathrooms?: number;
  surface_area?: number;
  comfort_rating?: number;
  security_rating?: number;
  accessibility_rating?: number;
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
  has_video?: boolean;
  video_url?: string;
  year_built?: number;
  has_ac?: boolean;
  has_guardian?: boolean;
  has_generator?: boolean;
  has_garden?: boolean;
  has_water?: boolean;
  has_internet?: boolean;
  has_kitchen?: boolean;
  has_fridge?: boolean;
  has_stove?: boolean;
  has_tv?: boolean;
  has_terrace?: boolean;
  has_pool?: boolean;
  has_parking_int?: boolean;
  has_parking_ext?: boolean;
  has_fence?: boolean;
  has_auto_gate?: boolean;
  has_cameras?: boolean;
  has_paved_road?: boolean;
  has_pmr?: boolean;
  has_water_tower?: boolean;
  is_new_build?: boolean;
  is_renovated?: boolean;
  pets_allowed?: boolean;
  status?: 'available' | 'reserved' | 'rented';
  agent_name?: string;
  agent_phone?: string;
  agent_photo?: string;
  furnished?: boolean;
  created_at?: string;
}

export interface POI {
  id: string;
  name: string;
  type: string;
  quartier: string;
  latitude: number;
  longitude: number;
}

export interface Quartier {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  bounds?: [[number, number], [number, number]];
}

// ─── 7 TYPES OFFICIELS ──────────────────────────────────────────────────────
export const PROPERTY_TYPES = [
  { value: 'maison_villa_meublee', label: 'Maison / Villa meublée', emoji: '🛋️', furnished: true },
  { value: 'maison_villa_simple', label: 'Maison / Villa simple', emoji: '🔑', furnished: false },
  { value: 'appartement_meuble', label: 'Appartement meublé', emoji: '🛋️', furnished: true },
  { value: 'appartement_simple', label: 'Appartement simple', emoji: '🔑', furnished: false },
  { value: 'studio_meuble', label: 'Studio meublé', emoji: '🛋️', furnished: true },
  { value: 'bureau', label: 'Bureau', emoji: '🏢', furnished: false },
  { value: 'local_commercial', label: 'Local commercial', emoji: '🏪', furnished: false },
] as const;

export type PropertyType = typeof PROPERTY_TYPES[number]['value'];

export const isTypeFurnished = (type: string): boolean =>
  PROPERTY_TYPES.find(t => t.value === type)?.furnished ?? false;

export const getTypeLabel = (type: string): string =>
  PROPERTY_TYPES.find(t => t.value === type)?.label ?? type;

export const getTypeEmoji = (type: string): string =>
  PROPERTY_TYPES.find(t => t.value === type)?.emoji ?? '📍';

/** Prix par nuit = prix/mois ÷ 30, arrondi au 500 FCFA le plus proche */
export const pricePerNight = (monthlyPrice: number): number =>
  Math.round(monthlyPrice / 30 / 500) * 500;

// ─── CHARACTERISTIC CHECKS for filter logic ─────────────────────────────────
export const CHAR_CHECKS: Record<string, (p: Property) => boolean> = {
  bed_1: p => p.bedrooms === 1,
  bed_2: p => p.bedrooms === 2,
  bed_3: p => p.bedrooms === 3,
  bed_4plus: p => (p.bedrooms || 0) >= 4,
  bath_1: p => p.bathrooms === 1,
  bath_2plus: p => (p.bathrooms || 0) >= 2,
  clim: p => !!p.has_ac,
  generator: p => !!p.has_generator,
  water: p => !!p.has_water,
  water_tower: p => !!p.has_water_tower,
  wifi: p => !!p.has_internet,
  kitchen: p => !!p.has_kitchen,
  fridge: p => !!p.has_fridge,
  stove: p => !!p.has_stove,
  furnished: p => !!p.furnished,
  tv: p => !!p.has_tv,
  terrace: p => !!p.has_terrace,
  garden: p => !!p.has_garden,
  pool: p => !!p.has_pool,
  parking_int: p => !!p.has_parking_int,
  parking_ext: p => !!p.has_parking_ext,
  guardian: p => !!p.has_guardian,
  fenced: p => !!p.has_fence,
  auto_gate: p => !!p.has_auto_gate,
  cameras: p => !!p.has_cameras,
  paved_road: p => !!p.has_paved_road,
  pmr: p => !!p.has_pmr,
  is_new: p => !!p.is_new_build,
  renovated: p => !!p.is_renovated,
  pets: p => !!p.pets_allowed,
};

// ─── IDX keyword → characteristic mapping ───────────────────────────────────
export const IDX_KEYWORD_MAP: { keywords: string[]; characteristic: string; emoji: string; label: string }[] = [
  { keywords: ['climatisé', 'clim'], characteristic: 'clim', emoji: '❄️', label: 'Climatisation' },
  { keywords: ['wifi', 'internet'], characteristic: 'wifi', emoji: '📶', label: 'WiFi' },
  { keywords: ['parking', 'garage'], characteristic: 'parking_int', emoji: '🚗', label: 'Parking' },
  { keywords: ['gardien', 'sécurisé'], characteristic: 'guardian', emoji: '🛡️', label: 'Gardien' },
  { keywords: ['meublé'], characteristic: 'furnished', emoji: '🛋️', label: 'Meublé' },
  { keywords: ['piscine'], characteristic: 'pool', emoji: '🏊', label: 'Piscine' },
  { keywords: ['groupe', 'électrogène'], characteristic: 'generator', emoji: '⚡', label: 'Groupe élec.' },
  { keywords: ['clôturé', 'clôture'], characteristic: 'fenced', emoji: '🔒', label: 'Clôturé' },
  { keywords: ['neuf', 'nouveau'], characteristic: 'is_new', emoji: '✨', label: 'Neuf' },
  { keywords: ['animaux'], characteristic: 'pets', emoji: '🐾', label: 'Animaux' },
];

// ─── 16 QUARTIERS ────────────────────────────────────────────────────────────
export const mockQuartiers: Quartier[] = [
  { id: 'q1', name: 'Ouaga 2000', description: 'Quartier résidentiel haut standing, ambassades et villas de luxe', latitude: 12.298, longitude: -1.620, bounds: [[12.278, -1.645], [12.318, -1.595]], image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format' },
  { id: 'q2', name: 'Tampouy', description: 'Quartier populaire dynamique, commerces et marchés', latitude: 12.452, longitude: -1.520, bounds: [[12.435, -1.540], [12.468, -1.500]], image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format' },
  { id: 'q3', name: 'Zogona', description: 'Quartier universitaire vivant, proche du centre', latitude: 12.400, longitude: -1.515, bounds: [[12.383, -1.535], [12.418, -1.495]], image_url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format' },
  { id: 'q4', name: "Patte d'Oie", description: 'Carrefour stratégique, mélange résidentiel et commercial', latitude: 12.343, longitude: -1.590, bounds: [[12.326, -1.610], [12.360, -1.570]], image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format' },
  { id: 'q5', name: 'Zone du Bois', description: 'Quartier calme et verdoyant, prisé des expatriés', latitude: 12.378, longitude: -1.510, bounds: [[12.361, -1.530], [12.395, -1.490]], image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format' },
  { id: 'q6', name: 'Koulouba', description: 'Quartier historique sur la colline, vue panoramique', latitude: 12.360, longitude: -1.540, bounds: [[12.343, -1.560], [12.377, -1.520]], image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format' },
  { id: 'q7', name: 'Dassasgho', description: 'Quartier en pleine expansion, bon rapport qualité-prix', latitude: 12.372, longitude: -1.480, bounds: [[12.355, -1.500], [12.390, -1.460]], image_url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format' },
  { id: 'q8', name: 'Pissy', description: 'Quartier résidentiel en développement', latitude: 12.310, longitude: -1.660, bounds: [[12.293, -1.680], [12.327, -1.640]], image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format' },
  { id: 'q9', name: 'Gounghin', description: 'Quartier historique, cœur de la ville', latitude: 12.395, longitude: -1.640, bounds: [[12.378, -1.660], [12.412, -1.620]], image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format' },
  { id: 'q10', name: 'Tanghin', description: 'Quartier populaire, proche du barrage', latitude: 12.452, longitude: -1.438, bounds: [[12.435, -1.458], [12.468, -1.418]], image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format' },
  { id: 'q11', name: 'Wemtenga', description: 'Quartier central animé, proche du marché', latitude: 12.390, longitude: -1.428, bounds: [[12.373, -1.448], [12.407, -1.408]], image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&auto=format' },
  { id: 'q12', name: 'Samandin', description: 'Quartier résidentiel, calme et familial', latitude: 12.348, longitude: -1.595, bounds: [[12.331, -1.615], [12.365, -1.575]], image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format' },
  { id: 'q13', name: 'Kalgondin', description: 'Quartier en croissance rapide', latitude: 12.330, longitude: -1.448, bounds: [[12.313, -1.468], [12.347, -1.428]], image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format' },
  { id: 'q14', name: 'Somgandé', description: 'Quartier résidentiel au nord, calme et familial', latitude: 12.462, longitude: -1.665, bounds: [[12.445, -1.685], [12.479, -1.645]], image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format' },
  { id: 'q15', name: 'Bogodogo', description: 'Quartier périphérique, en plein essor', latitude: 12.295, longitude: -1.470, bounds: [[12.278, -1.490], [12.312, -1.450]], image_url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format' },
  { id: 'q16', name: 'Nongsin', description: 'Quartier résidentiel calme, nord-ouest', latitude: 12.460, longitude: -1.582, bounds: [[12.443, -1.602], [12.477, -1.562]], image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format' },
];

// ─── Agents ──────────────────────────────────────────────────────────────────
const AGENTS = [
  { name: 'Ibrahim Ouédraogo', phone: '+226 70 12 34 56', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format' },
  { name: 'Aminata Traoré', phone: '+226 76 98 76 54', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format' },
  { name: 'Moussa Kaboré', phone: '+226 71 55 44 33', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format' },
  { name: 'Fatou Sanou', phone: '+226 78 22 11 00', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format' },
];

const IMAGES_POOL = {
  maison: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&auto=format',
  ],
  villa: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format',
  ],
  appartement: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&auto=format',
  ],
  studio: [
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&auto=format',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format',
  ],
  bureau: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&auto=format',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&auto=format',
  ],
  commerce: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format',
    'https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=600&auto=format',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format',
  ],
};

function getImages(type: string, idx: number): string[] {
  let pool: string[];
  if (type.includes('studio')) pool = IMAGES_POOL.studio;
  else if (type.includes('appartement')) pool = IMAGES_POOL.appartement;
  else if (type.includes('bureau')) pool = IMAGES_POOL.bureau;
  else if (type.includes('local_commercial')) pool = IMAGES_POOL.commerce;
  else if (type.includes('villa') || (type.includes('maison') && idx % 3 === 0)) pool = IMAGES_POOL.villa;
  else pool = IMAGES_POOL.maison;
  const start = idx % pool.length;
  const result: string[] = [];
  for (let j = 0; j < Math.min(pool.length, 4 + (idx % 2)); j++) {
    result.push(pool[(start + j) % pool.length]);
  }
  return result;
}

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const DEMO_360_URL = 'https://www.youtube.com/embed/2OzlksZBTiA';

// Random within range
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// ─── Property Generator ─────────────────────────────────────────────────────
interface GenConfig {
  type: PropertyType;
  count: number;
  priceRange: [number, number];
  bedRange: [number, number];
  bathRange: [number, number];
  surfaceRange: [number, number];
  titleParts: string[];
}

const GEN_CONFIGS: GenConfig[] = [
  { type: 'maison_villa_simple', count: 22, priceRange: [150000, 900000], bedRange: [2, 5], bathRange: [1, 3], surfaceRange: [120, 450], titleParts: ['Maison', 'Villa', 'Résidence', 'Maison Familiale', 'Villa Résidentielle'] },
  { type: 'maison_villa_meublee', count: 20, priceRange: [300000, 2000000], bedRange: [2, 5], bathRange: [1, 4], surfaceRange: [150, 500], titleParts: ['Villa Meublée', 'Maison Meublée', 'Résidence Meublée', 'Villa Standing Meublée'] },
  { type: 'appartement_meuble', count: 18, priceRange: [250000, 700000], bedRange: [1, 3], bathRange: [1, 2], surfaceRange: [45, 160], titleParts: ['Appt Meublé', 'Appartement Meublé', 'Résidence Meublée', 'Appt Standing Meublé'] },
  { type: 'appartement_simple', count: 12, priceRange: [100000, 350000], bedRange: [1, 3], bathRange: [1, 2], surfaceRange: [40, 140], titleParts: ['Appartement', 'Appt Résidentiel', 'Appartement Confort'] },
  { type: 'studio_meuble', count: 12, priceRange: [75000, 250000], bedRange: [1, 1], bathRange: [1, 1], surfaceRange: [20, 55], titleParts: ['Studio Meublé', 'Studio Standing', 'Studio Cozy', 'Studio Moderne'] },
  { type: 'bureau', count: 9, priceRange: [200000, 1200000], bedRange: [0, 0], bathRange: [1, 2], surfaceRange: [40, 300], titleParts: ['Bureau', 'Espace Bureau', 'Bureau Standing', 'Open Space'] },
  { type: 'local_commercial', count: 7, priceRange: [80000, 500000], bedRange: [0, 0], bathRange: [1, 1], surfaceRange: [30, 200], titleParts: ['Local Commercial', 'Boutique', 'Espace Commercial', 'Commerce'] },
];

const QUARTIER_ALLOC: { name: string; count: number }[] = [
  { name: 'Ouaga 2000', count: 14 },
  { name: 'Tampouy', count: 12 },
  { name: 'Zogona', count: 10 },
  { name: "Patte d'Oie", count: 9 },
  { name: 'Zone du Bois', count: 9 },
  { name: 'Koulouba', count: 8 },
  { name: 'Dassasgho', count: 7 },
  { name: 'Pissy', count: 6 },
  { name: 'Gounghin', count: 5 },
  { name: 'Tanghin', count: 4 },
  { name: 'Wemtenga', count: 4 },
  { name: 'Samandin', count: 4 },
  { name: 'Kalgondin', count: 3 },
  { name: 'Somgandé', count: 3 },
  { name: 'Bogodogo', count: 2 },
  { name: 'Nongsin', count: 1 },
];

function generateProperties(): Property[] {
  const props: Property[] = [];

  const quartierSlots: string[] = [];
  QUARTIER_ALLOC.forEach(q => { for (let i = 0; i < q.count; i++) quartierSlots.push(q.name); });

  const typeSlots: GenConfig[] = [];
  GEN_CONFIGS.forEach(cfg => { for (let i = 0; i < cfg.count; i++) typeSlots.push(cfg); });

  const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 16807 + 11) % 2147483647;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const shuffledQuartiers = seededShuffle(quartierSlots, 42);
  const shuffledTypes = seededShuffle(typeSlots, 77);

  const now = Date.now();
  const DAY = 86400000;

  for (let i = 0; i < 100; i++) {
    const quartierName = shuffledQuartiers[i];
    const cfg = shuffledTypes[i];
    const q = mockQuartiers.find(qq => qq.name === quartierName)!;
    const agent = AGENTS[i % AGENTS.length];
    const isFurnished = isTypeFurnished(cfg.type);

    const bounds = q.bounds || [[q.latitude - 0.01, q.longitude - 0.01], [q.latitude + 0.01, q.longitude + 0.01]];
    const lat = +(bounds[0][0] + Math.random() * (bounds[1][0] - bounds[0][0])).toFixed(6);
    const lng = +(bounds[0][1] + Math.random() * (bounds[1][1] - bounds[0][1])).toFixed(6);

    const price = roundTo(randInt(cfg.priceRange[0], cfg.priceRange[1]), 5000);
    const bedrooms = randInt(cfg.bedRange[0], cfg.bedRange[1]);
    const bathrooms = randInt(cfg.bathRange[0], cfg.bathRange[1]);
    const surface = randInt(cfg.surfaceRange[0], cfg.surfaceRange[1]);
    const comfort = +(rand(2.5, 5)).toFixed(1);
    const security = +(rand(2, 5)).toFixed(1);
    const accessibility = +(rand(2, 5)).toFixed(1);

    const isRecent = i < 10;
    const createdAt = isRecent
      ? new Date(now - randInt(0, 6) * DAY).toISOString()
      : new Date(now - randInt(10, 180) * DAY).toISOString();

    const titlePart = cfg.titleParts[i % cfg.titleParts.length];
    const suffix = bedrooms > 0 ? ` ${bedrooms}ch` : surface > 100 ? ` ${surface}m²` : '';

    const hasVideo = i % 4 === 0;
    const has360 = i % 3 === 0;

    props.push({
      id: `p${i + 1}`,
      title: `${titlePart}${suffix} ${quartierName}`,
      description: `${getTypeLabel(cfg.type)} situé(e) à ${quartierName}. ${isFurnished ? 'Entièrement meublé(e) avec literie, climatisation, wifi et électroménager. Check-in 14h00, check-out 11h00.' : 'Location mensuelle.'} Surface ${surface}m², ${bedrooms > 0 ? bedrooms + ' chambre(s), ' : ''}${bathrooms} salle(s) de bain. Quartier ${q.description.toLowerCase()}.`,
      type: cfg.type,
      price,
      quartier: quartierName,
      address: `Secteur ${randInt(1, 50)}, ${quartierName}`,
      latitude: lat,
      longitude: lng,
      bedrooms,
      bathrooms,
      surface_area: surface,
      comfort_rating: +comfort,
      security_rating: +security,
      accessibility_rating: +accessibility,
      images: getImages(cfg.type, i),
      available: true,
      status: 'available',
      virtual_tour_url: has360 ? DEMO_360_URL : undefined,
      has_video: hasVideo,
      video_url: hasVideo ? DEMO_VIDEO_URL : undefined,
      year_built: randInt(2010, 2025),
      has_ac: isFurnished || i % 3 === 0,
      has_guardian: i % 3 === 0,
      has_generator: i % 4 === 0,
      has_garden: bedrooms >= 3 && i % 2 === 0,
      has_water: true,
      has_internet: isFurnished || i % 2 === 0,
      has_kitchen: isFurnished || i % 3 === 0,
      has_fridge: isFurnished || i % 4 === 0,
      has_stove: isFurnished || i % 5 === 0,
      has_tv: isFurnished || i % 4 === 0,
      has_terrace: i % 3 === 0,
      has_pool: i % 10 === 0,
      has_parking_int: i % 4 === 0,
      has_parking_ext: i % 3 === 0,
      has_fence: i % 2 === 0,
      has_auto_gate: i % 6 === 0,
      has_cameras: i % 7 === 0,
      has_paved_road: i % 2 === 0,
      has_pmr: i % 8 === 0,
      has_water_tower: i % 3 === 0,
      is_new_build: i % 9 === 0,
      is_renovated: i % 5 === 0,
      pets_allowed: i % 6 === 0,
      furnished: isFurnished,
      agent_name: agent.name,
      agent_phone: agent.phone,
      agent_photo: agent.photo,
      created_at: createdAt,
    });
  }

  return props;
}

export const mockProperties: Property[] = generateProperties();

// ─── MOCK POIs ───────────────────────────────────────────────────────────────
export const mockPois: POI[] = [
  { id: 'poi1', name: 'Clinique Les Genêts', type: 'clinique', quartier: 'Ouaga 2000', latitude: 12.300, longitude: -1.618 },
  { id: 'poi2', name: 'Lycée International', type: 'lycee', quartier: 'Ouaga 2000', latitude: 12.295, longitude: -1.625 },
  { id: 'poi3', name: 'Banque BICIA-B', type: 'banque', quartier: 'Ouaga 2000', latitude: 12.302, longitude: -1.615 },
  { id: 'poi4', name: 'Restaurant Le Verdoyant', type: 'restaurant', quartier: 'Ouaga 2000', latitude: 12.296, longitude: -1.622 },
  { id: 'poi5', name: 'Station Total O2000', type: 'station_total', quartier: 'Ouaga 2000', latitude: 12.305, longitude: -1.610 },
  { id: 'poi6', name: 'Pharmacie du Progrès', type: 'pharmacie', quartier: 'Ouaga 2000', latitude: 12.293, longitude: -1.617 },
  { id: 'poi7', name: 'Grand Marché Tampouy', type: 'grand_marche', quartier: 'Tampouy', latitude: 12.450, longitude: -1.522 },
  { id: 'poi8', name: 'CSPS Tampouy', type: 'hopital', quartier: 'Tampouy', latitude: 12.454, longitude: -1.518 },
  { id: 'poi9', name: 'Lycée Tampouy', type: 'lycee', quartier: 'Tampouy', latitude: 12.456, longitude: -1.525 },
  { id: 'poi10', name: 'Gare Routière Tampouy', type: 'gare_routiere', quartier: 'Tampouy', latitude: 12.448, longitude: -1.515 },
  { id: 'poi11', name: 'Mosquée de Tampouy', type: 'mosquee_quartier', quartier: 'Tampouy', latitude: 12.453, longitude: -1.521 },
  { id: 'poi12', name: 'Université de Ouagadougou', type: 'universite', quartier: 'Zogona', latitude: 12.402, longitude: -1.514 },
  { id: 'poi13', name: 'CHU Yalgado', type: 'hopital', quartier: 'Zogona', latitude: 12.398, longitude: -1.518 },
  { id: 'poi14', name: 'Parc Bangr Wéoogo', type: 'parc', quartier: 'Zogona', latitude: 12.405, longitude: -1.510 },
  { id: 'poi15', name: 'Banque SGBF Zogona', type: 'banque', quartier: 'Zogona', latitude: 12.397, longitude: -1.512 },
  { id: 'poi16', name: "Centre Commercial Patte d'Oie", type: 'supermarche', quartier: "Patte d'Oie", latitude: 12.345, longitude: -1.588 },
  { id: 'poi17', name: "Clinique Patte d'Oie", type: 'clinique', quartier: "Patte d'Oie", latitude: 12.340, longitude: -1.592 },
  { id: 'poi18', name: 'Banque BOA', type: 'banque', quartier: "Patte d'Oie", latitude: 12.347, longitude: -1.585 },
  { id: 'poi19', name: 'École Les Lauréats', type: 'ecole_primaire', quartier: 'Zone du Bois', latitude: 12.380, longitude: -1.508 },
  { id: 'poi20', name: 'Pharmacie du Bois', type: 'pharmacie', quartier: 'Zone du Bois', latitude: 12.375, longitude: -1.512 },
  { id: 'poi21', name: 'Maquis Chez Tantie', type: 'restaurant', quartier: 'Zone du Bois', latitude: 12.382, longitude: -1.505 },
  { id: 'poi22', name: 'Centre de Santé Koulouba', type: 'hopital', quartier: 'Koulouba', latitude: 12.362, longitude: -1.538 },
  { id: 'poi23', name: 'Marché Koulouba', type: 'marche_quartier', quartier: 'Koulouba', latitude: 12.358, longitude: -1.542 },
  { id: 'poi24', name: 'Cathédrale Koulouba', type: 'cathedrale', quartier: 'Koulouba', latitude: 12.365, longitude: -1.535 },
  { id: 'poi25', name: 'Marché Dassasgho', type: 'marche_quartier', quartier: 'Dassasgho', latitude: 12.374, longitude: -1.478 },
  { id: 'poi26', name: 'École Dassasgho', type: 'ecole_primaire', quartier: 'Dassasgho', latitude: 12.370, longitude: -1.482 },
  { id: 'poi27', name: 'Marché Pissy', type: 'marche_quartier', quartier: 'Pissy', latitude: 12.312, longitude: -1.658 },
  { id: 'poi28', name: 'CSPS Pissy', type: 'hopital', quartier: 'Pissy', latitude: 12.308, longitude: -1.662 },
  { id: 'poi29', name: 'Marché Gounghin', type: 'grand_marche', quartier: 'Gounghin', latitude: 12.397, longitude: -1.638 },
  { id: 'poi30', name: 'Mosquée Gounghin', type: 'mosquee_quartier', quartier: 'Gounghin', latitude: 12.393, longitude: -1.642 },
  { id: 'poi31', name: 'Barrage Tanghin', type: 'parc', quartier: 'Tanghin', latitude: 12.455, longitude: -1.435 },
  { id: 'poi32', name: 'Marché Wemtenga', type: 'marche_quartier', quartier: 'Wemtenga', latitude: 12.392, longitude: -1.426 },
  { id: 'poi33', name: 'École Samandin', type: 'ecole_primaire', quartier: 'Samandin', latitude: 12.350, longitude: -1.593 },
  { id: 'poi34', name: 'CSPS Kalgondin', type: 'hopital', quartier: 'Kalgondin', latitude: 12.332, longitude: -1.446 },
  { id: 'poi35', name: 'Mosquée Somgandé', type: 'mosquee_quartier', quartier: 'Somgandé', latitude: 12.464, longitude: -1.663 },
  { id: 'poi36', name: 'Mairie Bogodogo', type: 'mairie', quartier: 'Bogodogo', latitude: 12.297, longitude: -1.468 },
  { id: 'poi37', name: 'École Nongsin', type: 'ecole_primaire', quartier: 'Nongsin', latitude: 12.462, longitude: -1.580 },
];

// ─── POI CATALOG ─────────────────────────────────────────────────────────────
export interface POICatalogEntry {
  emoji: string;
  bg: string;
  color: string;
  label: string;
}

export const POI_CATALOG: Record<string, POICatalogEntry> = {
  place_of_worship: { emoji: '🕌', bg: '#E8F5E9', color: '#1B5E20', label: 'Lieu de culte' },
  grande_mosquee:   { emoji: '🕌', bg: '#E8F5E9', color: '#1B5E20', label: 'Grande Mosquée' },
  mosquee_quartier: { emoji: '🕌', bg: '#F1F8E9', color: '#33691E', label: 'Mosquée' },
  cathedrale:       { emoji: '⛪', bg: '#E3F2FD', color: '#0D47A1', label: 'Cathédrale' },
  eglise:           { emoji: '✝️', bg: '#E8EAF6', color: '#283593', label: 'Église' },
  marketplace:      { emoji: '🛒', bg: '#FFF3E0', color: '#BF360C', label: 'Marché' },
  grand_marche:     { emoji: '🏪', bg: '#FFF8E1', color: '#E65100', label: 'Grand Marché' },
  marche_quartier:  { emoji: '🛒', bg: '#FFF3E0', color: '#BF360C', label: 'Marché' },
  supermarket:      { emoji: '🏬', bg: '#F3E5F5', color: '#4A148C', label: 'Supermarché' },
  supermarche:      { emoji: '🏬', bg: '#F3E5F5', color: '#4A148C', label: 'Supermarché' },
  convenience:      { emoji: '🛒', bg: '#FFF3E0', color: '#BF360C', label: 'Boutique' },
  fuel:             { emoji: '⛽', bg: '#FFEBEE', color: '#C62828', label: 'Station carburant' },
  station_total:    { emoji: '⛽', bg: '#FFEBEE', color: '#C62828', label: 'Station Total' },
  station_oilibya:  { emoji: '⛽', bg: '#E8F5E9', color: '#2E7D32', label: 'Station Oilibya' },
  school:           { emoji: '📚', bg: '#E8F5E9', color: '#004D40', label: 'École' },
  university:       { emoji: '🎓', bg: '#E1F5FE', color: '#01579B', label: 'Université' },
  college:          { emoji: '🏫', bg: '#E0F7FA', color: '#006064', label: 'Collège' },
  universite:       { emoji: '🎓', bg: '#E1F5FE', color: '#01579B', label: 'Université' },
  lycee:            { emoji: '🏫', bg: '#E0F7FA', color: '#006064', label: 'Lycée' },
  ecole_primaire:   { emoji: '📚', bg: '#E8F5E9', color: '#004D40', label: 'École' },
  hospital:         { emoji: '🏥', bg: '#FFEBEE', color: '#B71C1C', label: 'Hôpital' },
  clinic:           { emoji: '⚕️', bg: '#FCE4EC', color: '#880E4F', label: 'Clinique' },
  pharmacy:         { emoji: '💊', bg: '#E8F5E9', color: '#1B5E20', label: 'Pharmacie' },
  doctors:          { emoji: '⚕️', bg: '#FCE4EC', color: '#880E4F', label: 'Médecin' },
  hopital:          { emoji: '🏥', bg: '#FFEBEE', color: '#B71C1C', label: 'Hôpital' },
  clinique:         { emoji: '⚕️', bg: '#FCE4EC', color: '#880E4F', label: 'Clinique' },
  pharmacie:        { emoji: '💊', bg: '#E8F5E9', color: '#1B5E20', label: 'Pharmacie' },
  bus_station:      { emoji: '🚌', bg: '#EDE7F6', color: '#4527A0', label: 'Gare routière' },
  taxi:             { emoji: '🚕', bg: '#FFF8E1', color: '#F57F17', label: 'Taxi' },
  gare_routiere:    { emoji: '🚌', bg: '#EDE7F6', color: '#4527A0', label: 'Gare routière' },
  arret_sotraco:    { emoji: '🚏', bg: '#F3E5F5', color: '#6A1B9A', label: 'Arrêt SOTRACO' },
  restaurant:       { emoji: '🍽️', bg: '#FFF3E0', color: '#E64A19', label: 'Restaurant' },
  cafe:             { emoji: '☕', bg: '#EFEBE9', color: '#4E342E', label: 'Café' },
  fast_food:        { emoji: '🍔', bg: '#FFF3E0', color: '#E64A19', label: 'Fast-food' },
  bar:              { emoji: '🍺', bg: '#FFF8E1', color: '#F57F17', label: 'Bar' },
  bank:             { emoji: '🏦', bg: '#E8EAF6', color: '#1A237E', label: 'Banque' },
  banque:           { emoji: '🏦', bg: '#E8EAF6', color: '#1A237E', label: 'Banque' },
  atm:              { emoji: '🏧', bg: '#E8EAF6', color: '#283593', label: 'Distributeur' },
  police:           { emoji: '🚔', bg: '#E3F2FD', color: '#0D47A1', label: 'Police' },
  fire_station:     { emoji: '🚒', bg: '#FFEBEE', color: '#B71C1C', label: 'Pompiers' },
  park:             { emoji: '🌳', bg: '#E8F5E9', color: '#2E7D32', label: 'Parc' },
  playground:       { emoji: '🎠', bg: '#E8F5E9', color: '#388E3C', label: 'Aire de jeux' },
  sports_centre:    { emoji: '⚽', bg: '#E0F7FA', color: '#006064', label: 'Sport' },
  parc:             { emoji: '🌳', bg: '#E8F5E9', color: '#2E7D32', label: 'Parc' },
  hotel:            { emoji: '🏨', bg: '#E0F2F1', color: '#004D40', label: 'Hôtel' },
  attraction:       { emoji: '🎡', bg: '#FFF3E0', color: '#E64A19', label: 'Attraction' },
  monument:         { emoji: '🏛️', bg: '#ECEFF1', color: '#263238', label: 'Monument' },
  mairie:           { emoji: '🏛️', bg: '#E8EAF6', color: '#1A237E', label: 'Mairie' },
  echangeur:        { emoji: '🔄', bg: '#ECEFF1', color: '#546E7A', label: 'Échangeur' },
  aeroport:         { emoji: '✈️', bg: '#E3F2FD', color: '#1565C0', label: 'Aéroport' },
  place_publique:   { emoji: '🟫', bg: '#EFEBE9', color: '#4E342E', label: 'Place publique' },
  mall:             { emoji: '🏬', bg: '#F3E5F5', color: '#4A148C', label: 'Centre commercial' },
};
