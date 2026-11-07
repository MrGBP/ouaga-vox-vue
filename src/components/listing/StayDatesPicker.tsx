import { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const shortStayDate = (k: string) => new Date(k + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function StayDatesPicker({
  checkIn, checkOut, onApply, compact = false,
}: { checkIn: string; checkOut: string; onApply: (inK: string, outK: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(checkIn);
  const [b, setB] = useState(checkOut);
  useEffect(() => { if (open) { setA(checkIn); setB(checkOut); } }, [open, checkIn, checkOut]);
  const valid = !!a && !!b && b > a && a >= todayKey();
  const active = !!checkIn && !!checkOut;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label="Dates du séjour" title="Dates du séjour" className={`shrink-0 relative ${active ? 'text-secondary' : ''}`}>
            <CalendarDays className="h-4 w-4" />
            {active && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={`gap-1.5 rounded-full ${active ? 'border-secondary text-foreground' : ''}`}>
            <CalendarDays className="h-4 w-4" />
            {active ? `${shortStayDate(checkIn)} → ${shortStayDate(checkOut)}` : 'Dates du séjour'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 z-[230] space-y-3">
        <p className="text-sm font-semibold text-foreground">Quand séjournez-vous ?</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted-foreground space-y-1">Arrivée
            <input type="date" min={todayKey()} value={a} onChange={e => { setA(e.target.value); if (b && e.target.value >= b) setB(''); }} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
          </label>
          <label className="text-[11px] text-muted-foreground space-y-1">Départ
            <input type="date" min={a || todayKey()} value={b} onChange={e => setB(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">Seuls les logements libres sur toute la période s'affichent.</p>
        <div className="flex gap-2">
          {active && <Button variant="ghost" size="sm" className="gap-1" onClick={() => { onApply('', ''); setOpen(false); }}><X className="h-3.5 w-3.5" /> Effacer</Button>}
          <Button size="sm" className="flex-1" disabled={!valid} onClick={() => { onApply(a, b); setOpen(false); }}>Voir les disponibilités</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
