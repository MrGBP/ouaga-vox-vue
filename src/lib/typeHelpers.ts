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
