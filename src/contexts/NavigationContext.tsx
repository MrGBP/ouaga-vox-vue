import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type NavScreen =
  | 'carte-niveau1'
  | 'carte-niveau2'
  | 'carte-niveau3'
  | 'accueil'
  | 'recherche'
  | 'recherche-resultats'
  | 'bien-detail'
  | 'favoris-liste'
  | 'favoris-carte'
  | 'profil'
  | 'reservation'
  | '360-viewer'
  | 'video-viewer';

export interface NavState {
  screen: NavScreen;
  quartierName?: string;
  quartierCount?: number;
  propertyTitle?: string;
  propertyQuartier?: string;
  propertyId?: string;
  searchQuery?: string;
  resultCount?: number;
  reservationStep?: number;
}

interface NavContextType {
  current: NavState;
  stack: NavState[];
  push: (state: NavState) => void;
  pop: () => void;
  popToRoot: () => void;
  canGoBack: boolean;
  depth: number;
}

const NavigationContext = createContext<NavContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<NavState[]>([
    { screen: 'carte-niveau1' }
  ]);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;
  const depth = stack.length;

  const push = useCallback((s: NavState) => {
    setStack(p => [...p, s]);
    window.history.pushState(null, '', window.location.href);
  }, []);

  const pop = useCallback(() => {
    setStack(p => p.length > 1 ? p.slice(0, -1) : p);
  }, []);

  const popToRoot = useCallback(() => {
    setStack([{ screen: 'carte-niveau1' }]);
  }, []);

  // Android back button
  useEffect(() => {
    const handle = () => {
      if (stack.length > 1) {
        pop();
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [stack.length, pop]);

  return (
    <NavigationContext.Provider value={{ current, stack, push, pop, popToRoot, canGoBack, depth }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNav must be used within NavigationProvider');
  return ctx;
}
