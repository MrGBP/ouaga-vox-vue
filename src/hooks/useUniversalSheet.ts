import { useRef, useState, useCallback, useEffect } from 'react';

const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 800);

const SNAP_VH = [0, 20, 45, 65, 80];
const getSnaps = () => SNAP_VH.map(v => Math.round(vh() * v / 100));

const SNAP_THRESHOLD_VH = 0.06;
const VELOCITY_THRESHOLD = 0.4; // px/ms

export function useUniversalSheet(initialSnapVh = 45) {
  const [height, setHeight] = useState(() => Math.round(vh() * initialSnapVh / 100));
  const [isAtMax, setIsAtMax] = useState(false);

  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const SNAP_MAX = Math.round(vh() * 0.80);
  const SNAP_MIN = 0;

  const clamp = (v: number) => Math.max(SNAP_MIN, Math.min(SNAP_MAX, v));

  const animateTo = useCallback((target: number) => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'height 320ms cubic-bezier(0.34, 1.2, 0.64, 1)';
    }
    setHeight(target);
    setIsAtMax(target >= SNAP_MAX - 4);
  }, [SNAP_MAX]);

  const snapNearest = useCallback((h: number, vel: number) => {
    const snaps = getSnaps();
    const threshold = vh() * SNAP_THRESHOLD_VH;

    // Fast swipe up → next snap
    if (vel > VELOCITY_THRESHOLD) {
      const higher = [...snaps].filter(s => s > h).sort((a, b) => a - b)[0];
      if (higher !== undefined) { animateTo(higher); return; }
    }
    // Fast swipe down → previous snap
    if (vel < -VELOCITY_THRESHOLD) {
      const lower = [...snaps].filter(s => s < h).sort((a, b) => b - a)[0];
      if (lower !== undefined) { animateTo(lower); return; }
    }

    // Magnetic snap to nearest if within threshold
    const nearest = snaps.reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
    if (Math.abs(nearest - h) < threshold) {
      animateTo(nearest);
    } else {
      // Stay at free position
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'height 100ms ease-out';
      }
      setIsAtMax(h >= SNAP_MAX - 4);
    }
  }, [animateTo, SNAP_MAX]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const content = contentRef.current;
    const fromHandle = (e.target as HTMLElement).closest('[data-handle]');
    // If not from handle and content is scrolled, don't drag
    if (!fromHandle && content && content.scrollTop > 2) return;

    dragging.current = true;
    startY.current = e.touches[0].clientY;
    startH.current = height;
    lastY.current = e.touches[0].clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, [height]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;

    const now = Date.now();
    const dy = lastY.current - e.touches[0].clientY;
    velocity.current = dy / Math.max(1, now - lastTime.current);
    lastY.current = e.touches[0].clientY;
    lastTime.current = now;

    const delta = startY.current - e.touches[0].clientY;
    const newH = clamp(startH.current + delta);
    setHeight(newH);
    setIsAtMax(newH >= SNAP_MAX - 4);

    e.preventDefault();
  }, [SNAP_MAX]);

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    snapNearest(height, velocity.current);
  }, [height, snapNearest]);

  // Sync internal scroll
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    if (isAtMax) {
      content.style.overflowY = 'auto';
      content.style.overscrollBehavior = 'contain';
    } else {
      content.style.overflowY = 'hidden';
      content.scrollTop = 0;
    }
  }, [isAtMax]);

  return {
    height,
    isAtMax,
    sheetRef,
    contentRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    animateTo,
    snapMid: () => animateTo(Math.round(vh() * 0.45)),
    snapMax: () => animateTo(Math.round(vh() * 0.80)),
    snapPeek: () => animateTo(Math.round(vh() * 0.20)),
    close: () => animateTo(0),
    SNAP_MAX,
    SNAP_MID: Math.round(vh() * 0.45),
    SNAP_PEEK: Math.round(vh() * 0.20),
    SNAP_MIN: 0,
  };
}
