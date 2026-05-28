// SapSapHouse — Configuration géographique multi-pays

export interface CityConfig {
  id: string;
  name: string;
  country: string;
  countryName: string;
  flag: string;
  currency: string;
  language: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  phone_prefix: string;
  price_unit: string;
}

export const CITIES: Record<string, CityConfig> = {
  ouagadougou: {
    id: 'ouagadougou',
    name: 'Ouagadougou',
    country: 'BF',
    countryName: 'Burkina Faso',
    flag: '🇧🇫',
    currency: 'FCFA',
    language: 'fr',
    center: [12.3647, -1.5337],
    zoom: 13,
    bounds: [[12.10, -1.85], [12.60, -1.25]],
    phone_prefix: '+226',
    price_unit: 'FCFA',
  },
  bamako: {
    id: 'bamako',
    name: 'Bamako',
    country: 'ML',
    countryName: 'Mali',
    flag: '🇲🇱',
    currency: 'FCFA',
    language: 'fr',
    center: [12.6392, -8.0029],
    zoom: 13,
    bounds: [[12.50, -8.20], [12.80, -7.80]],
    phone_prefix: '+223',
    price_unit: 'FCFA',
  },
};

export const COUNTRY_TO_CITY: Record<string, string> = {
  BF: 'ouagadougou',
  ML: 'bamako',
};

export const DEFAULT_CITY = 'ouagadougou';

// ─── Arrondissements de Ouagadougou ────────────────────────────────────────
export const OUAGADOUGOU_ARRONDISSEMENTS = {
  arrondissement1: {
    nom: 'Arrondissement 1',
    quartiers: ['Bilbalogo', 'Saint Léon', 'Zangouettin', 'Tiedpalogo', 'Koulouba', 'Kamsonghin', 'Samandin', 'Gounghin Sud', 'Gandin', 'Kouritenga', 'Mankougoudou'],
    center: [12.3647, -1.5337] as [number, number],
  },
  arrondissement2: {
    nom: 'Arrondissement 2',
    quartiers: ['Paspanga', 'Ouidi', 'Larlé', 'Kologh Naba', 'Dapoya', 'Nemnin', 'Niogsin', 'Hamdalaye', 'Gounghin Nord', 'Baoghin'],
    center: [12.3750, -1.5200] as [number, number],
  },
  arrondissement3: {
    nom: 'Arrondissement 3',
    quartiers: ['Naababpougo', 'Kienbaoghin', 'Zongo', 'Koumdayonré', 'Nonsin', 'Rimkièta', 'Tampouy', 'Kilwin'],
    center: [12.4000, -1.5400] as [number, number],
  },
  arrondissement4: {
    nom: 'Arrondissement 4',
    quartiers: ['Tanghin', 'Sambin', 'Somgandé', 'Zone industrielle', 'Nioko 2', 'Bendogo', 'Toukin'],
    center: [12.3900, -1.4900] as [number, number],
  },
  arrondissement5: {
    nom: 'Arrondissement 5',
    quartiers: ['Zogona', 'Wemtenga', 'Dagnoën', 'Ronsin', 'Kalgondin'],
    center: [12.3700, -1.4700] as [number, number],
  },
  arrondissement6: {
    nom: 'Arrondissement 6',
    quartiers: ['Cissin', 'Pissy'],
    center: [12.3300, -1.5600] as [number, number],
  },
  arrondissement7: {
    nom: 'Arrondissement 7',
    quartiers: ['Nagrin', 'Yaoghin', 'Sandogo', 'Kankasin', 'Boassa'],
    center: [12.3100, -1.5200] as [number, number],
  },
  arrondissement8: {
    nom: 'Arrondissement 8',
    quartiers: ['Zaghtouli', 'Zongo Nabitenga', 'Sogpèlcé', 'Bissighin', 'Bassinko', 'Dar-es-Salam', 'Silmiougou', 'Gantin'],
    center: [12.3500, -1.6200] as [number, number],
  },
  arrondissement9: {
    nom: 'Arrondissement 9',
    quartiers: ['Bangpooré', 'Larlé Wéogo', 'Marcoussis', 'Silmiyiri', 'Wob Riguéré', 'Ouapassi'],
    center: [12.3200, -1.4800] as [number, number],
  },
  arrondissement10: {
    nom: 'Arrondissement 10',
    quartiers: ['Kossodo', 'Wayalghin', 'Godin', 'Nioko 1', 'Dassasgho', 'Taabtenga'],
    center: [12.4000, -1.4600] as [number, number],
  },
  arrondissement11: {
    nom: 'Arrondissement 11',
    quartiers: ['Nongsin', 'Pagsin', 'Koubri', 'Saaba'],
    center: [12.3300, -1.4400] as [number, number],
  },
  arrondissement12: {
    nom: 'Arrondissement 12',
    quartiers: ["Patte d'Oie", 'Ouaga 2000', 'Trame Ouaga 2000'],
    center: [12.3200, -1.5500] as [number, number],
  },
};

// ─── Communes de Bamako ────────────────────────────────────────────────────
export const BAMAKO_COMMUNES = {
  commune1: {
    nom: 'Commune I',
    quartiers: ['Banconi', 'Boulkassombougou', 'Djélibougou', 'Doumanzana', 'Fadjiguila', 'Sotuba', 'Korofina Nord', 'Korofina Sud', 'Sikoroni'],
    center: [12.6700, -8.0200] as [number, number],
  },
  commune2: {
    nom: 'Commune II',
    quartiers: ['Niaréla', 'Bagadadji', 'Médina-Coura', 'Bozola', 'Missira', 'Hippodrome', 'Quinzambougou', 'Bakaribougou', 'TSF', 'Zone industrielle', 'Bougouba'],
    center: [12.6600, -7.9900] as [number, number],
  },
  commune3: {
    nom: 'Commune III',
    quartiers: ['Dar Salam', 'Ntomikorobougou', 'Wolofobougou', 'Centre commercial', 'Bamako-Coura', 'Dravela', 'Badialan I', 'Badialan II', 'Badialan III', 'Koulouba', 'Point G', 'ACI 2000'],
    center: [12.6500, -7.9800] as [number, number],
  },
  commune4: {
    nom: 'Commune IV',
    quartiers: ['Lafiabougou', 'Hamdallaye', 'Dogoudouma', 'Taliko', 'Lassa'],
    center: [12.6400, -8.0100] as [number, number],
  },
  commune5: {
    nom: 'Commune V',
    quartiers: ['Badalabougou', 'Sema I', 'Quartier Mali', 'Torokorobougou', 'Baco-Djicoroni', 'Sabalibougou', 'Daoudabougou', 'Kalaban-Coura'],
    center: [12.6200, -7.9600] as [number, number],
  },
  commune6: {
    nom: 'Commune VI',
    quartiers: ['Banankabougou', 'Djanékéla', 'Faladié', 'Magnambougou', 'Missabougou', 'Niamakoro', 'Sénou', 'Sogoniko', 'Sokorodji', 'Yrimadio'],
    center: [12.6000, -7.9400] as [number, number],
  },
};

/** Trouve l'arrondissement de Ouaga pour un quartier donné */
export function findArrondissement(quartier: string): number | undefined {
  for (const [key, arr] of Object.entries(OUAGADOUGOU_ARRONDISSEMENTS)) {
    if (arr.quartiers.includes(quartier)) {
      return Number(key.replace('arrondissement', ''));
    }
  }
  return undefined;
}

/** Trouve la commune de Bamako pour un quartier donné */
export function findCommune(quartier: string): string | undefined {
  for (const c of Object.values(BAMAKO_COMMUNES)) {
    if (c.quartiers.includes(quartier)) return c.nom;
  }
  return undefined;
}

// ─── 55 secteurs urbains de Ouagadougou (répartition par arrondissement) ───
export const OUAGADOUGOU_SECTEURS_BY_ARR: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5],
  2: [6, 7, 8, 9, 10],
  3: [11, 12, 13, 14, 15],
  4: [16, 17, 18, 19, 20],
  5: [21, 22, 23, 24, 25],
  6: [26, 27, 28, 29, 30],
  7: [31, 32, 33, 34],
  8: [35, 36, 37, 38, 39],
  9: [40, 41, 42, 43],
  10: [44, 45, 46, 47, 48],
  11: [49, 50, 51, 52],
  12: [53, 54, 55],
};

/** Renvoie l'arrondissement pour un secteur (1..55) */
export function findArrondissementForSecteur(secteur: number): number | undefined {
  for (const [arr, secs] of Object.entries(OUAGADOUGOU_SECTEURS_BY_ARR)) {
    if (secs.includes(secteur)) return Number(arr);
  }
  return undefined;
}

/** Renvoie un centre approximatif pour le secteur (basé sur le centre de son arrondissement + offset déterministe) */
export function getSecteurCenter(secteur: number): [number, number] {
  const arr = findArrondissementForSecteur(secteur);
  if (!arr) return CITIES.ouagadougou.center;
  const arrCfg = (OUAGADOUGOU_ARRONDISSEMENTS as any)[`arrondissement${arr}`];
  const base: [number, number] = arrCfg?.center ?? CITIES.ouagadougou.center;
  // offset déterministe en spirale autour du centre de l'arrondissement
  const idxInArr = OUAGADOUGOU_SECTEURS_BY_ARR[arr].indexOf(secteur);
  const angle = (idxInArr * 72) * (Math.PI / 180);
  const r = 0.012 + (idxInArr % 3) * 0.004;
  return [base[0] + Math.sin(angle) * r, base[1] + Math.cos(angle) * r];
}
