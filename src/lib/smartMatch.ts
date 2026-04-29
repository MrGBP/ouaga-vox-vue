/**
 * Smart matching utilities for natural-language search.
 * - Tolerance to typos (Levenshtein distance)
 * - Synonyms (clim/climatisé/ac, meublé/furnished/equipé...)
 * - Multi-mot AND logic (each token must match at least one field)
 * - Number extraction (prix max, surface min, chambres)
 */

import type { Property } from '@/lib/mockData';
import { getTypeLabel, isTypeFurnished } from '@/lib/mockData';

// ─── Normalisation : minuscules + sans accents + sans ponctuation ─────────
const normalize = (s: string): string =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s²]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ─── Distance de Levenshtein (compacte) ────────────────────────────────────
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr.push(Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost));
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Vrai si le token correspond (substring OU faute mineure) au mot cible. */
function fuzzyEq(token: string, target: string): boolean {
  if (!token || !target) return false;
  if (target.includes(token) || token.includes(target)) return true;
  // Tolérance: 1 faute pour ≤4 lettres, 2 fautes pour 5-7, 3 pour 8+
  const tol = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3;
  return levenshtein(token, target) <= tol;
}

// ─── Synonymes / mots-clés métier ──────────────────────────────────────────
type SynRule = {
  syns: string[];                // ce qu'on cherche (déjà normalisé)
  match: (p: Property) => boolean;
  /** Étiquette humaine pour récap "j'ai compris" */
  label: string;
};

const SYNONYMS: SynRule[] = [
  // Types
  { syns: ['villa', 'maison'], match: p => /villa|maison/.test(p.type), label: 'Maison / Villa' },
  { syns: ['appart', 'appartement', 'apparts'], match: p => /appartement/.test(p.type), label: 'Appartement' },
  { syns: ['studio'], match: p => /studio/.test(p.type), label: 'Studio' },
  { syns: ['bureau', 'bureaux', 'office'], match: p => p.type === 'bureau', label: 'Bureau' },
  { syns: ['commerce', 'commercial', 'boutique', 'magasin', 'local'], match: p => p.type === 'local_commercial', label: 'Local commercial' },
  { syns: ['meuble', 'meublee', 'furnished', 'equipe', 'equipee'], match: p => !!p.furnished || isTypeFurnished(p.type), label: 'Meublé' },
  { syns: ['simple', 'vide', 'nonmeuble'], match: p => !p.furnished && !isTypeFurnished(p.type), label: 'Non meublé' },
  // Équipements
  { syns: ['clim', 'climatise', 'climatisee', 'climatisation', 'ac'], match: p => !!p.has_ac, label: 'Climatisation' },
  { syns: ['wifi', 'internet', 'connexion'], match: p => !!p.has_internet, label: 'WiFi' },
  { syns: ['piscine', 'pool'], match: p => !!p.has_pool, label: 'Piscine' },
  { syns: ['gardien', 'securite', 'securise', 'guard'], match: p => !!p.has_guardian, label: 'Gardien' },
  { syns: ['parking', 'garage'], match: p => !!p.has_parking_int || !!p.has_parking_ext, label: 'Parking' },
  { syns: ['groupe', 'electrogene', 'generateur'], match: p => !!p.has_generator, label: 'Groupe électrogène' },
  { syns: ['eau'], match: p => !!p.has_water, label: 'Eau courante' },
  { syns: ['chateau'], match: p => !!p.has_water_tower, label: "Château d'eau" },
  { syns: ['terrasse', 'balcon'], match: p => !!p.has_terrace, label: 'Terrasse' },
  { syns: ['jardin', 'cour'], match: p => !!p.has_garden, label: 'Jardin' },
  { syns: ['cloture', 'cloturee', 'mur'], match: p => !!p.has_fence, label: 'Clôturé' },
  { syns: ['camera', 'cameras', 'surveillance'], match: p => !!p.has_cameras, label: 'Caméras' },
  { syns: ['portail', 'auto'], match: p => !!p.has_auto_gate, label: 'Portail auto' },
  { syns: ['goudronne', 'goudronnee', 'bitume', 'asphalte'], match: p => !!p.has_paved_road, label: 'Route goudronnée' },
  { syns: ['cuisine'], match: p => !!p.has_kitchen, label: 'Cuisine équipée' },
  { syns: ['frigo', 'refrigerateur'], match: p => !!p.has_fridge, label: 'Réfrigérateur' },
  { syns: ['tv', 'television', 'tele'], match: p => !!p.has_tv, label: 'TV' },
  { syns: ['neuf', 'nouveau', 'recent'], match: p => !!p.is_new_build, label: 'Neuf' },
  { syns: ['renove', 'renovee'], match: p => !!p.is_renovated, label: 'Rénové' },
  { syns: ['animaux', 'chien', 'chat', 'pets'], match: p => !!p.pets_allowed, label: 'Animaux acceptés' },
];

/** Rendu humain de ce que l'IA-locale a compris. */
export interface ParsedQuery {
  rawQuery: string;
  /** Quartiers détectés. */
  quartiers: string[];
  /** Critères équipements/types détectés (label humain). */
  criteria: string[];
  /** Nombre de chambres minimum détecté (ex: "3 chambres"). */
  minBedrooms?: number;
  /** Surface minimum en m² (ex: "60m²"). */
  minSurface?: number;
  /** Prix maximum (ex: "moins de 150 000"). */
  maxPrice?: number;
}

/** Parse une requête en langage naturel. */
export function parseQuery(query: string, allQuartiers: string[]): ParsedQuery {
  const norm = normalize(query);
  const tokens = norm.split(' ').filter(Boolean);
  const result: ParsedQuery = { rawQuery: query, quartiers: [], criteria: [] };

  // Quartiers (matching fuzzy sur le nom complet — chaque quartier peut avoir 1-2 mots)
  const quartiersFound = new Set<string>();
  for (const q of allQuartiers) {
    const qNorm = normalize(q);
    if (norm.includes(qNorm)) { quartiersFound.add(q); continue; }
    // Fuzzy mot-à-mot pour rattraper les fautes
    const qWords = qNorm.split(' ');
    if (qWords.every(w => tokens.some(t => fuzzyEq(t, w) && t.length >= 3))) {
      quartiersFound.add(q);
    }
  }
  result.quartiers = [...quartiersFound];

  // Synonymes (criteria)
  const usedTokens = new Set<string>();
  for (const rule of SYNONYMS) {
    const hit = tokens.some(t => rule.syns.some(s => fuzzyEq(t, s)));
    if (hit) {
      result.criteria.push(rule.label);
      tokens.forEach(t => { if (rule.syns.some(s => fuzzyEq(t, s))) usedTokens.add(t); });
    }
  }

  // Nombre de chambres : "3 chambres", "3ch", "2 ch"
  const bedM = norm.match(/(\d+)\s*(?:ch|chambre|chambres|piece|pieces)\b/);
  if (bedM) result.minBedrooms = parseInt(bedM[1], 10);

  // Surface : "60m²", "60 m2", "60m"
  const surfM = norm.match(/(\d{2,4})\s*m(?:2|²)?\b/);
  if (surfM) result.minSurface = parseInt(surfM[1], 10);

  // Prix max : "moins de 150 000", "max 200000", "<150000"
  const priceM = norm.match(/(?:moins de|max|maximum|inferieur a|<)\s*(\d[\d\s]*)/);
  if (priceM) {
    const n = parseInt(priceM[1].replace(/\s+/g, ''), 10);
    if (!isNaN(n) && n > 1000) result.maxPrice = n;
  }

  return result;
}

/** Filtre les biens en utilisant la requête parsée + match libre tolérant. */
export function smartFilter(properties: Property[], query: string, allQuartiers: string[]): Property[] {
  const parsed = parseQuery(query, allQuartiers);
  const norm = normalize(query);
  const tokens = norm.split(' ').filter(t => t.length >= 2);

  // Si rien d'extrait et requête vide → tout retourner
  if (!norm) return properties;

  return properties.filter(p => {
    // 1) Quartiers détectés : OR
    if (parsed.quartiers.length > 0 && !parsed.quartiers.includes(p.quartier)) return false;
    // 2) Critères/équipements : AND (tous doivent matcher)
    for (const label of parsed.criteria) {
      const rule = SYNONYMS.find(r => r.label === label);
      if (rule && !rule.match(p)) return false;
    }
    // 3) Min chambres
    if (parsed.minBedrooms && (p.bedrooms || 0) < parsed.minBedrooms) return false;
    // 4) Surface min
    if (parsed.minSurface && (p.surface_area || 0) < parsed.minSurface) return false;
    // 5) Prix max
    if (parsed.maxPrice && p.price > parsed.maxPrice) return false;

    // 6) Tokens "libres" (mots non capturés) : doivent matcher quelque part
    //    On ne pénalise que les tokens qui ne sont pas des nombres/unités déjà utilisées.
    const freeTokens = tokens.filter(t => {
      if (/^\d+$/.test(t)) return false;
      if (['de', 'a', 'au', 'la', 'le', 'les', 'des', 'du', 'et', 'ou', 'avec', 'sans', 'pour', 'm', 'm2', 'fcfa', 'ch', 'chambre', 'chambres', 'moins', 'max'].includes(t)) return false;
      // Déjà capturé par un synonyme ?
      if (SYNONYMS.some(r => r.syns.some(s => fuzzyEq(t, s)))) return false;
      // Déjà capturé par un quartier ?
      if (parsed.quartiers.some(q => normalize(q).includes(t))) return false;
      return true;
    });

    if (freeTokens.length === 0) return true;

    const haystack = normalize(
      [p.title, p.quartier, getTypeLabel(p.type), p.description || '', String(p.price)].join(' ')
    );
    const haystackWords = haystack.split(' ');
    return freeTokens.every(tok =>
      haystack.includes(tok) || haystackWords.some(w => fuzzyEq(tok, w))
    );
  });
}

/** Construit une phrase humaine "J'ai compris : ..." */
export function describeParsed(parsed: ParsedQuery): string {
  const parts: string[] = [];
  if (parsed.criteria.length) parts.push(parsed.criteria.join(' · '));
  if (parsed.minBedrooms) parts.push(`${parsed.minBedrooms} chambre${parsed.minBedrooms > 1 ? 's' : ''} min`);
  if (parsed.minSurface) parts.push(`${parsed.minSurface} m² min`);
  if (parsed.maxPrice) parts.push(`max ${new Intl.NumberFormat('fr-FR').format(parsed.maxPrice)} FCFA`);
  if (parsed.quartiers.length) parts.push(`à ${parsed.quartiers.join(' ou ')}`);
  return parts.join(' · ');
}
