import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export type SheetSnapState = 'closed' | 'preview' | 'half' | 'full';

const SNAP_INDICES: Record<SheetSnapState, number> = {
  closed: 0,
  preview: 1,
  half: 2,
  full: 3,
};

interface MobileBottomSheetProps {
  children: React.ReactNode;
  onSnapChange?: (snap: SheetSnapState) => void;
  onTapMap?: () => void;
  headerContent?: React.ReactNode;
}

export interface MobileBottomSheetRef {
  snapTo: (snap: SheetSnapState) => void;
  currentSnap: SheetSnapState;
}

const getSnaps = () => {
  const vh = window.innerHeight;
  return [0, vh * 0.45, vh * 0.65, vh * 0.80];
};

const SNAP_NAMES: SheetSnapState[] = ['closed', 'preview', 'half', 'full'];

const snapNameFromIndex = (idx: number): SheetSnapState => SNAP_NAMES[idx] || 'closed';

const MobileBottomSheet = forwardRef<MobileBottomSheetRef, MobileBottomSheetProps>(
  ({ children, onSnapChange, headerContent }, ref) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const heightRef = useRef(0);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);
    const lastMoveTime = useRef(0);
    const lastMoveY = useRef(0);
    const velocity = useRef(0);

    const MAX_HEIGHT = typeof window !== 'undefined' ? window.innerHeight * 0.80 : 600;
    const SNAP_THRESHOLD = typeof window !== 'undefined' ? window.innerHeight * 0.06 : 40;

    const snapToHeight = useCallback((targetHeight: number, animate = true) => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = animate
          ? 'height 300ms cubic-bezier(0.34,1.56,0.64,1)'
          : 'none';
      }
      setHeight(targetHeight);
      heightRef.current = targetHeight;

      const snaps = getSnaps();
      const nearestIdx = snaps.reduce(
        (bestIdx, snap, idx) =>
          Math.abs(snap - targetHeight) < Math.abs(snaps[bestIdx] - targetHeight)
            ? idx
            : bestIdx,
        0
      );
      onSnapChange?.(snapNameFromIndex(nearestIdx));
    }, [onSnapChange]);

    const snapToName = useCallback((snap: SheetSnapState) => {
      const snaps = getSnaps();
      const idx = SNAP_INDICES[snap];
      snapToHeight(snaps[idx]);
    }, [snapToHeight]);

    useImperativeHandle(ref, () => ({
      snapTo: snapToName,
      get currentSnap() {
        const snaps = getSnaps();
        const nearestIdx = snaps.reduce(
          (bestIdx, snap, idx) =>
            Math.abs(snap - heightRef.current) < Math.abs(snaps[bestIdx] - heightRef.current)
              ? idx
              : bestIdx,
          0
        );
        return snapNameFromIndex(nearestIdx);
      },
    }), [snapToName]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      startHeight.current = heightRef.current;
      lastMoveTime.current = Date.now();
      lastMoveY.current = e.touches[0].clientY;
      velocity.current = 0;

      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
      if (!isDragging.current) return;
      const currentY = e.touches[0].clientY;
      const delta = startY.current - currentY;
      const newHeight = Math.max(0, Math.min(MAX_HEIGHT, startHeight.current + delta));

      // Track velocity
      const now = Date.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        velocity.current = (lastMoveY.current - currentY) / dt; // positive = swiping up
      }
      lastMoveTime.current = now;
      lastMoveY.current = currentY;

      setHeight(newHeight);
      heightRef.current = newHeight;
    }, [MAX_HEIGHT]);

    const onTouchEnd = useCallback(() => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const snaps = getSnaps();
      const currentH = heightRef.current;

      // Fast swipe detection
      const VELOCITY_THRESHOLD = 0.5; // px/ms
      if (Math.abs(velocity.current) > VELOCITY_THRESHOLD) {
        // Find current snap index
        const currentSnapIdx = snaps.reduce(
          (bestIdx, snap, idx) =>
            Math.abs(snap - startHeight.current) < Math.abs(snaps[bestIdx] - startHeight.current)
              ? idx
              : bestIdx,
          0
        );

        if (velocity.current > 0) {
          // Swiping up → next snap
          const nextIdx = Math.min(currentSnapIdx + 1, snaps.length - 1);
          snapToHeight(snaps[nextIdx]);
        } else {
          // Swiping down → previous snap
          const prevIdx = Math.max(currentSnapIdx - 1, 0);
          snapToHeight(snaps[prevIdx]);
        }
        return;
      }

      // Find nearest snap
      const nearest = snaps.reduce((a, b) =>
        Math.abs(b - currentH) < Math.abs(a - currentH) ? b : a
      );

      if (Math.abs(nearest - currentH) < SNAP_THRESHOLD) {
        snapToHeight(nearest);
      } else {
        // Stay at current height — but still animate to settle
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'height 150ms ease-out';
        }
      }
    }, [snapToHeight, SNAP_THRESHOLD]);

    // Check if sheet is at max (allow internal scroll)
    const isAtMax = height >= MAX_HEIGHT * 0.95;

    if (height <= 2) return null;

    return (
      <div
        ref={sheetRef}
        className="block lg:hidden fixed left-0 right-0 bg-card rounded-t-[20px] z-50 flex flex-col"
        style={{
          bottom: 'calc(52px + env(safe-area-inset-bottom))',
          height: `${height}px`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          willChange: 'height',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab no-select shrink-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[7px] text-muted-foreground/40">↑ carte</span>
            <span className="text-[7px] text-muted-foreground/40">infos ↓</span>
          </div>
        </div>

        {/* Sheet header content (breadcrumb etc) */}
        {headerContent && (
          <div className="shrink-0 px-3 pb-2">
            {headerContent}
          </div>
        )}

        {/* Content */}
        <div
          className={`flex-1 ${isAtMax ? 'overflow-y-auto scrollable' : 'overflow-hidden'}`}
          onTouchStart={(e) => {
            // Prevent drag from content area unless at top of scroll
            if (isAtMax) {
              const el = e.currentTarget;
              if (el.scrollTop <= 0) {
                // Allow drag down from top of scroll
              }
            }
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

MobileBottomSheet.displayName = 'MobileBottomSheet';

export default MobileBottomSheet;
