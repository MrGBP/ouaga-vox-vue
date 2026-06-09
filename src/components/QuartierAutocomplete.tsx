import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { fetchLocations, searchLocations, type LocationRow } from '@/lib/locationsService';
import { useGeoCity } from '@/hooks/useGeoCity';

interface Props {
  value: string;
  onChange: (quartier: string, loc?: LocationRow) => void;
  /** Forcer un pays. Sinon utilise le pays actif (useGeoCity). */
  countryCode?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete sur la table `locations`. Affiche TOUTES les localisations
 * du pays actif (sélectionnable parmi des centaines), avec recherche
 * sous-chaîne sur quartier/ville/commune. Liste défilante.
 */
export default function QuartierAutocomplete({ value, onChange, countryCode, placeholder = 'Quartier, ville, commune…', className }: Props) {
  const { activeCity } = useGeoCity();
  const cc = (countryCode || activeCity?.country || 'BF').toUpperCase();
  const [items, setItems] = useState<LocationRow[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLocations(cc).then(setItems).catch(() => setItems([]));
  }, [cc]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Liste complète quand la valeur est vide, sinon filtrée — jusqu'à 500.
  const suggestions = useMemo(() => searchLocations(items, value, 500), [items, value]);

  // Groupement par ville pour faciliter la navigation (Ouaga, Bobo, Kumasi, Tema…)
  const grouped = useMemo(() => {
    const map = new Map<string, LocationRow[]>();
    for (const s of suggestions) {
      if (!map.has(s.city)) map.set(s.city, []);
      map.get(s.city)!.push(s);
    }
    return Array.from(map.entries());
  }, [suggestions]);

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
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40 sticky top-0">
            {items.length} quartiers · {grouped.length} villes
          </div>
          {grouped.map(([city, rows]) => (
            <div key={city}>
              <div className="px-3 py-1 text-[10px] font-semibold text-primary bg-muted/60 sticky top-[26px]">
                {city} · {rows.length}
              </div>
              {rows.map((s) => {
                const sub = s.commune ?? (s.arrondissement ? `Arrond. ${s.arrondissement}` : null);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { onChange(s.quartier, s); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
                  >
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="font-medium">{s.quartier}</span>
                    {sub && <span className="text-muted-foreground truncate">· {sub}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
