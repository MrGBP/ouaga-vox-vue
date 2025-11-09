import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  quartiers: string[];
}

export interface FilterState {
  type: string;
  quartier: string;
  minPrice: number;
  maxPrice: number;
  minComfort: number;
  minSecurity: number;
}

const FilterBar = ({ onFilterChange, quartiers }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    quartier: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    minComfort: 0,
    minSecurity: 0,
  });

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      type: 'all',
      quartier: 'all',
      minPrice: 0,
      maxPrice: 1000000,
      minComfort: 0,
      minSecurity: 0,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'type' || key === 'quartier') return value !== 'all';
    if (key === 'minPrice') return value > 0;
    if (key === 'maxPrice') return value < 1000000;
    if (key === 'minComfort' || key === 'minSecurity') return value > 0;
    return false;
  }).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant={isOpen ? 'default' : 'outline'}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 bg-accent">{activeFiltersCount}</Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button onClick={resetFilters} variant="ghost" size="sm" className="gap-2">
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-card border border-border rounded-lg shadow-soft">
              {/* Type de bien */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type de bien</label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quartier */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quartier</label>
                <Select value={filters.quartier} onValueChange={(value) => handleFilterChange('quartier', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les quartiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les quartiers</SelectItem>
                    {quartiers.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-foreground">
                  Budget (FCFA): {filters.minPrice.toLocaleString('fr-FR')} - {filters.maxPrice.toLocaleString('fr-FR')}
                </label>
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={([min, max]) => {
                    handleFilterChange('minPrice', min);
                    handleFilterChange('maxPrice', max);
                  }}
                  min={0}
                  max={1000000}
                  step={50000}
                  className="mt-2"
                />
              </div>

              {/* Confort minimum */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confort minimum: {filters.minComfort}/5
                </label>
                <Slider
                  value={[filters.minComfort]}
                  onValueChange={([value]) => handleFilterChange('minComfort', value)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              {/* Sécurité minimum */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sécurité minimum: {filters.minSecurity}/5
                </label>
                <Slider
                  value={[filters.minSecurity]}
                  onValueChange={([value]) => handleFilterChange('minSecurity', value)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
