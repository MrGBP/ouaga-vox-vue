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
  images?: string[];
  available: boolean;
  virtual_tour_url?: string;
  has_video?: boolean;
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
  { id: 'q5', name: 'Patte d\'Oie', description: 'Carrefour stratégique, mélange résidentiel et commercial', latitude: 12.3580, longitude: -1.5380, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format' },
  { id: 'q6', name: 'Dassasgho', description: 'Quartier en pleine expansion, bon rapport qualité-prix', latitude: 12.3650, longitude: -1.4850, image_url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format' },
  { id: 'q7', name: 'Zogona', description: 'Quartier universitaire vivant, proche du centre', latitude: 12.3620, longitude: -1.5150, image_url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format' },
];

// ─── PROPERTIES (36+ biens) ──────────────────────────────────────────────────
export const mockProperties: Property[] = [
  // ═══ OUAGA 2000 (7 biens) ═══
  { id: 'p1', title: 'Villa Prestige Ouaga 2000', description: 'Magnifique villa avec piscine, jardin paysager et dépendances', type: 'villa', price: 850000, quartier: 'Ouaga 2000', address: 'Rue 15.01, Ouaga 2000', latitude: 12.3365, longitude: -1.4965, bedrooms: 5, bathrooms: 4, surface_area: 450, comfort_rating: 5, security_rating: 5, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p1' },
  { id: 'p2', title: 'Villa Diplomatique', description: 'Villa sécurisée proche des ambassades avec garage double', type: 'villa', price: 750000, quartier: 'Ouaga 2000', address: 'Avenue de la Résistance', latitude: 12.3340, longitude: -1.5010, bedrooms: 4, bathrooms: 3, surface_area: 380, comfort_rating: 5, security_rating: 5, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true },
  { id: 'p3', title: 'Maison Moderne O2000', description: 'Maison contemporaine avec terrasse panoramique', type: 'maison', price: 550000, quartier: 'Ouaga 2000', address: 'Rue 15.23', latitude: 12.3330, longitude: -1.4940, bedrooms: 3, bathrooms: 2, surface_area: 220, comfort_rating: 4, security_rating: 5, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p3' },
  { id: 'p4', title: 'Bureau Standing Ouaga 2000', description: 'Espace de bureau climatisé avec parking privé', type: 'bureau', price: 450000, quartier: 'Ouaga 2000', address: 'Boulevard France-Afrique', latitude: 12.3380, longitude: -1.4990, bedrooms: 0, bathrooms: 2, surface_area: 180, comfort_rating: 4, security_rating: 5, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: false },
  { id: 'p5', title: 'Villa Jardin Ouaga 2000', description: 'Villa familiale avec grand jardin clôturé', type: 'villa', price: 680000, quartier: 'Ouaga 2000', address: 'Rue 15.45', latitude: 12.3355, longitude: -1.5030, bedrooms: 4, bathrooms: 3, surface_area: 320, comfort_rating: 4, security_rating: 5, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: true },
  { id: 'p36', title: 'Commerce Ouaga 2000', description: 'Local commercial bien situé sur avenue principale', type: 'commerce', price: 380000, quartier: 'Ouaga 2000', address: 'Avenue principale O2000', latitude: 12.3370, longitude: -1.5050, bedrooms: 0, bathrooms: 1, surface_area: 120, comfort_rating: 3, security_rating: 5, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
  { id: 'p37', title: 'Maison Confort O2000', description: 'Maison récente avec finitions haut de gamme', type: 'maison', price: 480000, quartier: 'Ouaga 2000', address: 'Rue 15.60', latitude: 12.3320, longitude: -1.4955, bedrooms: 3, bathrooms: 2, surface_area: 200, comfort_rating: 4, security_rating: 5, images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'], available: false },

  // ═══ ZONE DU BOIS (6 biens) ═══
  { id: 'p6', title: 'Villa Boisée Zone du Bois', description: 'Villa dans un cadre verdoyant avec arbres centenaires', type: 'villa', price: 620000, quartier: 'Zone du Bois', address: 'Rue du Bois Sacré', latitude: 12.3790, longitude: -1.5340, bedrooms: 4, bathrooms: 3, surface_area: 350, comfort_rating: 5, security_rating: 4, images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p6' },
  { id: 'p7', title: 'Maison Familiale Zone du Bois', description: 'Grande maison familiale avec cour intérieure', type: 'maison', price: 420000, quartier: 'Zone du Bois', address: 'Avenue des Manguiers', latitude: 12.3770, longitude: -1.5370, bedrooms: 3, bathrooms: 2, surface_area: 250, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true },
  { id: 'p8', title: 'Bureau Calme Zone du Bois', description: 'Bureau dans quartier résidentiel calme', type: 'bureau', price: 280000, quartier: 'Zone du Bois', address: 'Rue des Acacias', latitude: 12.3800, longitude: -1.5320, bedrooms: 0, bathrooms: 1, surface_area: 100, comfort_rating: 3, security_rating: 4, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true },
  { id: 'p9', title: 'Villa Expatriés', description: 'Villa adaptée aux expatriés avec groupe électrogène', type: 'villa', price: 580000, quartier: 'Zone du Bois', address: 'Rue 29.15', latitude: 12.3760, longitude: -1.5360, bedrooms: 3, bathrooms: 2, surface_area: 280, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format'], available: false },
  { id: 'p38', title: 'Maison Cozy Zone du Bois', description: 'Petite maison charmante dans un cadre paisible', type: 'maison', price: 320000, quartier: 'Zone du Bois', address: 'Rue 29.30', latitude: 12.3785, longitude: -1.5380, bedrooms: 2, bathrooms: 1, surface_area: 150, comfort_rating: 3, security_rating: 4, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true },
  { id: 'p39', title: 'Boutique Zone du Bois', description: 'Boutique avec vitrine sur rue passante', type: 'boutique', price: 180000, quartier: 'Zone du Bois', address: 'Avenue Commerciale ZB', latitude: 12.3810, longitude: -1.5330, bedrooms: 0, bathrooms: 1, surface_area: 60, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },

  // ═══ KOULOUBA (5 biens) ═══
  { id: 'p10', title: 'Maison Vue Colline Koulouba', description: 'Maison avec vue imprenable sur la ville depuis la colline', type: 'maison', price: 380000, quartier: 'Koulouba', address: 'Rue de la Colline', latitude: 12.3830, longitude: -1.5110, bedrooms: 3, bathrooms: 2, surface_area: 200, comfort_rating: 4, security_rating: 3, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p10' },
  { id: 'p11', title: 'Villa Panoramique Koulouba', description: 'Villa historique avec terrasse panoramique', type: 'villa', price: 520000, quartier: 'Koulouba', address: 'Avenue du Palais', latitude: 12.3840, longitude: -1.5100, bedrooms: 4, bathrooms: 2, surface_area: 300, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: true },
  { id: 'p12', title: 'Bureau Koulouba Centre', description: 'Bureau administratif proche du centre gouvernemental', type: 'bureau', price: 350000, quartier: 'Koulouba', address: 'Rue Gouvernementale', latitude: 12.3815, longitude: -1.5130, bedrooms: 0, bathrooms: 1, surface_area: 120, comfort_rating: 3, security_rating: 4, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: false },
  { id: 'p13', title: 'Maison Traditionnelle Koulouba', description: 'Maison de charme au style architectural traditionnel', type: 'maison', price: 280000, quartier: 'Koulouba', address: 'Rue des Artisans', latitude: 12.3850, longitude: -1.5140, bedrooms: 2, bathrooms: 1, surface_area: 160, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'], available: true },
  { id: 'p40', title: 'Commerce Koulouba', description: 'Espace commercial avec bonne visibilité', type: 'commerce', price: 250000, quartier: 'Koulouba', address: 'Carrefour Koulouba', latitude: 12.3808, longitude: -1.5095, bedrooms: 0, bathrooms: 1, surface_area: 90, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },

  // ═══ TAMPOUY (6 biens) ═══
  { id: 'p14', title: 'Maison Familiale Tampouy', description: 'Grande maison familiale avec cour spacieuse', type: 'maison', price: 250000, quartier: 'Tampouy', address: 'Secteur 22, Tampouy', latitude: 12.3960, longitude: -1.5440, bedrooms: 3, bathrooms: 2, surface_area: 200, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true },
  { id: 'p15', title: 'Commerce Carrefour Tampouy', description: 'Local commercial au carrefour principal', type: 'commerce', price: 180000, quartier: 'Tampouy', address: 'Carrefour Tampouy', latitude: 12.3940, longitude: -1.5460, bedrooms: 0, bathrooms: 1, surface_area: 80, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
  { id: 'p16', title: 'Maison Économique Tampouy', description: 'Maison abordable idéale pour jeune famille', type: 'maison', price: 150000, quartier: 'Tampouy', address: 'Secteur 23', latitude: 12.3970, longitude: -1.5470, bedrooms: 2, bathrooms: 1, surface_area: 120, comfort_rating: 2, security_rating: 2, images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format'], available: true },
  { id: 'p17', title: 'Boutique Marché Tampouy', description: 'Boutique bien placée proche du marché', type: 'boutique', price: 120000, quartier: 'Tampouy', address: 'Près du marché Tampouy', latitude: 12.3935, longitude: -1.5430, bedrooms: 0, bathrooms: 1, surface_area: 40, comfort_rating: 2, security_rating: 2, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: false },
  { id: 'p41', title: 'Villa Moderne Tampouy', description: 'Villa neuve avec finitions modernes', type: 'villa', price: 420000, quartier: 'Tampouy', address: 'Rue Nouvelle Tampouy', latitude: 12.3980, longitude: -1.5420, bedrooms: 4, bathrooms: 2, surface_area: 280, comfort_rating: 4, security_rating: 3, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format'], available: true },
  { id: 'p42', title: 'Bureau Tampouy', description: 'Bureau abordable dans quartier dynamique', type: 'bureau', price: 200000, quartier: 'Tampouy', address: 'Avenue Tampouy', latitude: 12.3925, longitude: -1.5455, bedrooms: 0, bathrooms: 1, surface_area: 70, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true },

  // ═══ PATTE D'OIE (5 biens) ═══
  { id: 'p18', title: 'Maison Carrefour Patte d\'Oie', description: 'Maison bien située au carrefour Patte d\'Oie', type: 'maison', price: 320000, quartier: 'Patte d\'Oie', address: 'Carrefour Patte d\'Oie', latitude: 12.3590, longitude: -1.5370, bedrooms: 3, bathrooms: 2, surface_area: 180, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true },
  { id: 'p19', title: 'Commerce Patte d\'Oie', description: 'Grand espace commercial sur avenue principale', type: 'commerce', price: 350000, quartier: 'Patte d\'Oie', address: 'Avenue Patte d\'Oie', latitude: 12.3570, longitude: -1.5390, bedrooms: 0, bathrooms: 2, surface_area: 200, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
  { id: 'p20', title: 'Villa Patte d\'Oie', description: 'Villa confortable dans résidence sécurisée', type: 'villa', price: 480000, quartier: 'Patte d\'Oie', address: 'Résidence Les Palmiers', latitude: 12.3560, longitude: -1.5360, bedrooms: 3, bathrooms: 2, surface_area: 260, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: false },
  { id: 'p21', title: 'Bureau Patte d\'Oie Centre', description: 'Bureau moderne avec connexion fibre optique', type: 'bureau', price: 300000, quartier: 'Patte d\'Oie', address: 'Rue 12.40', latitude: 12.3600, longitude: -1.5400, bedrooms: 0, bathrooms: 1, surface_area: 110, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true },
  { id: 'p43', title: 'Maison Patte d\'Oie Nord', description: 'Maison spacieuse côté nord du quartier', type: 'maison', price: 280000, quartier: 'Patte d\'Oie', address: 'Secteur Nord PO', latitude: 12.3610, longitude: -1.5350, bedrooms: 2, bathrooms: 1, surface_area: 140, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true },

  // ═══ DASSASGHO (5 biens) ═══
  { id: 'p22', title: 'Maison Neuve Dassasgho', description: 'Maison récente dans nouveau lotissement', type: 'maison', price: 280000, quartier: 'Dassasgho', address: 'Nouveau Lotissement Dassasgho', latitude: 12.3660, longitude: -1.4840, bedrooms: 3, bathrooms: 2, surface_area: 180, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p22' },
  { id: 'p23', title: 'Villa Dassasgho', description: 'Villa spacieuse avec terrain arboré', type: 'villa', price: 450000, quartier: 'Dassasgho', address: 'Rue 38.12', latitude: 12.3640, longitude: -1.4860, bedrooms: 4, bathrooms: 2, surface_area: 300, comfort_rating: 4, security_rating: 3, images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&auto=format'], available: true },
  { id: 'p24', title: 'Commerce Dassasgho', description: 'Local commercial sur route principale', type: 'commerce', price: 220000, quartier: 'Dassasgho', address: 'Route Nationale', latitude: 12.3670, longitude: -1.4830, bedrooms: 0, bathrooms: 1, surface_area: 100, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
  { id: 'p25', title: 'Maison Bon Prix Dassasgho', description: 'Maison abordable en bon état', type: 'maison', price: 200000, quartier: 'Dassasgho', address: 'Secteur 44', latitude: 12.3680, longitude: -1.4870, bedrooms: 2, bathrooms: 1, surface_area: 130, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: false },
  { id: 'p44', title: 'Bureau Dassasgho', description: 'Bureau fonctionnel avec parking', type: 'bureau', price: 250000, quartier: 'Dassasgho', address: 'Avenue Dassasgho', latitude: 12.3635, longitude: -1.4820, bedrooms: 0, bathrooms: 1, surface_area: 85, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true },

  // ═══ ZOGONA (6 biens) ═══
  { id: 'p26', title: 'Maison Universitaire Zogona', description: 'Maison proche de l\'université, idéale colocation', type: 'maison', price: 220000, quartier: 'Zogona', address: 'Près de l\'Université', latitude: 12.3630, longitude: -1.5140, bedrooms: 3, bathrooms: 1, surface_area: 150, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'], available: true },
  { id: 'p27', title: 'Bureau Central Zogona', description: 'Bureau au cœur du quartier administratif', type: 'bureau', price: 350000, quartier: 'Zogona', address: 'Avenue Kwame Nkrumah', latitude: 12.3610, longitude: -1.5160, bedrooms: 0, bathrooms: 2, surface_area: 150, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format'], available: true, virtual_tour_url: 'https://tour.example.com/p27' },
  { id: 'p28', title: 'Commerce Zogona Centre', description: 'Espace commercial en zone passante', type: 'commerce', price: 300000, quartier: 'Zogona', address: 'Rue du Commerce', latitude: 12.3640, longitude: -1.5170, bedrooms: 0, bathrooms: 1, surface_area: 120, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
  { id: 'p29', title: 'Villa Zogona Résidentielle', description: 'Villa dans secteur résidentiel calme de Zogona', type: 'villa', price: 500000, quartier: 'Zogona', address: 'Secteur résidentiel', latitude: 12.3600, longitude: -1.5130, bedrooms: 4, bathrooms: 3, surface_area: 320, comfort_rating: 4, security_rating: 4, images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format'], available: false },
  { id: 'p30', title: 'Maison Zogona Sud', description: 'Maison confortable côté sud', type: 'maison', price: 260000, quartier: 'Zogona', address: 'Rue 5.20 Zogona', latitude: 12.3595, longitude: -1.5155, bedrooms: 2, bathrooms: 1, surface_area: 140, comfort_rating: 3, security_rating: 3, images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format'], available: true },
  { id: 'p45', title: 'Boutique Zogona', description: 'Boutique moderne proche université', type: 'boutique', price: 160000, quartier: 'Zogona', address: 'Avenue Universitaire', latitude: 12.3650, longitude: -1.5120, bedrooms: 0, bathrooms: 1, surface_area: 50, comfort_rating: 2, security_rating: 3, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format'], available: true },
];

// ─── POIs ─────────────────────────────────────────────────────────────────────
export const mockPois: POI[] = [
  // Ouaga 2000
  { id: 'poi1', name: 'Clinique Internationale', type: 'hopital', quartier: 'Ouaga 2000', latitude: 12.3360, longitude: -1.4970 },
  { id: 'poi2', name: 'Lycée International', type: 'ecole', quartier: 'Ouaga 2000', latitude: 12.3345, longitude: -1.5000 },
  { id: 'poi3', name: 'Banque BICIA-B Ouaga 2000', type: 'banque', quartier: 'Ouaga 2000', latitude: 12.3375, longitude: -1.4985 },
  { id: 'poi4', name: 'Restaurant Le Verdoyant', type: 'restaurant', quartier: 'Ouaga 2000', latitude: 12.3350, longitude: -1.5020 },
  // Zone du Bois
  { id: 'poi5', name: 'École Primaire Les Lauréats', type: 'ecole', quartier: 'Zone du Bois', latitude: 12.3785, longitude: -1.5345 },
  { id: 'poi6', name: 'Pharmacie du Bois', type: 'hopital', quartier: 'Zone du Bois', latitude: 12.3795, longitude: -1.5355 },
  { id: 'poi7', name: 'Maquis Chez Tantie', type: 'maquis', quartier: 'Zone du Bois', latitude: 12.3775, longitude: -1.5365 },
  // Koulouba
  { id: 'poi8', name: 'Centre de Santé Koulouba', type: 'hopital', quartier: 'Koulouba', latitude: 12.3825, longitude: -1.5115 },
  { id: 'poi9', name: 'École Koulouba A', type: 'ecole', quartier: 'Koulouba', latitude: 12.3835, longitude: -1.5105 },
  { id: 'poi10', name: 'Marché Koulouba', type: 'marche', quartier: 'Koulouba', latitude: 12.3845, longitude: -1.5125 },
  // Tampouy
  { id: 'poi11', name: 'Grand Marché Tampouy', type: 'marche', quartier: 'Tampouy', latitude: 12.3945, longitude: -1.5445 },
  { id: 'poi12', name: 'CSPS Tampouy', type: 'hopital', quartier: 'Tampouy', latitude: 12.3955, longitude: -1.5435 },
  { id: 'poi13', name: 'Lycée Tampouy', type: 'ecole', quartier: 'Tampouy', latitude: 12.3965, longitude: -1.5465 },
  { id: 'poi14', name: 'Gare Routière Tampouy', type: 'transport', quartier: 'Tampouy', latitude: 12.3930, longitude: -1.5455 },
  // Patte d'Oie
  { id: 'poi15', name: 'Centre Commercial Patte d\'Oie', type: 'marche', quartier: 'Patte d\'Oie', latitude: 12.3585, longitude: -1.5375 },
  { id: 'poi16', name: 'Clinique Patte d\'Oie', type: 'hopital', quartier: 'Patte d\'Oie', latitude: 12.3575, longitude: -1.5385 },
  { id: 'poi17', name: 'Banque BOA Patte d\'Oie', type: 'banque', quartier: 'Patte d\'Oie', latitude: 12.3595, longitude: -1.5395 },
  // Dassasgho
  { id: 'poi18', name: 'Marché Dassasgho', type: 'marche', quartier: 'Dassasgho', latitude: 12.3655, longitude: -1.4845 },
  { id: 'poi19', name: 'École Dassasgho Centre', type: 'ecole', quartier: 'Dassasgho', latitude: 12.3665, longitude: -1.4855 },
  { id: 'poi20', name: 'Salle de Sport Dassasgho', type: 'gym', quartier: 'Dassasgho', latitude: 12.3645, longitude: -1.4835 },
  // Zogona
  { id: 'poi21', name: 'Université de Ouagadougou', type: 'universite', quartier: 'Zogona', latitude: 12.3625, longitude: -1.5145 },
  { id: 'poi22', name: 'CHU Yalgado', type: 'hopital', quartier: 'Zogona', latitude: 12.3615, longitude: -1.5155 },
  { id: 'poi23', name: 'Parc Bangr Wéoogo', type: 'parc', quartier: 'Zogona', latitude: 12.3635, longitude: -1.5165 },
  { id: 'poi24', name: 'Banque SGBF Zogona', type: 'banque', quartier: 'Zogona', latitude: 12.3605, longitude: -1.5135 },
];
