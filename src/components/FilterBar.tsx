import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface FilterState {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  hasVirtualTour: boolean;
  onlyAvailable: boolean;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  quartiers: string[];
  totalCount: number;
  filteredCount: number;
}

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  quartier: 'all',
  minPrice: 0,
  maxPrice: 850000,
  minBedrooms: 0,
  hasVirtualTour: false,
  onlyAvailable: false,
};

const FilterBar = ({ onFilterChange, quartiers, totalCount, filteredCount }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const update = (patch: Partial<FilterState>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFilterChange(next);
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  };

  const activeCount = [
    filters.type !== 'all',
    filters.quartier !== 'all',
    filters.minPrice > 0 || filters.maxPrice < 850000,
    filters.minBedrooms > 0,
    filters.hasVirtualTour,
    filters.onlyAvailable,
  ].filter(Boolean).length;

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg px-3.5 py-2 hover:bg-muted transition-colors shadow-card"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filtres
            {activeCount > 0 && (
              <Badge className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-xs">
                {activeCount}
              </Badge>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {activeCount > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCount}</span> bien{filteredCount > 1 ? 's' : ''} sur {totalCount}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <div className="bg-card border border-border rounded-xl p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type de bien</label>
                <Select value={filters.type} onValueChange={(v) => update({ type: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="maison">🏠 Maison</SelectItem>
                    <SelectItem value="bureau">🏢 Bureau</SelectItem>
                    <SelectItem value="commerce">🏪 Commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quartier */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quartier</label>
                <Select value={filters.quartier} onValueChange={(v) => update({ quartier: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les quartiers</SelectItem>
                    {quartiers.map((q) => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chambres */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Chambres minimum : {filters.minBedrooms === 0 ? 'Toutes' : `${filters.minBedrooms}+`}
                </label>
                <Slider
                  value={[filters.minBedrooms]}
                  onValueChange={([v]) => update({ minBedrooms: v })}
                  min={0} max={6} step={1}
                  className="mt-3"
                />
              </div>

              {/* Budget */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Budget (FCFA/mois) :{' '}
                  <span className="text-foreground font-bold">
                    {filters.minPrice.toLocaleString('fr-FR')} → {filters.maxPrice.toLocaleString('fr-FR')}
                  </span>
                </label>
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={([min, max]) => update({ minPrice: min, maxPrice: max })}
                  min={0} max={850000} step={10000}
                  className="mt-3"
                />
              </div>

              {/* Switches */}
              <div className="flex items-center gap-2">
                <Switch
                  id="has360"
                  checked={filters.hasVirtualTour}
                  onCheckedChange={(v) => update({ hasVirtualTour: v })}
                />
                <Label htmlFor="has360" className="text-sm cursor-pointer">Visite 360° disponible</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="available"
                  checked={filters.onlyAvailable}
                  onCheckedChange={(v) => update({ onlyAvailable: v })}
                />
                <Label htmlFor="available" className="text-sm cursor-pointer">Uniquement disponibles</Label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
