import { useRef, useState, useCallback, useEffect } from 'react';

const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 800);

const SNAP_VH = [0, 15, 40, 58, 75, 90];
const getSnaps = () => SNAP_VH.map(v => Math.round(vh() * v / 100));

const SNAP_THRESHOLD_VH = 0.05;
const VELOCITY_THRESHOLD = 0.4; // px/ms

export function useUniversalSheet(initialSnapVh = 40) {
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

  const SNAP_PAGE = Math.round(vh() * 0.90);
  const SNAP_MAX = Math.round(vh() * 0.75);
  const SNAP_MID = Math.round(vh() * 0.58);
  const SNAP_DEFAULT = Math.round(vh() * 0.40);
  const SNAP_PEEK = Math.round(vh() * 0.15);
  const SNAP_MIN = 0;

  const clamp = (v: number) => Math.max(SNAP_MIN, Math.min(SNAP_PAGE, v));

  const isPageMode = height >= SNAP_PAGE - 4;

  const animateTo = useCallback((target: number) => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'height 300ms cubic-bezier(0.34, 1.2, 0.64, 1)';
    }
    setHeight(target);
    setIsAtMax(target >= SNAP_MAX - 4);
  }, [SNAP_MAX]);

  const snapNearest = useCallback((h: number, vel: number) => {
    const snaps = getSnaps();
    const threshold = vh() * SNAP_THRESHOLD_VH;

    if (vel > VELOCITY_THRESHOLD) {
      const higher = [...snaps].filter(s => s > h).sort((a, b) => a - b)[0];
      if (higher !== undefined) { animateTo(higher); return; }
    }
    if (vel < -VELOCITY_THRESHOLD) {
      const lower = [...snaps].filter(s => s < h).sort((a, b) => b - a)[0];
      if (lower !== undefined) { animateTo(lower); return; }
    }

    const nearest = snaps.reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
    if (Math.abs(nearest - h) < threshold) {
      animateTo(nearest);
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'height 100ms ease-out';
      }
      setIsAtMax(h >= SNAP_MAX - 4);
    }
  }, [animateTo, SNAP_MAX]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const content = contentRef.current;
    const fromHandle = (e.target as HTMLElement).closest('[data-handle]');
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

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    if (isAtMax || isPageMode) {
      content.style.overflowY = 'auto';
      content.style.overscrollBehavior = 'contain';
    } else {
      content.style.overflowY = 'hidden';
      content.scrollTop = 0;
    }
  }, [isAtMax, isPageMode]);

  return {
    height,
    isAtMax,
    isPageMode,
    sheetRef,
    contentRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    animateTo,
    snapDefault: () => animateTo(SNAP_DEFAULT),
    snapMid: () => animateTo(SNAP_MID),
    snapMax: () => animateTo(SNAP_MAX),
    snapPage: () => animateTo(SNAP_PAGE),
    snapPeek: () => animateTo(SNAP_PEEK),
    close: () => animateTo(SNAP_MIN),
    SNAP_PAGE,
    SNAP_MAX,
    SNAP_MID,
    SNAP_DEFAULT,
    SNAP_PEEK,
    SNAP_MIN,
  };
}
