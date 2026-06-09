/**
 * MOCK_MODE — toggle global pour passer en mode démo (réactive toutes les
 * données mock : mockProperties, adminMockData, AIComparator, MobileCarousel,
 * VoiceSearch, etc.).
 *
 * Mode MVP production = false (par défaut).
 * Pour réactiver depuis la console : localStorage.setItem('sapsap_mock_mode','1');
 * Pour désactiver : localStorage.removeItem('sapsap_mock_mode');
 */
export const MOCK_MODE_BUILD: boolean = false;
const LS_KEY = 'sapsap_mock_mode';

export function isMockEnabled(): boolean {
  if (MOCK_MODE_BUILD) return true;
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
}

export function setMockEnabled(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(LS_KEY, '1');
    else localStorage.removeItem(LS_KEY);
  } catch {}
}
