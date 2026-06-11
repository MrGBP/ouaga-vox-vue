import { isTypeFurnished } from '@/lib/mockData';

export const OFFICE_TYPES = ['bureau'] as const;
export const COMMERCIAL_TYPES = ['bureau', 'local_commercial', 'commerce'] as const;

export const isOfficeType = (type: string): boolean =>
  (OFFICE_TYPES as readonly string[]).includes(type);

export const isCommercialType = (type: string): boolean =>
  (COMMERCIAL_TYPES as readonly string[]).includes(type);

/**
 * Mode d'action affiché sur la fiche bien :
 *  - 'reserve'  → meublé courte durée (calendrier + Réserver)
 *  - 'visit'    → non meublé longue durée (Demander une visite)
 *  - 'contact'  → bureau/local commercial (Contacter + Planifier visite)
 */
export type ActionMode = 'reserve' | 'visit' | 'contact';

export function getActionMode(type: string, furnishedFlag?: boolean): ActionMode {
  if (isCommercialType(type)) return 'contact';
  if (isTypeFurnished(type) || furnishedFlag) return 'reserve';
  return 'visit';
}

/**
 * Cadence de facturation d'un bien meublé :
 *  - 'nuit' : courte durée (par défaut BF/ML pour meublé)
 *  - 'mois' : moyenne/longue durée (par défaut Ghana, ou si propriétaire l'a explicité)
 * Le propriétaire peut forcer la valeur via `features.__rent_mode`.
 */
export type RentMode = 'nuit' | 'mois';

export function getRentMode(p: {
  type?: string;
  furnished?: boolean | null;
  country_code?: string | null;
  features?: any;
}): RentMode {
  const stored = (p?.features?.__rent_mode) as RentMode | undefined;
  if (stored === 'nuit' || stored === 'mois') return stored;
  const furn = isTypeFurnished(p?.type ?? '') || !!p?.furnished;
  if (!furn) return 'mois';
  const cc = (p?.country_code || 'BF').toUpperCase();
  if (cc === 'GH') return 'mois';
  return 'nuit';
}

