import { useState } from 'react';
import { SlidersHorizontal, X, Heart, RotateCcw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

export interface FilterState {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  hasVirtualTour: boolean;
  onlyAvailable: boolean;
  surfaceRange: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  onReset?: () => void;
  quartiers: string[];
  totalCount: number;
  filteredCount: number;
  favoritesCount?: number;
  showFavoritesOnly?: boolean;
  onToggleFavoritesView?: () => void;
}

export const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  quartier: 'all',
  minPrice: 20000,
  maxPrice: 1000000,
  minBedrooms: 0,
  hasVirtualTour: false,
  onlyAvailable: false,
  surfaceRange: 'all',
};

const TYPES = [
  { value: 'maison', label: 'Maison meublée', emoji: '🏠' },
  { value: 'villa', label: 'Villa meublée', emoji: '🏡' },
  { value: 'appartement', label: 'Appartement meublé', emoji: '🏬' },
  { value: 'studio', label: 'Studio meublé', emoji: '🛏️' },
  { value: 'bureau', label: 'Bureau', emoji: '🏢' },
  { value: 'commerce', label: 'Local commercial', emoji: '🏪' },
];

const SURFACE_RANGES = [
  { value: 'all', label: 'Toutes' },
  { value: '<50', label: '< 50m²' },
  { value: '50-150', label: '50–150m²' },
  { value: '150-300', label: '150–300m²' },
  { value: '>300', label: '> 300m²' },
];

const BEDROOMS = [1, 2, 3, 4];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const FilterBar = ({
  onFilterChange,
  onReset,
  quartiers,
  totalCount,
  filteredCount,
  favoritesCount = 0,
  showFavoritesOnly = false,
  onToggleFavoritesView,
}: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);
  const isMobile = useIsMobile();

  const activeCount = [
    applied.type !== 'all',
    applied.quartier !== 'all',
    applied.minPrice > 20000 || applied.maxPrice < 1000000,
    applied.minBedrooms > 0,
    applied.hasVirtualTour,
    applied.onlyAvailable,
    applied.surfaceRange !== 'all',
  ].filter(Boolean).length;

  const summaryParts: string[] = [];
  if (applied.type !== 'all') {
    const t = TYPES.find(t => t.value === applied.type);
    if (t) summaryParts.push(t.label);
  }
  if (applied.quartier !== 'all') summaryParts.push(applied.quartier);
  const summary = summaryParts.length > 0
    ? `${summaryParts.join(' · ')} · ${fmt(applied.minPrice)} – ${fmt(applied.maxPrice)} FCFA`
    : null;

  const dots = Array.from({ length: 3 }, (_, i) => i < activeCount);

  const handleApply = () => {
    setApplied(draft);
    onFilterChange(draft);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setIsOpen(false);
    if (onReset) {
      onReset();
    } else {
      onFilterChange(DEFAULT_FILTERS);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const toggleType = (type: string) => {
    setDraft(d => ({ ...d, type: d.type === type ? 'all' : type }));
  };

  return (
    <div className="w-full mb-4">
      {/* ── Pill Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all shadow-sm"
          style={{ maxHeight: 36 }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          {summary ? (
            <span className="truncate max-w-[260px]">⚙️ {summary}</span>
          ) : (
            <>
              Filtres
              <span className="flex gap-0.5 ml-1">
                {dots.map((active, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  />
                ))}
              </span>
            </>
          )}
        </button>

        {/* Favorites */}
        {onToggleFavoritesView && (
          <button
            onClick={onToggleFavoritesView}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all border active:scale-[0.98] ${
              showFavoritesOnly
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'bg-card text-muted-foreground border-border hover:border-secondary/50'
            }`}
            style={{ maxHeight: 36 }}
          >
            <Heart className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            {favoritesCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] bg-secondary/20 text-secondary">
                {favoritesCount}
              </Badge>
            )}
          </button>
        )}

        {/* Result count */}
        <span className="text-xs text-muted-foreground ml-auto">
          <span className="font-bold text-foreground">{filteredCount}</span> bien{filteredCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Drawer/Dropdown ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/20 z-40"
              onClick={handleClose}
            />

            <motion.div
              initial={isMobile ? { y: '100%' } : { opacity: 0, y: -8 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className={`z-50 bg-card border border-border shadow-lg ${
                isMobile
                  ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-y-auto'
                  : 'absolute left-0 right-0 mt-2 rounded-xl max-h-[70vh] overflow-y-auto'
              }`}
              style={{ position: isMobile ? 'fixed' : 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              {isMobile && (
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}

              <div className="p-5 space-y-6">
                {/* TYPE DE BIEN */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Type de bien</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => toggleType(t.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all active:scale-[0.98] ${
                          draft.type === t.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-transparent text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                        {draft.type === t.value && <Check className="h-3.5 w-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PRIX */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Prix (FCFA/mois)</h4>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    {fmt(draft.minPrice)} — {fmt(draft.maxPrice)}
                  </p>
                  <Slider
                    value={[draft.minPrice, draft.maxPrice]}
                    onValueChange={([min, max]) => setDraft(d => ({ ...d, minPrice: min, maxPrice: max }))}
                    min={20000}
                    max={1000000}
                    step={10000}
                  />
                </div>

                {/* SURFACE */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Surface</h4>
                  <div className="flex flex-wrap gap-2">
                    {SURFACE_RANGES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setDraft(d => ({ ...d, surfaceRange: d.surfaceRange === s.value ? 'all' : s.value }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] ${
                          draft.surfaceRange === s.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHAMBRES */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Chambres</h4>
                  <div className="flex gap-2">
                    {BEDROOMS.map(n => (
                      <button
                        key={n}
                        onClick={() => setDraft(d => ({ ...d, minBedrooms: d.minBedrooms === n ? 0 : n }))}
                        className={`w-10 h-10 rounded-lg text-sm font-bold border transition-all active:scale-[0.98] ${
                          draft.minBedrooms === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 border-transparent text-foreground hover:bg-muted'
                        }`}
                      >
                        {n === 4 ? '4+' : n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OPTIONS */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Options</h4>
                  <button
                    onClick={() => setDraft(d => ({ ...d, hasVirtualTour: !d.hasVirtualTour }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all active:scale-[0.98] ${
                      draft.hasVirtualTour
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-transparent text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>🔭</span>
                    <span>Visite 360° disponible</span>
                    {draft.hasVirtualTour && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 gap-2 hover:bg-muted active:scale-[0.98]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Appliquer
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
