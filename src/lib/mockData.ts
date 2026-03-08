// Mock data for SapSapHouse — données fictives réalistes Ouagadougou

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
  year_built?: number;
  has_ac?: boolean;
  has_guardian?: boolean;
  has_generator?: boolean;
  has_garden?: boolean;
  has_water?: boolean;
  has_internet?: boolean;
  status?: 'available' | 'reserved' | 'rented';
  agent_name?: string;
  agent_phone?: string;
  agent_photo?: string;
  furnished?: boolean;
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
}

// ─── QUARTIERS ────────────────────────────────────────────────────────────────
export const mockQuartiers: Quartier[] = [
  { id: 'q1', name: 'Ouaga 2000', description: 'Quartier résidentiel haut standing, ambassades et villas de luxe', latitude: 12.3350, longitude: -1.4980, image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format' },
  { id: 'q2', name: 'Zone du Bois', description: 'Quartier calme et verdoyant, prisé des expatriés', latitude: 12.3780, longitude: -1.5350, image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format' },
  { id: 'q3', name: 'Koulouba', description: 'Quartier historique sur la colline, vue panoramique', latitude: 12.3820, longitude: -1.5120, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format' },
  { id: 'q4', name: 'Tampouy', description: 'Quartier populaire dynamique, commerces et marchés', latitude: 12.3950, longitude: -1.5450, image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format' },
  { id: 'q5', name: "Patte d'Oie", description: 'Carrefour stratégique, mélange résidentiel et commercial', latitude: 12.3580, longitude: -1.5380, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format' },
  { id: 'q6', name: 'Dassasgho', description: 'Quartier en pleine expansion, bon rapport qualité-prix', latitude: 12.3650, longitude: -1.4850, image_url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format' },
  { id: 'q7', name: 'Zogona', description: 'Quartier universitaire vivant, proche du centre', latitude: 12.3620, longitude: -1.5150, image_url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format' },
  { id: 'q8', name: 'Wemtenga', description: 'Quartier central animé, proche du marché', latitude: 12.3600, longitude: -1.4990, image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&auto=format' },
  { id: 'q9', name: 'Pissy', description: 'Quartier résidentiel en développement', latitude: 12.3500, longitude: -1.5380, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format' },
  { id: 'q10', name: 'Gounghin', description: 'Quartier historique, cœur de la ville', latitude: 12.3670, longitude: -1.5290, image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format' },
  { id: 'q11', name: 'Somgandé', description: 'Quartier résidentiel au nord, calme et familial', latitude: 12.3900, longitude: -1.5240, image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format' },
  { id: 'q12', name: 'Tanghin', description: 'Quartier populaire, proche du barrage', latitude: 12.3790, longitude: -1.5150, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format' },
];

// Agent defaults
const AGENTS = [
  { name: 'Ibrahim Ouédraogo', phone: '+226 70 12 34 56', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format' },
  { name: 'Aminata Traoré', phone: '+226 76 98 76 54', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format' },
  { name: 'Moussa Kaboré', phone: '+226 71 55 44 33', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format' },
];

const assignAgent = (i: number) => ({ agent_name: AGENTS[i % AGENTS.length].name, agent_phone: AGENTS[i % AGENTS.length].phone, agent_photo: AGENTS[i % AGENTS.length].photo });

// ─── PROPERTIES (39 biens) ──────────────────────────────────────────────────
// Distribution: 16 Maisons/Villas meublées, 10 Appartements meublés, 6 Studios meublés, 4 Bureaux, 3 Locaux commerciaux
export const mockProperties: Property[] = [
  // ═══ MAISONS / VILLAS MEUBLÉES (16) ═══
  { id: 'v1', title: 'Villa Prestige Ouaga 2000', description: 'Magnifique villa avec piscine, jardin paysager et dépendances. Gardien 24h/24, groupe électrogène et connexion internet haut débit.', type: 'villa', price: 850000, quartier: 'Ouaga 2000', address: 'Rue 15.01, Secteur 30', latitude: 12.3365, longitude: -1.4965, bedrooms: 5, bathrooms: 4, surface_area: 450, comfort_rating: 5, security_rating: 5, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/v1', year_built: 2019, has_ac: true, has_guardian: true, has_generator: true, has_garden: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'v2', title: 'Villa Diplomatique Ouaga 2000', description: 'Villa sécurisée proche des ambassades avec garage double et finitions luxueuses.', type: 'villa', price: 750000, quartier: 'Ouaga 2000', address: 'Avenue de la Résistance, Secteur 30', latitude: 12.3340, longitude: -1.5010, bedrooms: 4, bathrooms: 3, surface_area: 380, comfort_rating: 5, security_rating: 5, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true, year_built: 2017, has_ac: true, has_guardian: true, has_generator: true, has_garden: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v3', title: 'Maison Moderne O2000', description: 'Maison contemporaine avec terrasse panoramique et finitions haut de gamme.', type: 'maison', price: 550000, quartier: 'Ouaga 2000', address: 'Rue 15.23, Secteur 30', latitude: 12.3330, longitude: -1.4940, bedrooms: 3, bathrooms: 2, surface_area: 220, comfort_rating: 4, security_rating: 5, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/v3', year_built: 2020, has_ac: true, has_guardian: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'v4', title: 'Villa Jardin Ouaga 2000', description: 'Villa familiale avec grand jardin clôturé et espace barbecue.', type: 'villa', price: 680000, quartier: 'Ouaga 2000', address: 'Rue 15.45, Secteur 30', latitude: 12.3355, longitude: -1.5030, bedrooms: 4, bathrooms: 3, surface_area: 320, comfort_rating: 4, security_rating: 5, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: true, year_built: 2016, has_ac: true, has_guardian: true, has_garden: true, has_water: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v5', title: 'Villa Boisée Zone du Bois', description: 'Villa dans un cadre verdoyant avec arbres centenaires et piscine privée.', type: 'villa', price: 620000, quartier: 'Zone du Bois', address: 'Rue du Bois Sacré', latitude: 12.3790, longitude: -1.5340, bedrooms: 4, bathrooms: 3, surface_area: 350, comfort_rating: 5, security_rating: 4, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/v5', has_ac: true, has_guardian: true, has_garden: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v6', title: 'Maison Familiale Zone du Bois', description: 'Grande maison familiale avec cour intérieure et dépendances.', type: 'maison', price: 420000, quartier: 'Zone du Bois', address: 'Avenue des Manguiers', latitude: 12.3770, longitude: -1.5370, bedrooms: 3, bathrooms: 2, surface_area: 250, comfort_rating: 4, security_rating: 4, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true, has_ac: true, has_water: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'v7', title: 'Villa Expatriés Zone du Bois', description: 'Villa adaptée aux expatriés avec groupe électrogène et internet fibre.', type: 'villa', price: 580000, quartier: 'Zone du Bois', address: 'Rue 29.15', latitude: 12.3760, longitude: -1.5360, bedrooms: 3, bathrooms: 2, surface_area: 280, comfort_rating: 4, security_rating: 4, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format'], available: true, has_ac: true, has_generator: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'v8', title: 'Maison Vue Colline Koulouba', description: 'Maison avec vue imprenable sur la ville depuis la colline de Koulouba.', type: 'maison', price: 380000, quartier: 'Koulouba', address: 'Rue de la Colline, Secteur 5', latitude: 12.3830, longitude: -1.5110, bedrooms: 3, bathrooms: 2, surface_area: 200, comfort_rating: 4, security_rating: 3, accessibility_rating: 2, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/v8', has_water: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v9', title: 'Villa Panoramique Koulouba', description: 'Villa historique avec terrasse panoramique et jardin arboré.', type: 'villa', price: 520000, quartier: 'Koulouba', address: 'Avenue du Palais', latitude: 12.3840, longitude: -1.5100, bedrooms: 4, bathrooms: 2, surface_area: 300, comfort_rating: 4, security_rating: 4, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: true, has_ac: true, has_garden: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'v10', title: 'Maison Familiale Tampouy', description: 'Grande maison familiale avec cour spacieuse et arbres fruitiers.', type: 'maison', price: 250000, quartier: 'Tampouy', address: 'Secteur 22, Tampouy', latitude: 12.3960, longitude: -1.5440, bedrooms: 3, bathrooms: 2, surface_area: 200, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true, has_water: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'v11', title: 'Villa Moderne Tampouy', description: 'Villa neuve avec finitions modernes et cuisine américaine.', type: 'villa', price: 420000, quartier: 'Tampouy', address: 'Rue Nouvelle Tampouy', latitude: 12.3980, longitude: -1.5420, bedrooms: 4, bathrooms: 2, surface_area: 280, comfort_rating: 4, security_rating: 3, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format'], available: true, has_ac: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v12', title: "Maison Carrefour Patte d'Oie", description: "Maison bien située au carrefour stratégique de Patte d'Oie.", type: 'maison', price: 320000, quartier: "Patte d'Oie", address: "Carrefour Patte d'Oie", latitude: 12.3590, longitude: -1.5370, bedrooms: 3, bathrooms: 2, surface_area: 180, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true, has_water: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'v13', title: 'Maison Neuve Dassasgho', description: 'Maison récente dans nouveau lotissement avec toutes commodités.', type: 'maison', price: 280000, quartier: 'Dassasgho', address: 'Nouveau Lotissement Dassasgho', latitude: 12.3660, longitude: -1.4840, bedrooms: 3, bathrooms: 2, surface_area: 180, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/v13', has_water: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'v14', title: 'Villa Dassasgho', description: 'Villa spacieuse avec terrain arboré et garage couvert.', type: 'villa', price: 450000, quartier: 'Dassasgho', address: 'Rue 38.12', latitude: 12.3640, longitude: -1.4860, bedrooms: 4, bathrooms: 2, surface_area: 300, comfort_rating: 4, security_rating: 3, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format'], available: true, has_ac: true, has_garden: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'v15', title: 'Villa Zogona Résidentielle', description: 'Villa dans secteur résidentiel calme de Zogona avec vue sur le parc.', type: 'villa', price: 500000, quartier: 'Zogona', address: 'Secteur résidentiel', latitude: 12.3600, longitude: -1.5130, bedrooms: 4, bathrooms: 3, surface_area: 320, comfort_rating: 4, security_rating: 4, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: true, has_ac: true, has_garden: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'v16', title: 'Maison Wemtenga', description: 'Maison centrale avec accès facile aux transports et au marché.', type: 'maison', price: 300000, quartier: 'Wemtenga', address: 'Secteur 14, Wemtenga', latitude: 12.3605, longitude: -1.4985, bedrooms: 3, bathrooms: 2, surface_area: 170, comfort_rating: 3, security_rating: 3, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true, furnished: true, status: 'available', ...assignAgent(1) },

  // ═══ APPARTEMENTS MEUBLÉS (10) ═══
  { id: 'a1', title: 'Appartement meublé 2ch Ouaga 2000', description: 'Superbe appartement entièrement meublé avec cuisine équipée, salon moderne et balcon avec vue. Idéal pour expatriés.', type: 'appartement', price: 450000, quartier: 'Ouaga 2000', address: 'Résidence Le Diplomat, Secteur 30', latitude: 12.3348, longitude: -1.4975, bedrooms: 2, bathrooms: 1, surface_area: 95, comfort_rating: 5, security_rating: 5, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/a1', year_built: 2021, has_ac: true, has_guardian: true, has_generator: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'a2', title: 'Appartement meublé 3ch Zone du Bois', description: 'Bel appartement meublé dans quartier résidentiel calme. Cadre verdoyant et sécurisé.', type: 'appartement', price: 600000, quartier: 'Zone du Bois', address: 'Avenue des Palmiers, ZB', latitude: 12.3775, longitude: -1.5345, bedrooms: 3, bathrooms: 2, surface_area: 140, comfort_rating: 4, security_rating: 4, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format'], available: true, year_built: 2020, has_ac: true, has_guardian: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'a3', title: 'Appartement meublé Koulouba', description: 'Appartement lumineux avec vue sur la colline et balcon privé.', type: 'appartement', price: 350000, quartier: 'Koulouba', address: 'Rue de la Colline, Secteur 5', latitude: 12.3825, longitude: -1.5118, bedrooms: 2, bathrooms: 1, surface_area: 85, comfort_rating: 4, security_rating: 3, accessibility_rating: 2, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&auto=format'], available: true, has_video: true, year_built: 2019, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'a4', title: 'Appartement meublé Tampouy', description: 'Appartement fonctionnel et bien équipé au cœur de Tampouy.', type: 'appartement', price: 200000, quartier: 'Tampouy', address: 'Secteur 23, Tampouy', latitude: 12.3970, longitude: -1.5470, bedrooms: 2, bathrooms: 1, surface_area: 75, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format'], available: true, has_ac: true, has_water: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'a5', title: "Appartement meublé Patte d'Oie", description: "Appartement moderne entièrement équipé au carrefour stratégique.", type: 'appartement', price: 280000, quartier: "Patte d'Oie", address: "Résidence Moderne, Patte d'Oie", latitude: 12.3560, longitude: -1.5360, bedrooms: 2, bathrooms: 1, surface_area: 80, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'], available: true, year_built: 2022, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'a6', title: 'Appartement meublé Dassasgho', description: 'Bel appartement récent dans quartier en pleine expansion.', type: 'appartement', price: 230000, quartier: 'Dassasgho', address: 'Avenue Dassasgho', latitude: 12.3635, longitude: -1.4820, bedrooms: 2, bathrooms: 1, surface_area: 70, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format'], available: true, has_ac: true, has_water: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'a7', title: 'Appartement meublé Zogona', description: "Appartement proche de l'université, idéal pour professionnels et étudiants.", type: 'appartement', price: 260000, quartier: 'Zogona', address: 'Rue Universitaire, Zogona', latitude: 12.3625, longitude: -1.5145, bedrooms: 2, bathrooms: 1, surface_area: 75, comfort_rating: 3, security_rating: 3, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format'], available: true, has_video: true, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 'a8', title: 'Appartement meublé Wemtenga', description: 'Appartement confortable et bien situé près du marché de Wemtenga.', type: 'appartement', price: 220000, quartier: 'Wemtenga', address: 'Secteur 14, Wemtenga', latitude: 12.3590, longitude: -1.4970, bedrooms: 2, bathrooms: 1, surface_area: 65, comfort_rating: 3, security_rating: 3, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format'], available: true, has_water: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 'a9', title: 'Appartement standing Ouaga 2000', description: 'Grand appartement haut standing avec terrasse et parking privé.', type: 'appartement', price: 500000, quartier: 'Ouaga 2000', address: 'Résidence Les Étoiles, Secteur 30', latitude: 12.3380, longitude: -1.4990, bedrooms: 3, bathrooms: 2, surface_area: 130, comfort_rating: 5, security_rating: 5, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/a9', has_ac: true, has_guardian: true, has_generator: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 'a10', title: 'Appartement meublé Somgandé', description: 'Appartement calme dans quartier résidentiel familial de Somgandé.', type: 'appartement', price: 240000, quartier: 'Somgandé', address: 'Rue 40.15, Somgandé', latitude: 12.3905, longitude: -1.5235, bedrooms: 2, bathrooms: 1, surface_area: 70, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'], available: true, has_ac: true, has_water: true, furnished: true, status: 'available', ...assignAgent(2) },

  // ═══ STUDIOS MEUBLÉS (6) ═══
  { id: 's1', title: 'Studio meublé Koulouba', description: "Studio coquet et fonctionnel avec coin cuisine, salle d'eau moderne et terrasse privée.", type: 'studio', price: 150000, quartier: 'Koulouba', address: 'Rue des Artisans, Koulouba', latitude: 12.3850, longitude: -1.5140, bedrooms: 1, bathrooms: 1, surface_area: 35, comfort_rating: 3, security_rating: 3, accessibility_rating: 2, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'], available: true, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 's2', title: "Studio meublé Patte d'Oie", description: "Studio moderne avec douche à l'italienne et kitchenette équipée. Proche transports.", type: 'studio', price: 120000, quartier: "Patte d'Oie", address: "Résidence Soleil, Patte d'Oie", latitude: 12.3585, longitude: -1.5375, bedrooms: 1, bathrooms: 1, surface_area: 30, comfort_rating: 3, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format'], available: true, year_built: 2023, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 's3', title: 'Studio meublé Tampouy', description: 'Studio économique bien équipé, idéal pour étudiant ou jeune professionnel.', type: 'studio', price: 100000, quartier: 'Tampouy', address: 'Secteur 22, Tampouy', latitude: 12.3935, longitude: -1.5430, bedrooms: 1, bathrooms: 1, surface_area: 28, comfort_rating: 2, security_rating: 2, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'], available: true, has_water: true, furnished: true, status: 'available', ...assignAgent(0) },
  { id: 's4', title: 'Studio meublé Zogona', description: "Studio universitaire meublé proche campus. Internet haut débit inclus.", type: 'studio', price: 130000, quartier: 'Zogona', address: 'Avenue Universitaire, Zogona', latitude: 12.3650, longitude: -1.5120, bedrooms: 1, bathrooms: 1, surface_area: 32, comfort_rating: 3, security_rating: 3, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&auto=format'], available: true, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(1) },
  { id: 's5', title: 'Studio meublé Dassasgho', description: 'Studio récent dans quartier en développement. Bon rapport qualité-prix.', type: 'studio', price: 110000, quartier: 'Dassasgho', address: 'Nouveau lotissement Dassasgho', latitude: 12.3680, longitude: -1.4870, bedrooms: 1, bathrooms: 1, surface_area: 30, comfort_rating: 2, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'], available: true, has_water: true, furnished: true, status: 'available', ...assignAgent(2) },
  { id: 's6', title: 'Studio meublé Zone du Bois', description: 'Studio charmant dans quartier verdoyant et calme. Terrasse avec vue sur jardin.', type: 'studio', price: 180000, quartier: 'Zone du Bois', address: 'Rue 29.30, Zone du Bois', latitude: 12.3785, longitude: -1.5380, bedrooms: 1, bathrooms: 1, surface_area: 38, comfort_rating: 4, security_rating: 4, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&auto=format'], available: true, has_ac: true, has_water: true, has_internet: true, furnished: true, status: 'available', ...assignAgent(0) },

  // ═══ BUREAUX (4) ═══
  { id: 'b1', title: 'Bureau Standing Ouaga 2000', description: 'Espace de bureau climatisé avec parking privé et salle de réunion.', type: 'bureau', price: 450000, quartier: 'Ouaga 2000', address: 'Boulevard France-Afrique, Secteur 30', latitude: 12.3370, longitude: -1.4990, bedrooms: 0, bathrooms: 2, surface_area: 180, comfort_rating: 4, security_rating: 5, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true, year_built: 2018, has_ac: true, has_guardian: true, has_internet: true, status: 'available', ...assignAgent(0) },
  { id: 'b2', title: 'Bureau Calme Zone du Bois', description: 'Bureau dans quartier résidentiel calme avec internet fibre.', type: 'bureau', price: 280000, quartier: 'Zone du Bois', address: 'Rue des Acacias', latitude: 12.3800, longitude: -1.5320, bedrooms: 0, bathrooms: 1, surface_area: 100, comfort_rating: 3, security_rating: 4, accessibility_rating: 3, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true, has_ac: true, has_internet: true, status: 'available', ...assignAgent(0) },
  { id: 'b3', title: 'Bureau Central Zogona', description: 'Bureau au cœur du quartier administratif avec connexion fibre.', type: 'bureau', price: 350000, quartier: 'Zogona', address: 'Avenue Kwame Nkrumah', latitude: 12.3610, longitude: -1.5160, bedrooms: 0, bathrooms: 2, surface_area: 150, comfort_rating: 4, security_rating: 4, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/b3', has_ac: true, has_internet: true, status: 'available', ...assignAgent(2) },
  { id: 'b4', title: 'Bureau Wemtenga', description: 'Bureau fonctionnel avec bon emplacement et parking.', type: 'bureau', price: 270000, quartier: 'Wemtenga', address: 'Avenue Wemtenga', latitude: 12.3615, longitude: -1.5000, bedrooms: 0, bathrooms: 1, surface_area: 90, comfort_rating: 3, security_rating: 3, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true, has_ac: true, status: 'available', ...assignAgent(0) },

  // ═══ LOCAUX COMMERCIAUX (3) ═══
  { id: 'c1', title: 'Local commercial Ouaga 2000', description: 'Local commercial bien situé sur avenue principale avec grande vitrine.', type: 'commerce', price: 380000, quartier: 'Ouaga 2000', address: 'Avenue principale, Secteur 30', latitude: 12.3375, longitude: -1.5050, bedrooms: 0, bathrooms: 1, surface_area: 120, comfort_rating: 3, security_rating: 5, accessibility_rating: 5, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true, status: 'available', ...assignAgent(2) },
  { id: 'c2', title: 'Local commercial Tampouy', description: 'Local commercial au carrefour principal avec forte affluence.', type: 'commerce', price: 180000, quartier: 'Tampouy', address: 'Carrefour Tampouy', latitude: 12.3940, longitude: -1.5460, bedrooms: 0, bathrooms: 1, surface_area: 80, comfort_rating: 2, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true, status: 'available', ...assignAgent(1) },
  { id: 'c3', title: 'Local commercial Dassasgho', description: 'Local commercial sur route principale avec parking client.', type: 'commerce', price: 220000, quartier: 'Dassasgho', address: 'Route Nationale, Dassasgho', latitude: 12.3670, longitude: -1.4830, bedrooms: 0, bathrooms: 1, surface_area: 100, comfort_rating: 2, security_rating: 3, accessibility_rating: 4, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true, status: 'available', ...assignAgent(1) },
];

// ─── POIs (enriched catalog) ──────────────────────────────────────────────────
export const mockPois: POI[] = [
  // Ouaga 2000
  { id: 'poi1', name: 'Clinique Les Genêts', type: 'clinique', quartier: 'Ouaga 2000', latitude: 12.3360, longitude: -1.4970 },
  { id: 'poi2', name: 'Lycée International', type: 'lycee', quartier: 'Ouaga 2000', latitude: 12.3345, longitude: -1.5000 },
  { id: 'poi3', name: 'Banque BICIA-B Ouaga 2000', type: 'banque', quartier: 'Ouaga 2000', latitude: 12.3375, longitude: -1.4985 },
  { id: 'poi4', name: 'Restaurant Le Verdoyant', type: 'restaurant', quartier: 'Ouaga 2000', latitude: 12.3350, longitude: -1.5020 },
  { id: 'poi50', name: 'Station Total O2000', type: 'station_total', quartier: 'Ouaga 2000', latitude: 12.3390, longitude: -1.4960 },
  { id: 'poi51', name: 'Pharmacie du Progrès', type: 'pharmacie', quartier: 'Ouaga 2000', latitude: 12.3335, longitude: -1.4975 },
  // Zone du Bois
  { id: 'poi5', name: 'École Primaire Les Lauréats', type: 'ecole_primaire', quartier: 'Zone du Bois', latitude: 12.3785, longitude: -1.5345 },
  { id: 'poi6', name: 'Pharmacie du Bois', type: 'pharmacie', quartier: 'Zone du Bois', latitude: 12.3795, longitude: -1.5355 },
  { id: 'poi7', name: 'Maquis Chez Tantie', type: 'restaurant', quartier: 'Zone du Bois', latitude: 12.3775, longitude: -1.5365 },
  { id: 'poi52', name: 'Mosquée Zone du Bois', type: 'mosquee_quartier', quartier: 'Zone du Bois', latitude: 12.3805, longitude: -1.5335 },
  // Koulouba
  { id: 'poi8', name: 'Centre de Santé Koulouba', type: 'hopital', quartier: 'Koulouba', latitude: 12.3825, longitude: -1.5115 },
  { id: 'poi9', name: 'École Koulouba A', type: 'ecole_primaire', quartier: 'Koulouba', latitude: 12.3835, longitude: -1.5105 },
  { id: 'poi10', name: 'Marché Koulouba', type: 'marche_quartier', quartier: 'Koulouba', latitude: 12.3845, longitude: -1.5125 },
  { id: 'poi53', name: 'Cathédrale de Koulouba', type: 'cathedrale', quartier: 'Koulouba', latitude: 12.3818, longitude: -1.5098 },
  // Tampouy
  { id: 'poi11', name: 'Grand Marché Tampouy', type: 'grand_marche', quartier: 'Tampouy', latitude: 12.3945, longitude: -1.5445 },
  { id: 'poi12', name: 'CSPS Tampouy', type: 'hopital', quartier: 'Tampouy', latitude: 12.3955, longitude: -1.5435 },
  { id: 'poi13', name: 'Lycée Tampouy', type: 'lycee', quartier: 'Tampouy', latitude: 12.3965, longitude: -1.5465 },
  { id: 'poi14', name: 'Gare Routière Tampouy', type: 'gare_routiere', quartier: 'Tampouy', latitude: 12.3930, longitude: -1.5455 },
  { id: 'poi54', name: 'Mosquée de Tampouy', type: 'mosquee_quartier', quartier: 'Tampouy', latitude: 12.3950, longitude: -1.5450 },
  { id: 'poi55', name: 'Station Oilibya Tampouy', type: 'station_oilibya', quartier: 'Tampouy', latitude: 12.3938, longitude: -1.5440 },
  // Patte d'Oie
  { id: 'poi15', name: "Centre Commercial Patte d'Oie", type: 'supermarche', quartier: "Patte d'Oie", latitude: 12.3585, longitude: -1.5375 },
  { id: 'poi16', name: "Clinique Patte d'Oie", type: 'clinique', quartier: "Patte d'Oie", latitude: 12.3575, longitude: -1.5385 },
  { id: 'poi17', name: "Banque BOA Patte d'Oie", type: 'banque', quartier: "Patte d'Oie", latitude: 12.3595, longitude: -1.5395 },
  { id: 'poi56', name: "Échangeur Patte d'Oie", type: 'echangeur', quartier: "Patte d'Oie", latitude: 12.3580, longitude: -1.5370 },
  // Dassasgho
  { id: 'poi18', name: 'Marché Dassasgho', type: 'marche_quartier', quartier: 'Dassasgho', latitude: 12.3655, longitude: -1.4845 },
  { id: 'poi19', name: 'École Dassasgho Centre', type: 'ecole_primaire', quartier: 'Dassasgho', latitude: 12.3665, longitude: -1.4855 },
  { id: 'poi20', name: 'Salle de Sport Dassasgho', type: 'parc', quartier: 'Dassasgho', latitude: 12.3645, longitude: -1.4835 },
  // Zogona
  { id: 'poi21', name: 'Université de Ouagadougou', type: 'universite', quartier: 'Zogona', latitude: 12.3625, longitude: -1.5145 },
  { id: 'poi22', name: 'CHU Yalgado Ouédraogo', type: 'hopital', quartier: 'Zogona', latitude: 12.3615, longitude: -1.5155 },
  { id: 'poi23', name: 'Parc Bangr Wéoogo', type: 'parc', quartier: 'Zogona', latitude: 12.3635, longitude: -1.5165 },
  { id: 'poi24', name: 'Banque SGBF Zogona', type: 'banque', quartier: 'Zogona', latitude: 12.3605, longitude: -1.5135 },
  { id: 'poi57', name: 'Grande Mosquée de Ouagadougou', type: 'grande_mosquee', quartier: 'Zogona', latitude: 12.3618, longitude: -1.5148 },
  // Wemtenga
  { id: 'poi25', name: 'Marché de Wemtenga', type: 'marche_quartier', quartier: 'Wemtenga', latitude: 12.3598, longitude: -1.4988 },
  { id: 'poi26', name: 'Pharmacie Wemtenga', type: 'pharmacie', quartier: 'Wemtenga', latitude: 12.3608, longitude: -1.4995 },
  { id: 'poi27', name: 'Arrêt SOTRACO Wemtenga', type: 'arret_sotraco', quartier: 'Wemtenga', latitude: 12.3602, longitude: -1.4980 },
];

// ─── POI CATALOG (icons, colors) ──────────────────────────────────────────────
export interface POICatalogEntry {
  emoji: string;
  bg: string;
  color: string;
  label: string;
}

export const POI_CATALOG: Record<string, POICatalogEntry> = {
  grande_mosquee:  { emoji: '🕌', bg: '#E8F5E9', color: '#1B5E20', label: 'Grande Mosquée' },
  mosquee_quartier:{ emoji: '🕌', bg: '#F1F8E9', color: '#33691E', label: 'Mosquée' },
  cathedrale:      { emoji: '⛪', bg: '#E3F2FD', color: '#0D47A1', label: 'Cathédrale' },
  eglise:          { emoji: '✝️', bg: '#E8EAF6', color: '#283593', label: 'Église' },
  grand_marche:    { emoji: '🏪', bg: '#FFF8E1', color: '#E65100', label: 'Grand Marché' },
  marche_quartier: { emoji: '🛒', bg: '#FFF3E0', color: '#BF360C', label: 'Marché' },
  supermarche:     { emoji: '🏬', bg: '#E0F2F1', color: '#004D40', label: 'Supermarché' },
  hopital:         { emoji: '🏥', bg: '#FCE4EC', color: '#880E4F', label: 'Hôpital' },
  clinique:        { emoji: '⚕️', bg: '#F3E5F5', color: '#6A1B9A', label: 'Clinique' },
  pharmacie:       { emoji: '💊', bg: '#E8F5E9', color: '#2E7D32', label: 'Pharmacie' },
  ecole_primaire:  { emoji: '🏫', bg: '#E3F2FD', color: '#1565C0', label: 'École primaire' },
  lycee:           { emoji: '🎓', bg: '#E8EAF6', color: '#283593', label: 'Lycée' },
  universite:      { emoji: '🏛️', bg: '#EDE7F6', color: '#4527A0', label: 'Université' },
  banque:          { emoji: '🏦', bg: '#E0F7FA', color: '#00695C', label: 'Banque' },
  station_total:   { emoji: '⛽', bg: '#FFF9C4', color: '#F57F17', label: 'Station Total' },
  station_oilibya: { emoji: '⛽', bg: '#FFF9C4', color: '#E65100', label: 'Station Oilibya' },
  restaurant:      { emoji: '🍽️', bg: '#FBE9E7', color: '#BF360C', label: 'Restaurant' },
  parc:            { emoji: '🌳', bg: '#E8F5E9', color: '#1B5E20', label: 'Parc / Loisir' },
  gare_routiere:   { emoji: '🚌', bg: '#E3F2FD', color: '#0D47A1', label: 'Gare routière' },
  arret_sotraco:   { emoji: '🚏', bg: '#E8EAF6', color: '#3949AB', label: 'Arrêt SOTRACO' },
  echangeur:       { emoji: '🛣️', bg: '#ECEFF1', color: '#37474F', label: 'Échangeur' },
};
