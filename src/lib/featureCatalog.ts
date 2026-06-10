// SapSapHouse — Catalogue centralisé des caractéristiques
// Architecture extensible : on stocke des clés (string[]) dans Property.features
// + Property.customFeatures (string[]) pour libellés libres tapés par l'admin.
// Rétro-compat : les anciens flags has_* sont automatiquement convertis.

export type FeatureCategoryId =
  | 'interieur'
  | 'exterieur'
  | 'securite'
  | 'energie'
  | 'services'
  | 'residence'
  | 'court_sejour';

export interface FeatureCategory {
  id: FeatureCategoryId;
  label: string;
  labelEn: string;
  emoji: string;
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  { id: 'interieur',    label: 'Intérieur',           labelEn: 'Interior',          emoji: '🏠' },
  { id: 'exterieur',    label: 'Extérieur',           labelEn: 'Exterior',          emoji: '🌳' },
  { id: 'securite',     label: 'Sécurité',            labelEn: 'Security',          emoji: '🔒' },
  { id: 'energie',      label: 'Énergie & Eau',       labelEn: 'Energy & Water',    emoji: '⚡' },
  { id: 'services',     label: 'Services',            labelEn: 'Services',          emoji: '🛎️' },
  { id: 'residence',    label: 'Résidence / Accès',   labelEn: 'Residence / Access', emoji: '🏢' },
  { id: 'court_sejour', label: 'Court séjour',        labelEn: 'Short stay',        emoji: '🏖️' },
];

export interface FeatureDef {
  key: string;
  label: string;
  labelEn: string;
  emoji: string;
  category: FeatureCategoryId;
  /** Optionnel : ancien flag boolean équivalent sur Property (rétro-compat) */
  legacyFlag?: string;
}

export const FEATURE_CATALOG: FeatureDef[] = [
  // ── Intérieur
  { key: 'climatisation',     label: 'Climatisation',      labelEn: 'Air conditioning',    emoji: '❄️', category: 'interieur', legacyFlag: 'has_ac' },
  { key: 'ventilateur',       label: 'Ventilateur',        labelEn: 'Fan',                 emoji: '🌀', category: 'interieur' },
  { key: 'cuisine_equipee',   label: 'Cuisine équipée',    labelEn: 'Equipped kitchen',    emoji: '🍳', category: 'interieur', legacyFlag: 'has_kitchen' },
  { key: 'frigo',             label: 'Frigo',              labelEn: 'Fridge',              emoji: '🧊', category: 'interieur', legacyFlag: 'has_fridge' },
  { key: 'cuisiniere',        label: 'Cuisinière',         labelEn: 'Stove',               emoji: '🔥', category: 'interieur', legacyFlag: 'has_stove' },
  { key: 'tv',                label: 'Télévision',         labelEn: 'TV',                  emoji: '📺', category: 'interieur', legacyFlag: 'has_tv' },
  { key: 'meuble',            label: 'Meublé',             labelEn: 'Furnished',           emoji: '🛋️', category: 'interieur' },
  { key: 'machine_laver',     label: 'Machine à laver',    labelEn: 'Washing machine',     emoji: '🧺', category: 'interieur' },

  // ── Extérieur
  { key: 'terrasse',          label: 'Terrasse',           labelEn: 'Terrace',             emoji: '🏖️', category: 'exterieur', legacyFlag: 'has_terrace' },
  { key: 'balcon',            label: 'Balcon',             labelEn: 'Balcony',             emoji: '🪟', category: 'exterieur' },
  { key: 'jardin',            label: 'Jardin',             labelEn: 'Garden',              emoji: '🌳', category: 'exterieur', legacyFlag: 'has_garden' },
  { key: 'piscine',           label: 'Piscine',            labelEn: 'Swimming pool',       emoji: '🏊', category: 'exterieur', legacyFlag: 'has_pool' },
  { key: 'cour',              label: 'Cour intérieure',    labelEn: 'Inner courtyard',     emoji: '🟫', category: 'exterieur' },
  { key: 'vue_degagee',       label: 'Vue dégagée',        labelEn: 'Open view',           emoji: '🌄', category: 'exterieur' },

  // ── Sécurité
  { key: 'vigile',            label: 'Vigile / Gardien',   labelEn: 'Security guard',      emoji: '🛡️', category: 'securite', legacyFlag: 'has_guardian' },
  { key: 'cameras',           label: 'Caméras',            labelEn: 'CCTV cameras',        emoji: '📹', category: 'securite', legacyFlag: 'has_cameras' },
  { key: 'cloture',           label: 'Clôture',            labelEn: 'Fence',               emoji: '🚧', category: 'securite', legacyFlag: 'has_fence' },
  { key: 'portail',           label: 'Portail',            labelEn: 'Gate',                emoji: '🚪', category: 'securite' },
  { key: 'portail_auto',      label: 'Portail automatique', labelEn: 'Automatic gate',     emoji: '🤖', category: 'securite', legacyFlag: 'has_auto_gate' },
  { key: 'quartier_securise', label: 'Quartier sécurisé',  labelEn: 'Secure neighborhood', emoji: '🛟', category: 'securite' },
  { key: 'alarme',            label: 'Alarme',             labelEn: 'Alarm',               emoji: '🚨', category: 'securite' },

  // ── Énergie & Eau
  { key: 'groupe_electrogene', label: 'Groupe électrogène', labelEn: 'Backup generator',  emoji: '⚡', category: 'energie', legacyFlag: 'has_generator' },
  { key: 'panneaux_solaires', label: 'Panneaux solaires',  labelEn: 'Solar panels',        emoji: '☀️', category: 'energie' },
  { key: 'eau_courante',      label: 'Eau courante',       labelEn: 'Running water',       emoji: '💧', category: 'energie', legacyFlag: 'has_water' },
  { key: 'forage',            label: 'Forage',             labelEn: 'Borehole',            emoji: '🕳️', category: 'energie' },
  { key: 'chateau_eau',       label: "Château d'eau",      labelEn: 'Water tower',         emoji: '🗼', category: 'energie', legacyFlag: 'has_water_tower' },
  { key: 'reservoir',         label: "Réservoir d'eau",    labelEn: 'Water tank',          emoji: '🛢️', category: 'energie' },

  // ── Services
  { key: 'wifi',              label: 'Wi-Fi',              labelEn: 'Wi-Fi',               emoji: '📶', category: 'services', legacyFlag: 'has_internet' },
  { key: 'nettoyage',         label: 'Nettoyage',          labelEn: 'Cleaning service',    emoji: '🧹', category: 'services' },
  { key: 'reception',         label: 'Réception',          labelEn: 'Reception',           emoji: '🛎️', category: 'services' },
  { key: 'service_hotelier',  label: 'Service hôtelier',   labelEn: 'Hotel service',       emoji: '🍽️', category: 'services' },
  { key: 'animaux_acceptes',  label: 'Animaux acceptés',   labelEn: 'Pets allowed',        emoji: '🐾', category: 'services' },

  // ── Résidence / Accès
  { key: 'parking_int',       label: 'Parking intérieur',  labelEn: 'Indoor parking',      emoji: '🚗', category: 'residence', legacyFlag: 'has_parking_int' },
  { key: 'parking_ext',       label: 'Parking extérieur',  labelEn: 'Outdoor parking',     emoji: '🅿️', category: 'residence', legacyFlag: 'has_parking_ext' },
  { key: 'ascenseur',         label: 'Ascenseur',          labelEn: 'Elevator',            emoji: '🛗', category: 'residence' },
  { key: 'hall_accueil',      label: "Hall d'accueil",     labelEn: 'Lobby',               emoji: '🏛️', category: 'residence' },
  { key: 'route_goudronnee',  label: 'Route goudronnée',   labelEn: 'Paved road',          emoji: '🛣️', category: 'residence', legacyFlag: 'has_paved_road' },
  { key: 'salle_sport',       label: 'Salle de sport',     labelEn: 'Gym',                 emoji: '🏋️', category: 'residence' },
  { key: 'pmr',               label: 'Accès PMR',          labelEn: 'Wheelchair access',   emoji: '♿', category: 'residence', legacyFlag: 'has_pmr' },
  { key: 'proche_transport',  label: 'Proche transport',   labelEn: 'Near transport',      emoji: '🚌', category: 'residence' },
  { key: 'proche_commerces',  label: 'Proche commerces',   labelEn: 'Near shops',          emoji: '🛒', category: 'residence' },
  { key: 'proche_ecoles',     label: 'Proche écoles',      labelEn: 'Near schools',        emoji: '🏫', category: 'residence' },
  { key: 'proche_hopitaux',   label: 'Proche hôpitaux',    labelEn: 'Near hospitals',      emoji: '🏥', category: 'residence' },

  // ── Court séjour
  { key: 'checkin_autonome',  label: 'Check-in autonome',  labelEn: 'Self check-in',       emoji: '🔑', category: 'court_sejour' },
  { key: 'linge_fourni',      label: 'Linge fourni',       labelEn: 'Linen provided',      emoji: '🛏️', category: 'court_sejour' },
  { key: 'kit_toilette',      label: 'Kit toilette',       labelEn: 'Toiletries kit',      emoji: '🧴', category: 'court_sejour' },
  { key: 'petit_dejeuner',    label: 'Petit-déjeuner',     labelEn: 'Breakfast',           emoji: '🥐', category: 'court_sejour' },
];

/** Renvoie le label localisé d'une catégorie / feature. */
export const featureLabel = (f: { label: string; labelEn: string }, lang?: string) =>
  lang === 'en' ? f.labelEn : f.label;
export const categoryLabel = featureLabel;

const CATALOG_BY_KEY: Record<string, FeatureDef> = Object.fromEntries(
  FEATURE_CATALOG.map(f => [f.key, f])
);

const CATALOG_BY_LEGACY: Record<string, FeatureDef> = Object.fromEntries(
  FEATURE_CATALOG.filter(f => f.legacyFlag).map(f => [f.legacyFlag!, f])
);

export const getFeatureDef = (key: string): FeatureDef | undefined => CATALOG_BY_KEY[key];

/**
 * Convertit un objet Property (qui peut contenir features?: string[],
 * customFeatures?: string[] ET les anciens has_*) en liste d'items à afficher.
 * Dédupliqué, ordre catalogue puis custom.
 */
export interface ResolvedFeature {
  key: string;
  label: string;
  emoji: string;
  category: FeatureCategoryId | 'autre';
  isCustom?: boolean;
}

export function resolveFeatures(prop: Record<string, any>, lang?: string): ResolvedFeature[] {
  const pickLabel = (def: FeatureDef) => featureLabel(def, lang);
  const seen = new Set<string>();
  const result: ResolvedFeature[] = [];

  // 1) Nouvelles features (clés du catalogue)
  const featureKeys: string[] = Array.isArray(prop.features) ? prop.features : [];
  for (const key of featureKeys) {
    const def = CATALOG_BY_KEY[key];
    if (def && !seen.has(def.key)) {
      seen.add(def.key);
      result.push({ key: def.key, label: pickLabel(def), emoji: def.emoji, category: def.category });
    }
  }

  // 2) Anciens flags has_*
  for (const [legacy, def] of Object.entries(CATALOG_BY_LEGACY)) {
    if (prop[legacy] && !seen.has(def.key)) {
      seen.add(def.key);
      result.push({ key: def.key, label: pickLabel(def), emoji: def.emoji, category: def.category });
    }
  }

  // 3) Features libres (customFeatures)
  const custom: string[] = Array.isArray(prop.customFeatures) ? prop.customFeatures : [];
  for (const label of custom) {
    const trimmed = String(label).trim();
    if (!trimmed) continue;
    const k = `custom:${trimmed.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    result.push({ key: k, label: trimmed, emoji: '✨', category: 'autre', isCustom: true });
  }

  // Tri : par ordre des catégories du catalogue, puis custom à la fin
  const catOrder: Record<string, number> = Object.fromEntries(
    FEATURE_CATEGORIES.map((c, i) => [c.id, i])
  );
  catOrder['autre'] = FEATURE_CATEGORIES.length;
  result.sort((a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99));

  return result;
}

/** Retourne les clés actuellement actives pour un Property (pour pré-cocher un form). */
export function extractActiveFeatureKeys(prop: Record<string, any>): string[] {
  const set = new Set<string>();
  const featureKeys: string[] = Array.isArray(prop.features) ? prop.features : [];
  featureKeys.forEach(k => CATALOG_BY_KEY[k] && set.add(k));
  for (const [legacy, def] of Object.entries(CATALOG_BY_LEGACY)) {
    if (prop[legacy]) set.add(def.key);
  }
  return Array.from(set);
}
