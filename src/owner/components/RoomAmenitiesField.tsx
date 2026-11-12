import { ROOM_PRIVATE, ROOM_SHARED, type AmenityDef, type RoomBathroom } from '@/lib/roomAmenities';

interface Props {
  privateKeys: string[]; sharedKeys: string[]; bathroom: RoomBathroom | null;
  onPrivate: (k: string[]) => void; onShared: (k: string[]) => void; onBathroom: (b: RoomBathroom) => void;
}

const toggle = (list: string[], k: string) => (list.includes(k) ? list.filter(x => x !== k) : [...list, k]);

function Group({ title, hint, items, selected, onChange }: { title: string; hint: string; items: AmenityDef[]; selected: string[]; onChange: (k: string[]) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(a => {
          const on = selected.includes(a.key);
          return (
            <button key={a.key} type="button" onClick={() => onChange(toggle(selected, a.key))} aria-pressed={on}
              className={`inline-flex items-center gap-1 h-8 px-3 rounded-full border text-xs font-medium transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}>
              <span aria-hidden>{a.emoji}</span>{a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomAmenitiesField({ privateKeys, sharedKeys, bathroom, onPrivate, onShared, onBathroom }: Props) {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">🛏️ Ce dont le client profite</p>
        <p className="text-[11px] text-muted-foreground">Une chambre n’a pas toujours les mêmes équipements que la maison. Indiquez précisément les deux.</p>
      </div>
      <Group title="Dans la chambre" hint="Réservé au client uniquement" items={ROOM_PRIVATE} selected={privateKeys} onChange={onPrivate} />
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Salle de bain / WC</p>
        <div className="flex gap-2">
          {([['privative', '🚿 Privative (dans la chambre)'], ['partagee', '🚪 Partagée']] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => onBathroom(k)}
              className={`flex-1 h-10 rounded-lg border text-xs font-semibold transition ${bathroom === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}>{l}</button>
          ))}
        </div>
      </div>
      <Group title="Partagé dans la maison" hint="Espaces et équipements communs" items={ROOM_SHARED} selected={sharedKeys} onChange={onShared} />
    </div>
  );
}
