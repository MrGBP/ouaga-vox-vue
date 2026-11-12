import { ROOM_PRIVATE, ROOM_SHARED, readRoomAmenities, type AmenityDef } from '@/lib/roomAmenities';

const pick = (defs: AmenityDef[], keys: string[]) => defs.filter(d => keys.includes(d.key));

export default function RoomAmenitiesDisplay({ features }: { features: any }) {
  const { privateKeys, sharedKeys, bathroom } = readRoomAmenities(features);
  const priv = pick(ROOM_PRIVATE, privateKeys);
  const shared = pick(ROOM_SHARED, sharedKeys);
  if (!priv.length && !shared.length && !bathroom) return null;
  const chip = (a: AmenityDef) => (
    <span key={a.key} className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2.5 py-1 text-xs text-foreground"><span aria-hidden>{a.emoji}</span> {a.label}</span>
  );
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Dans votre chambre</h4>
        <div className="flex flex-wrap gap-1.5">
          {priv.map(chip)}
          {bathroom && <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2.5 py-1 text-xs text-foreground">🚿 Salle de bain {bathroom === 'privative' ? 'privative' : 'partagée'}</span>}
        </div>
      </div>
      {shared.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Partagé dans la maison</h4>
          <div className="flex flex-wrap gap-1.5">{shared.map(chip)}</div>
        </div>
      )}
    </div>
  );
}
