import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeoCity } from '@/hooks/useGeoCity';

const MANUAL_KEY = 'sapsap_lang_manual';

/**
 * Synchronise la langue de l'interface avec le pays actif.
 * Burkina/Mali → fr, Ghana → en. Respecte un choix manuel utilisateur
 * (LanguageSwitcher pose la clé `sapsap_lang_manual`).
 */
export function useCountryLocale() {
  const { activeCity } = useGeoCity();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!activeCity) return;
    const manual = typeof window !== 'undefined' && localStorage.getItem(MANUAL_KEY) === '1';
    if (manual) return;
    const target = activeCity.language === 'en' ? 'en' : 'fr';
    if (i18n.language !== target) i18n.changeLanguage(target);
  }, [activeCity?.id, i18n]);
}

export const LANG_MANUAL_KEY = MANUAL_KEY;
