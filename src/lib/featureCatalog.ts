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
  emoji: string;
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  { id: 'interieur',    label: 'Intérieur',           emoji: '🏠' },
  { id: 'exterieur',    label: 'Extérieur',           emoji: '🌳' },
  { id: 'securite',     label: 'Sécurité',            emoji: '🔒' },
  { id: 'energie',      label: 'Énergie & Eau',       emoji: '⚡' },
  { id: 'services',     label: 'Services',            emoji: '🛎️' },
  { id: 'residence',    label: 'Résidence / Accès',   emoji: '🏢' },
  { id: 'court_sejour', label: 'Court séjour',        emoji: '🏖️' },
];

export interface FeatureDef {
  key: string;
  label: string;
  emoji: string;
  category: FeatureCategoryId;
  /** Optionnel : ancien flag boolean équivalent sur Property (rétro-compat) */
  legacyFlag?: string;
}

export const FEATURE_CATALOG: FeatureDef[] = [
  // ── Intérieur
  { key: 'climatisation',     label: 'Climatisation',      emoji: '❄️', category: 'interieur', legacyFlag: 'has_ac' },
  { key: 'ventilateur',       label: 'Ventilateur',        emoji: '🌀', category: 'interieur' },
  { key: 'cuisine_equipee',   label: 'Cuisine équipée',    emoji: '🍳', category: 'interieur', legacyFlag: 'has_kitchen' },
  { key: 'frigo',             label: 'Frigo',              emoji: '🧊', category: 'interieur', legacyFlag: 'has_fridge' },
  { key: 'cuisiniere',        label: 'Cuisinière',         emoji: '🔥', category: 'interieur', legacyFlag: 'has_stove' },
  { key: 'tv',                label: 'Télévision',         emoji: '📺', category: 'interieur', legacyFlag: 'has_tv' },
  { key: 'meuble',            label: 'Meublé',             emoji: '🛋️', category: 'interieur' },
  { key: 'machine_laver',     label: 'Machine à laver',    emoji: '🧺', category: 'interieur' },

  // ── Extérieur
  { key: 'terrasse',          label: 'Terrasse',           emoji: '🏖️', category: 'exterieur', legacyFlag: 'has_terrace' },
  { key: 'balcon',            label: 'Balcon',             emoji: '🪟', category: 'exterieur' },
  { key: 'jardin',            label: 'Jardin',             emoji: '🌳', category: 'exterieur', legacyFlag: 'has_garden' },
  { key: 'piscine',           label: 'Piscine',            emoji: '🏊', category: 'exterieur', legacyFlag: 'has_pool' },
  { key: 'cour',              label: 'Cour intérieure',    emoji: '🟫', category: 'exterieur' },
  { key: 'vue_degagee',       label: 'Vue dégagée',        emoji: '🌄', category: 'exterieur' },

  // ── Sécurité
  { key: 'vigile',            label: 'Vigile / Gardien',   emoji: '🛡️', category: 'securite', legacyFlag: 'has_guardian' },
  { key: 'cameras',           label: 'Caméras',            emoji: '📹', category: 'securite', legacyFlag: 'has_cameras' },
  { key: 'cloture',           label: 'Clôture',            emoji: '🚧', category: 'securite', legacyFlag: 'has_fence' },
  { key: 'portail',           label: 'Portail',            emoji: '🚪', category: 'securite' },
  { key: 'portail_auto',      label: 'Portail automatique', emoji: '🤖', category: 'securite', legacyFlag: 'has_auto_gate' },
  { key: 'quartier_securise', label: 'Quartier sécurisé',  emoji: '🛟', category: 'securite' },
  { key: 'alarme',            label: 'Alarme',             emoji: '🚨', category: 'securite' },

  // ── Énergie & Eau
  { key: 'groupe_electrogene', label: 'Groupe électrogène', emoji: '⚡', category: 'energie', legacyFlag: 'has_generator' },
  { key: 'panneaux_solaires', label: 'Panneaux solaires',  emoji: '☀️', category: 'energie' },
  { key: 'eau_courante',      label: 'Eau courante',       emoji: '💧', category: 'energie', legacyFlag: 'has_water' },
  { key: 'forage',            label: 'Forage',             emoji: '🕳️', category: 'energie' },
  { key: 'chateau_eau',       label: "Château d'eau",      emoji: '🗼', category: 'energie', legacyFlag: 'has_water_tower' },
  { key: 'reservoir',         label: "Réservoir d'eau",    emoji: '🛢️', category: 'energie' },

  // ── Services
  { key: 'wifi',              label: 'Wi-Fi',              emoji: '📶', category: 'services', legacyFlag: 'has_internet' },
  { key: 'nettoyage',         label: 'Nettoyage',          emoji: '🧹', category: 'services' },
  { key: 'reception',         label: 'Réception',          emoji: '🛎️', category: 'services' },
  { key: 'service_hotelier',  label: 'Service hôtelier',   emoji: '🍽️', category: 'services' },
  { key: 'animaux_acceptes',  label: 'Animaux acceptés',   emoji: '🐾', category: 'services' },

  // ── Résidence / Accès
  { key: 'parking_int',       label: 'Parking intérieur',  emoji: '🚗', category: 'residence', legacyFlag: 'has_parking_int' },
  { key: 'parking_ext',       label: 'Parking extérieur',  emoji: '🅿️', category: 'residence', legacyFlag: 'has_parking_ext' },
  { key: 'ascenseur',         label: 'Ascenseur',          emoji: '🛗', category: 'residence' },
  { key: 'hall_accueil',      label: "Hall d'accueil",     emoji: '🏛️', category: 'residence' },
  { key: 'route_goudronnee',  label: 'Route goudronnée',   emoji: '🛣️', category: 'residence', legacyFlag: 'has_paved_road' },
  { key: 'salle_sport',       label: 'Salle de sport',     emoji: '🏋️', category: 'residence' },
  { key: 'pmr',               label: 'Accès PMR',          emoji: '♿', category: 'residence', legacyFlag: 'has_pmr' },
  { key: 'proche_transport',  label: 'Proche transport',   emoji: '🚌', category: 'residence' },
  { key: 'proche_commerces',  label: 'Proche commerces',   emoji: '🛒', category: 'residence' },
  { key: 'proche_ecoles',     label: 'Proche écoles',      emoji: '🏫', category: 'residence' },
  { key: 'proche_hopitaux',   label: 'Proche hôpitaux',    emoji: '🏥', category: 'residence' },

  // ── Court séjour
  { key: 'checkin_autonome',  label: 'Check-in autonome',  emoji: '🔑', category: 'court_sejour' },
  { key: 'linge_fourni',      label: 'Linge fourni',       emoji: '🛏️', category: 'court_sejour' },
  { key: 'kit_toilette',      label: 'Kit toilette',       emoji: '🧴', category: 'court_sejour' },
  { key: 'petit_dejeuner',    label: 'Petit-déjeuner',     emoji: '🥐', category: 'court_sejour' },
];

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

export function resolveFeatures(prop: Record<string, any>): ResolvedFeature[] {
  const seen = new Set<string>();
  const result: ResolvedFeature[] = [];

  // 1) Nouvelles features (clés du catalogue)
  const featureKeys: string[] = Array.isArray(prop.features) ? prop.features : [];
  for (const key of featureKeys) {
    const def = CATALOG_BY_KEY[key];
    if (def && !seen.has(def.key)) {
      seen.add(def.key);
      result.push({ key: def.key, label: def.label, emoji: def.emoji, category: def.category });
    }
  }

  // 2) Anciens flags has_*
  for (const [legacy, def] of Object.entries(CATALOG_BY_LEGACY)) {
    if (prop[legacy] && !seen.has(def.key)) {
      seen.add(def.key);
      result.push({ key: def.key, label: def.label, emoji: def.emoji, category: def.category });
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
