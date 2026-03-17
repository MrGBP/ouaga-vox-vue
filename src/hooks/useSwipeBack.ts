import { useEffect, useRef } from 'react';
import { useNav } from '@/contexts/NavigationContext';

export function useSwipeBack() {
  const { pop, canGoBack } = useNav();
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!canGoBack) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
      // Swipe from left edge (< 30px) → right (> 80px)
      if (startX.current < 30 && dx > 80 && dy < 60) pop();
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [canGoBack, pop]);
}
