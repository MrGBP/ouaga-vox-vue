import { useRef, useCallback, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileDraggableDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightVh?: number; // default 75
  initialHeightVh?: number; // default = maxHeightVh
  snapPoints?: number[]; // vh values, e.g. [0, 40, 60, 75]
  showOverlay?: boolean;
  overlayZIndex?: number;
  drawerZIndex?: number;
  bottomOffset?: string; // CSS value e.g. 'calc(52px + env(safe-area-inset-bottom))'
}

export interface MobileDraggableDrawerRef {
  setHeight: (vh: number) => void;
}

const MobileDraggableDrawer = forwardRef<MobileDraggableDrawerRef, MobileDraggableDrawerProps>(
  ({
    open,
    onClose,
    children,
    maxHeightVh = 75,
    initialHeightVh,
    snapPoints,
    showOverlay = true,
    overlayZIndex = 140,
    drawerZIndex = 141,
    bottomOffset = '0px',
  }, ref) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const heightRef = useRef(0);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);
    const lastMoveTime = useRef(0);
    const lastMoveY = useRef(0);
    const velocity = useRef(0);
    const hasOpened = useRef(false);

    const MAX_HEIGHT = typeof window !== 'undefined' ? window.innerHeight * (maxHeightVh / 100) : 600;
    const INITIAL_HEIGHT = typeof window !== 'undefined'
      ? window.innerHeight * ((initialHeightVh ?? maxHeightVh) / 100)
      : MAX_HEIGHT;

    const snaps = snapPoints
      ? snapPoints.map(s => (typeof window !== 'undefined' ? window.innerHeight * (s / 100) : s * 6))
      : [0, MAX_HEIGHT];

    // Open animation
    useEffect(() => {
      if (open && !hasOpened.current) {
        hasOpened.current = true;
        // Animate open
        requestAnimationFrame(() => {
          setHeight(INITIAL_HEIGHT);
          heightRef.current = INITIAL_HEIGHT;
        });
      }
      if (!open) {
        hasOpened.current = false;
        setHeight(0);
        heightRef.current = 0;
      }
    }, [open, INITIAL_HEIGHT]);

    useImperativeHandle(ref, () => ({
      setHeight: (vh: number) => {
        const h = window.innerHeight * (vh / 100);
        setHeight(h);
        heightRef.current = h;
      },
    }), []);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      startHeight.current = heightRef.current;
      lastMoveTime.current = Date.now();
      lastMoveY.current = e.touches[0].clientY;
      velocity.current = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
      if (!isDragging.current) return;
      const currentY = e.touches[0].clientY;
      const delta = startY.current - currentY;
      const newHeight = Math.max(0, Math.min(MAX_HEIGHT, startHeight.current + delta));

      const now = Date.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        velocity.current = (lastMoveY.current - currentY) / dt;
      }
      lastMoveTime.current = now;
      lastMoveY.current = currentY;

      setHeight(newHeight);
      heightRef.current = newHeight;
    }, [MAX_HEIGHT]);

    const onTouchEnd = useCallback(() => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (sheetRef.current) {
        sheetRef.current.style.transition = 'height 300ms cubic-bezier(0.34,1.56,0.64,1)';
      }

      const currentH = heightRef.current;

      // Fast flick down → close
      if (velocity.current < -1.2) {
        setHeight(0);
        heightRef.current = 0;
        setTimeout(onClose, 300);
        return;
      }

      // Fast flick up → max
      if (velocity.current > 1.2) {
        setHeight(MAX_HEIGHT);
        heightRef.current = MAX_HEIGHT;
        return;
      }

      // Close if very low
      if (currentH < window.innerHeight * 0.08) {
        setHeight(0);
        heightRef.current = 0;
        setTimeout(onClose, 300);
        return;
      }

      // Magnetic snap (3vh threshold)
      const MAGNETIC = window.innerHeight * 0.03;
      const nearest = snaps.reduce((a, b) =>
        Math.abs(b - currentH) < Math.abs(a - currentH) ? b : a
      );
      if (Math.abs(nearest - currentH) < MAGNETIC) {
        if (nearest <= 0) {
          setHeight(0);
          heightRef.current = 0;
          setTimeout(onClose, 300);
        } else {
          setHeight(nearest);
          heightRef.current = nearest;
        }
      }
      // else: stay at free position
    }, [MAX_HEIGHT, onClose, snaps]);

    const isAtMax = height >= MAX_HEIGHT * 0.85;

    if (!open) return null;

    return (
      <>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20"
            style={{ zIndex: overlayZIndex }}
            onClick={onClose}
          />
        )}
        <div
          ref={sheetRef}
          className="fixed inset-x-0 bg-card rounded-t-[20px] flex flex-col"
          style={{
            bottom: bottomOffset,
            height: `${height}px`,
            zIndex: drawerZIndex,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            willChange: 'height',
            transition: 'height 300ms cubic-bezier(0.34,1.56,0.64,1)',
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
              <span className="text-[7px] text-muted-foreground/40">↑ plus</span>
              <span className="text-[7px] text-muted-foreground/40">moins ↓</span>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 min-h-0 ${isAtMax ? 'overflow-y-auto scrollable' : 'overflow-hidden'}`}>
            {children}
          </div>
        </div>
      </>
    );
  }
);

MobileDraggableDrawer.displayName = 'MobileDraggableDrawer';

export default MobileDraggableDrawer;
