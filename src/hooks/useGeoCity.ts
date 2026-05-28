import { useState, useEffect } from 'react';
import { CITIES, COUNTRY_TO_CITY, DEFAULT_CITY } from '@/lib/geoConfig';

const GEO_STORAGE_KEY = 'sapsap_selected_city';
const GEO_AUTO_DETECTED_KEY = 'sapsap_auto_detected';

export function useGeoCity() {
  const [activeCity, setActiveCityState] = useState(CITIES[DEFAULT_CITY]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const [wasAutoSwitched, setWasAutoSwitched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(GEO_STORAGE_KEY);
    if (saved && CITIES[saved]) {
      setActiveCityState(CITIES[saved]);
      setHasManualOverride(true);
      setIsDetecting(false);
      return;
    }

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        const countryCode = data?.country_code;
        const cityId = countryCode && COUNTRY_TO_CITY[countryCode];
        if (cityId && CITIES[cityId]) {
          setActiveCityState(CITIES[cityId]);
          if (cityId !== DEFAULT_CITY && !sessionStorage.getItem(GEO_AUTO_DETECTED_KEY)) {
            setWasAutoSwitched(true);
            sessionStorage.setItem(GEO_AUTO_DETECTED_KEY, '1');
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsDetecting(false));
  }, []);

  const setActiveCity = (cityId: string) => {
    if (!CITIES[cityId]) return;
    localStorage.setItem(GEO_STORAGE_KEY, cityId);
    setActiveCityState(CITIES[cityId]);
    setHasManualOverride(true);
    setWasAutoSwitched(false);
  };

  const resetToAuto = () => {
    localStorage.removeItem(GEO_STORAGE_KEY);
    sessionStorage.removeItem(GEO_AUTO_DETECTED_KEY);
    setHasManualOverride(false);
    window.location.reload();
  };

  return {
    activeCity,
    setActiveCity,
    resetToAuto,
    isDetecting,
    hasManualOverride,
    wasAutoSwitched,
    dismissAutoSwitchBanner: () => setWasAutoSwitched(false),
    availableCities: Object.values(CITIES),
  };
}
