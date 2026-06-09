import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { fetchLocations, searchLocations, type LocationRow } from '@/lib/locationsService';

interface Props {
  value: string;
  onChange: (quartier: string, loc?: LocationRow) => void;
  countryCode?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete sur la table `locations` (gin_trgm). Fallback :
 * affiche tout, filtre par sous-chaîne côté client.
 */
export default function QuartierAutocomplete({ value, onChange, countryCode = 'BF', placeholder = 'Quartier…', className }: Props) {
  const [items, setItems] = useState<LocationRow[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLocations(countryCode).then(setItems).catch(() => setItems([]));
  }, [countryCode]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = useMemo(() => searchLocations(items, value, 10), [items, value]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="form-input pl-8 w-full"
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map(s => {
            const sub = s.commune ?? (s.arrondissement ? `Arrondissement ${s.arrondissement}` : null);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.quartier, s); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
              >
                <MapPin size={12} className="text-primary shrink-0" />
                <span className="font-medium">{s.quartier}</span>
                <span className="text-muted-foreground truncate">
                  · {s.city}{sub ? ` · ${sub}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
