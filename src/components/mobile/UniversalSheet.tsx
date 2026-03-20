import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useUniversalSheet } from '@/hooks/useUniversalSheet';

export interface UniversalSheetHandle {
  animateTo: (target: number) => void;
  snapDefault: () => void;
  close: () => void;
  SNAP_DEFAULT: number;
}

interface UniversalSheetProps {
  children: React.ReactNode;
  initialSnapVh?: number;
  sheetKey: string;
  headerContent?: React.ReactNode;
  onHeightChange?: (height: number) => void;
}

const BOTTOM_NAV_H = 56;

export const UniversalSheet = forwardRef<UniversalSheetHandle, UniversalSheetProps>(
  ({ children, initialSnapVh = 40, sheetKey, headerContent, onHeightChange }, ref) => {
    const {
      height, isAtMax, isPageMode, sheetRef, contentRef,
      handlers, animateTo, snapDefault, close, SNAP_DEFAULT,
    } = useUniversalSheet(initialSnapVh);

    useImperativeHandle(ref, () => ({
      animateTo,
      snapDefault,
      close,
      SNAP_DEFAULT,
    }), [animateTo, snapDefault, close, SNAP_DEFAULT]);

    useEffect(() => {
      onHeightChange?.(height);
    }, [height, onHeightChange]);

    if (height <= 2) return null;

    return (
      <div
        ref={sheetRef}
        key={sheetKey}
        className="block lg:hidden fixed left-0 right-0 bg-card z-50 flex flex-col"
        style={{
          bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom))`,
          height: `${height}px`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          willChange: 'height',
          touchAction: 'none',
          borderRadius: isPageMode ? 0 : '20px 20px 0 0',
          transition: 'border-radius 200ms ease',
        }}
      >
        {/* Handle — always draggable */}
        <div
          data-handle="true"
          className="flex flex-col items-center pt-2 pb-1 cursor-grab no-select shrink-0"
          style={{ touchAction: 'none', userSelect: 'none' }}
          {...handlers}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[7px] text-muted-foreground/40">↑ carte</span>
            <span className="text-[7px] text-muted-foreground/40">infos ↓</span>
          </div>
        </div>

        {/* Optional header */}
        {headerContent && (
          <div className="shrink-0 px-3 pb-2">
            {headerContent}
          </div>
        )}

        {/* Content — scrollable at max or page mode */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={contentRef}
            className={`h-full ${isAtMax ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
          {/* Gradient fade indicator */}
          {!isAtMax && (
            <div
              className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--card)))' }}
            />
          )}
        </div>
      </div>
    );
  }
);

UniversalSheet.displayName = 'UniversalSheet';
export default UniversalSheet;
