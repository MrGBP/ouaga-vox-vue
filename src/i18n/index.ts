import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';

const STORAGE_KEY = 'sapsap_lang';
const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: saved === 'en' ? 'en' : 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
