import { isTypeFurnished } from './mockData';

export function furnishedSuggestionProperties<T extends { type: string; furnished?: boolean; status?: string; available?: boolean }>(properties: T[]): T[] {
  return properties.filter(p => p.status !== 'rented' && p.available !== false &&
    (p.furnished === true || isTypeFurnished(p.type) || p.type === 'villa_meublee'));
}