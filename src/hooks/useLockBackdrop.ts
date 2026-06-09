import { useEffect } from 'react';

/**
 * Quand `open` passe à true :
 *  - empêche le scroll de la page,
 *  - masque les contrôles Leaflet pour éviter qu'ils ne percent les modals.
 * Restaure tout à la fermeture ou au démontage.
 */
export function useLockBackdrop(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = document.querySelectorAll<HTMLElement>(
      '.leaflet-control, .leaflet-top, .leaflet-bottom'
    );
    const prevVis: Array<[HTMLElement, string]> = [];
    controls.forEach(el => { prevVis.push([el, el.style.visibility]); el.style.visibility = 'hidden'; });
    return () => {
      document.body.style.overflow = prevOverflow;
      prevVis.forEach(([el, v]) => { el.style.visibility = v; });
    };
  }, [open]);
}
