import React, { useEffect } from 'react';
import { useUniversalSheet } from '@/hooks/useUniversalSheet';

interface UniversalSheetProps {
  children: React.ReactNode;
  initialSnapVh?: number;
  sheetKey: string;
  headerContent?: React.ReactNode;
  onHeightChange?: (height: number) => void;
}

const BOTTOM_NAV_H = 56;

export function UniversalSheet({ children, initialSnapVh = 40, sheetKey, headerContent, onHeightChange }: UniversalSheetProps) {
  const {
    height, isAtMax, sheetRef, contentRef,
    handlers,
  } = useUniversalSheet(initialSnapVh);

  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);

  return (
    <div
      ref={sheetRef}
      key={sheetKey}
      className="block lg:hidden fixed left-0 right-0 bg-card rounded-t-[20px] z-50 flex flex-col"
      style={{
        bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom))`,
        height: `${height}px`,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        willChange: 'height',
        touchAction: 'none',
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

      {/* Content — draggable from top, scrollable at max */}
      <div
        ref={contentRef}
        className={`flex-1 min-h-0 sheet-content ${isAtMax ? 'overflow-y-auto' : 'overflow-hidden'}`}
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}

export default UniversalSheet;
