import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Heart } from 'lucide-react';
import { isTypeFurnished, pricePerNight, getTypeLabel } from '@/lib/mockData';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  quartier: string;
  images?: string[];
  bedrooms?: number;
  surface_area?: number;
  furnished?: boolean;
}

interface MobileCarouselProps {
  properties: Property[];
  quartierName: string;
  onPropertyTap: (id: string) => void;
  onSwipeFavorite?: (id: string) => void;
  onActiveChange?: (id: string) => void;
  onDragClose?: () => void;
  favoriteIds?: Set<string>;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const MobileCarousel = ({
  properties,
  quartierName,
  onPropertyTap,
  onSwipeFavorite,
  onActiveChange,
  onDragClose,
  favoriteIds = new Set(),
}: MobileCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll snap observer
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = 228; // 220px + 8px gap
      const idx = Math.round(scrollLeft / cardWidth);
      if (idx !== activeIdx && idx >= 0 && idx < properties.length) {
        setActiveIdx(idx);
        onActiveChange?.(properties[idx].id);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeIdx, properties, onActiveChange]);

  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta < -60) onDragClose?.();
  }, [onDragClose]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      className="block lg:hidden fixed left-0 right-0 z-50"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom))',
        height: '42vh',
        background: 'transparent',
        padding: '8px 0 12px',
      }}
    >
      {/* Header with drag handle */}
      <div
        className="px-4 pb-2 no-select"
        onTouchStart={onHandleTouchStart}
        onTouchEnd={onHandleTouchEnd}
      >
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/50" />
        </div>
        <p className="text-[13px] font-bold text-primary">
          📍 {quartierName} · {properties.length} bien{properties.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Horizontal scroll cards */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 scrollable"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {properties.map((p, i) => {
          const isFurnished = isTypeFurnished(p.type) || p.furnished;
          const nightPrice = isFurnished ? pricePerNight(p.price) : 0;
          const imgSrc = p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop';
          const isFav = favoriteIds.has(p.id);

          return (
            <button
              key={p.id}
              onClick={() => onPropertyTap(p.id)}
              className="shrink-0 bg-card rounded-[14px] overflow-hidden shadow-card border border-border text-left active:scale-[0.97] transition-transform"
              style={{ width: 220, height: 160, scrollSnapAlign: 'start' }}
            >
              <div className="relative h-[100px]">
                <img src={imgSrc} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                {isFav && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Heart className="h-3 w-3 text-secondary-foreground fill-current" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.quartier}</span>
                  {isFurnished && nightPrice > 0 ? (
                    <span className="text-[11px] font-bold text-primary">{fmt(nightPrice)} /n</span>
                  ) : (
                    <span className="text-[11px] font-bold text-primary">{fmt(p.price)} /m</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobileCarousel;
