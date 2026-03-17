import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, X, Heart, RotateCcw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { PROPERTY_TYPES, CHAR_CHECKS } from '@/lib/mockData';
import type { Property } from '@/lib/mockData';
import MobileDraggableDrawer from '@/components/MobileDraggableDrawer';

export interface FilterState {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  hasVirtualTour: boolean;
  onlyAvailable: boolean;
  surfaceRange: string;
  characteristics: string[];
  minSurface: number;
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
  allProperties?: Property[];
  computeFilteredCount?: (filters: FilterState) => number;
  externalFilters?: FilterState;
}

export const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  quartier: 'all',
  minPrice: 20000,
  maxPrice: 2000000,
  minBedrooms: 0,
  hasVirtualTour: false,
  onlyAvailable: false,
  surfaceRange: 'all',
  characteristics: [],
  minSurface: 0,
};

const SURFACE_RANGES = [
  { value: 'all', label: 'Toutes' },
  { value: '<50', label: '< 50m²' },
  { value: '50-150', label: '50–150m²' },
  { value: '150-300', label: '150–300m²' },
  { value: '>300', label: '> 300m²' },
];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

// Keys that should use OR logic within their group (mutually exclusive choices)
const OR_GROUPS = [
  ['bed_1', 'bed_2', 'bed_3', 'bed_4plus'],
  ['bath_1', 'bath_2plus'],
];

const CHAR_GROUPS = [
  {
    title: 'Pièces & Surface',
    items: [
      { key: 'bed_1', label: '1 chambre' },
      { key: 'bed_2', label: '2 chambres' },
      { key: 'bed_3', label: '3 chambres' },
      { key: 'bed_4plus', label: '4 chambres et +' },
      { key: 'bath_1', label: '1 salle de bain' },
      { key: 'bath_2plus', label: '2 salles de bain +' },
    ],
  },
  {
    title: 'Équipements essentiels',
    items: [
      { key: 'clim', label: 'Climatisation' },
      { key: 'generator', label: 'Groupe électrogène' },
      { key: 'water', label: 'Eau courante' },
      { key: 'water_tower', label: "Château d'eau" },
      { key: 'wifi', label: 'WiFi / Internet' },
      { key: 'kitchen', label: 'Cuisine équipée' },
      { key: 'fridge', label: 'Réfrigérateur' },
      { key: 'stove', label: 'Cuisinière' },
    ],
  },
  {
    title: 'Confort & Extérieur',
    items: [
      { key: 'furnished', label: 'Meublé' },
      { key: 'tv', label: 'Télévision' },
      { key: 'terrace', label: 'Terrasse / Balcon' },
      { key: 'garden', label: 'Jardin / Cour' },
      { key: 'pool', label: 'Piscine' },
      { key: 'parking_int', label: 'Parking intérieur' },
      { key: 'parking_ext', label: 'Parking extérieur' },
    ],
  },
  {
    title: 'Sécurité & Accès',
    items: [
      { key: 'guardian', label: 'Gardien 24h/24' },
      { key: 'fenced', label: 'Clôturé' },
      { key: 'auto_gate', label: 'Portail automatique' },
      { key: 'cameras', label: 'Caméras de surveillance' },
      { key: 'paved_road', label: 'Route goudronnée' },
      { key: 'pmr', label: 'Accès facile (PMR)' },
    ],
  },
  {
    title: 'Standing',
    items: [
      { key: 'is_new', label: 'Neuf' },
      { key: 'renovated', label: 'Rénové récemment' },
      { key: 'pets', label: 'Animaux acceptés' },
    ],
  },
];

const FilterBar = ({
  onFilterChange,
  onReset,
  quartiers,
  totalCount,
  filteredCount,
  favoritesCount = 0,
  showFavoritesOnly = false,
  onToggleFavoritesView,
  computeFilteredCount,
  externalFilters,
}: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);
  const isMobile = useIsMobile();

  // Sync with external filters (from IDX tags, quartier clicks, etc.)
  useEffect(() => {
    if (externalFilters) {
      setApplied(externalFilters);
      setDraft(externalFilters);
    }
  }, [externalFilters]);

  // When drawer opens, always sync draft with current applied state
  useEffect(() => {
    if (isOpen) {
      setDraft(applied);
    }
  }, [isOpen]);

  const activeCount = [
    applied.type !== 'all',
    applied.quartier !== 'all',
    applied.minPrice > 20000 || applied.maxPrice < 2000000,
    applied.minBedrooms > 0,
    applied.hasVirtualTour,
    applied.onlyAvailable,
    applied.surfaceRange !== 'all',
    applied.characteristics.length > 0,
    applied.minSurface > 0,
  ].filter(Boolean).length;

  const summaryParts: string[] = [];
  if (applied.type !== 'all') {
    const t = PROPERTY_TYPES.find(t => t.value === applied.type);
    if (t) summaryParts.push(t.label);
  }
  if (applied.quartier !== 'all') summaryParts.push(applied.quartier);
  if (applied.characteristics.length > 0) summaryParts.push(`${applied.characteristics.length} caract.`);
  const summary = summaryParts.length > 0
    ? `${summaryParts.join(' · ')} · ${fmt(applied.minPrice)} – ${fmt(applied.maxPrice)} FCFA`
    : null;

  const dots = Array.from({ length: 3 }, (_, i) => i < activeCount);

  // Real-time draft count
  const draftCount = useMemo(() => {
    if (computeFilteredCount) return computeFilteredCount(draft);
    return filteredCount;
  }, [draft, computeFilteredCount, filteredCount]);

  const handleApply = () => {
    setApplied(draft);
    onFilterChange(draft);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setIsOpen(false);
    if (onReset) onReset();
    else onFilterChange(DEFAULT_FILTERS);
  };

  const handleClose = () => setIsOpen(false);

  const toggleType = (type: string) => {
    setDraft(d => ({ ...d, type: d.type === type ? 'all' : type }));
  };

  const toggleChar = (key: string) => {
    setDraft(d => {
      const chars = d.characteristics.includes(key)
        ? d.characteristics.filter(c => c !== key)
        : [...d.characteristics, key];
      return { ...d, characteristics: chars };
    });
  };

  const filterContent = (
    <div className="p-5 space-y-6">
      {/* 7 TYPES OFFICIELS */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Type de bien</h4>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(t => (
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
              <span className="text-xs">{t.label}</span>
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
          max={2000000}
          step={10000}
        />
      </div>

      {/* CARACTÉRISTIQUES — GROUPED CHECKBOXES */}
      {CHAR_GROUPS.map(group => (
        <div key={group.title}>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{group.title}</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {group.items.map(item => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={draft.characteristics.includes(item.key)}
                  onCheckedChange={() => toggleChar(item.key)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
              </label>
            ))}
          </div>
          {group.title === 'Pièces & Surface' && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Surface minimum : <span className="font-semibold text-foreground">{draft.minSurface > 0 ? `${draft.minSurface} m²` : 'Aucune'}</span></p>
              <Slider
                value={[draft.minSurface]}
                onValueChange={([v]) => setDraft(d => ({ ...d, minSurface: v }))}
                min={0}
                max={500}
                step={10}
              />
            </div>
          )}
        </div>
      ))}

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
        <Button variant="outline" onClick={handleReset} className="flex-1 gap-2 hover:bg-muted active:scale-[0.98]">
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
        <Button
          onClick={handleApply}
          className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
        >
          <Check className="h-3.5 w-3.5" />
          Appliquer ({draftCount} bien{draftCount !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full mb-4">
      {/* Pill Bar */}
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
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                ))}
              </span>
            </>
          )}
        </button>

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

        <span className="text-xs text-muted-foreground ml-auto">
          <span className="font-bold text-foreground">{filteredCount}</span> bien{filteredCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Drawer/Dropdown */}
      <AnimatePresence>
        {isOpen && !isMobile && (
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="z-50 bg-card border border-border shadow-lg absolute left-0 right-0 mt-2 rounded-xl max-h-[70vh] overflow-y-auto"
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              {filterContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile: draggable drawer */}
      <MobileDraggableDrawer
        open={isOpen && isMobile}
        onClose={handleClose}
        maxHeightVh={85}
        initialHeightVh={65}
        snapPoints={[0, 40, 65, 85]}
        overlayZIndex={140}
        drawerZIndex={141}
      >
        {filterContent}
      </MobileDraggableDrawer>
    </div>
  );
};

export default FilterBar;
