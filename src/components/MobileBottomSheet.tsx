import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

export type SheetSnapState = 'closed' | 'preview' | 'full';

interface MobileBottomSheetProps {
  state: SheetSnapState;
  onStateChange: (state: SheetSnapState) => void;
  children: React.ReactNode;
  previewHeight?: string;
  fullHeight?: string;
}

const HEIGHTS: Record<SheetSnapState, string> = {
  closed: '0px',
  preview: '55vh',
  full: '80vh',
};

const MobileBottomSheet = ({
  state,
  onStateChange,
  children,
  previewHeight = '55vh',
  fullHeight = '80vh',
}: MobileBottomSheetProps) => {
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const heights: Record<SheetSnapState, string> = {
    closed: '0px',
    preview: previewHeight,
    full: fullHeight,
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = touchStartY.current - e.changedTouches[0].clientY;

    if (state === 'preview') {
      if (delta > 80) onStateChange('full');
      else if (delta < -80) onStateChange('closed');
    } else if (state === 'full') {
      if (delta < -80) onStateChange('preview');
    }
  }, [state, onStateChange]);

  if (state === 'closed') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: heights[state] }}
        exit={{ height: 0 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="block lg:hidden fixed left-0 right-0 bg-card rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] z-50 flex flex-col"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2 pb-1 cursor-grab no-select"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Content */}
        <div className={`flex-1 ${state === 'full' ? 'overflow-y-auto' : 'overflow-hidden'} scrollable`}>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileBottomSheet;
