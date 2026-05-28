import { useState, useEffect } from 'react';
import { CITIES, COUNTRY_TO_CITY, DEFAULT_CITY } from '@/lib/geoConfig';

const GEO_STORAGE_KEY = 'sapsap_selected_city';
const GEO_AUTO_DETECTED_KEY = 'sapsap_auto_detected';

type State = {
  activeCityId: string;
  isDetecting: boolean;
  hasManualOverride: boolean;
  wasAutoSwitched: boolean;
};

const initialId = (() => {
  if (typeof window === 'undefined') return DEFAULT_CITY;
  const saved = localStorage.getItem(GEO_STORAGE_KEY);
  return saved && CITIES[saved] ? saved : DEFAULT_CITY;
})();

const store: State = {
  activeCityId: initialId,
  isDetecting: true,
  hasManualOverride: !!(typeof window !== 'undefined' && localStorage.getItem(GEO_STORAGE_KEY)),
  wasAutoSwitched: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const setState = (patch: Partial<State>) => {
  Object.assign(store, patch);
  emit();
};

let detectionStarted = false;
const startDetection = () => {
  if (detectionStarted) return;
  detectionStarted = true;
  if (store.hasManualOverride) {
    setState({ isDetecting: false });
    return;
  }
  fetch('https://ipapi.co/json/')
    .then((r) => r.json())
    .then((data) => {
      const cc = data?.country_code;
      const cityId = cc && COUNTRY_TO_CITY[cc];
      if (cityId && CITIES[cityId]) {
        const auto = cityId !== DEFAULT_CITY && !sessionStorage.getItem(GEO_AUTO_DETECTED_KEY);
        if (auto) sessionStorage.setItem(GEO_AUTO_DETECTED_KEY, '1');
        setState({ activeCityId: cityId, wasAutoSwitched: auto, isDetecting: false });
      } else {
        setState({ isDetecting: false });
      }
    })
    .catch(() => setState({ isDetecting: false }));
};

export function useGeoCity() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    startDetection();
    return () => { listeners.delete(l); };
  }, []);

  const setActiveCity = (cityId: string) => {
    if (!CITIES[cityId]) return;
    localStorage.setItem(GEO_STORAGE_KEY, cityId);
    setState({ activeCityId: cityId, hasManualOverride: true, wasAutoSwitched: false });
  };

  const resetToAuto = () => {
    localStorage.removeItem(GEO_STORAGE_KEY);
    sessionStorage.removeItem(GEO_AUTO_DETECTED_KEY);
    setState({ hasManualOverride: false });
    window.location.reload();
  };

  return {
    activeCity: CITIES[store.activeCityId],
    setActiveCity,
    resetToAuto,
    isDetecting: store.isDetecting,
    hasManualOverride: store.hasManualOverride,
    wasAutoSwitched: store.wasAutoSwitched,
    dismissAutoSwitchBanner: () => setState({ wasAutoSwitched: false }),
    availableCities: Object.values(CITIES),
  };
}
