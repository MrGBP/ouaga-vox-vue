import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalIcon, Phone, User as UserIcon, MessageSquare, Check, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyPropertyReservations } from '../lib/ownerService';
import { reservationKindLabel, reservationStatusLabel, updateReservationStatus, type ReservationRow } from '@/lib/reservationsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function OwnerReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { reservations: r, propertyTitleById } = await fetchMyPropertyReservations(user.id);
      setReservations(r as ReservationRow[]);
      setTitles(propertyTitleById);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [user]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    reservations.forEach(r => {
      const d = r.visit_at || r.start_date;
      if (d) set.add(new Date(d).toISOString().slice(0, 10));
    });
    return set;
  }, [reservations]);

  const dayKey = date ? date.toISOString().slice(0, 10) : '';
  const ofDay = useMemo(() =>
    reservations.filter(r => {
      const d = r.visit_at || r.start_date;
      return d && new Date(d).toISOString().slice(0, 10) === dayKey;
    }), [reservations, dayKey]);

  const pending = reservations.filter(r => r.status === 'pending');

  const setStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await updateReservationStatus(id, status);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success(status === 'confirmed' ? 'Réservation confirmée' : 'Réservation refusée');
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Réservations & visites</h2>
        <p className="text-sm text-muted-foreground">Toutes les demandes reçues sur tes biens.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5">
          {/* Calendar */}
          <Card className="p-3 self-start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className={cn("p-2 pointer-events-auto")}
              modifiers={{
                hasEvent: (d) => eventDates.has(d.toISOString().slice(0, 10))
              }}
              modifiersClassNames={{
                hasEvent: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary'
              }}
            />
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              Le point bleu indique un jour avec demande.
            </p>
          </Card>

          {/* Lists */}
          <div className="space-y-5">
            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  À traiter
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">{pending.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {pending.map(r => (
                    <ResaCard key={r.id} r={r} title={titles[r.property_id]} onAccept={() => setStatus(r.id, 'confirmed')} onReject={() => setStatus(r.id, 'cancelled')} />
                  ))}
                </div>
              </section>
            )}

            {/* Day list */}
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CalIcon className="h-4 w-4" />
                {date ? date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Jour'}
              </h3>
              {ofDay.length === 0 ? (
                <Card className="p-6 text-center text-xs text-muted-foreground">Aucune demande ce jour.</Card>
              ) : (
                <div className="space-y-2">
                  {ofDay.map(r => <ResaCard key={r.id} r={r} title={titles[r.property_id]} />)}
                </div>
              )}
            </section>

            {/* All reservations */}
            <section>
              <h3 className="text-sm font-semibold mb-2">Toutes les demandes ({reservations.length})</h3>
              {reservations.length === 0 ? (
                <Card className="p-6 text-center text-xs text-muted-foreground">Pas encore de demande.</Card>
              ) : (
                <div className="space-y-2">
                  {reservations.map(r => <ResaCard key={r.id} r={r} title={titles[r.property_id]} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function ResaCard({ r, title, onAccept, onReject }: { r: ReservationRow; title?: string; onAccept?: () => void; onReject?: () => void }) {
  const statusColor =
    r.status === 'confirmed' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
    r.status === 'cancelled' ? 'bg-red-500/10 text-red-700 border-red-500/30' :
    r.status === 'completed' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
    'bg-amber-500/10 text-amber-700 border-amber-500/30';

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <Badge variant="outline" className="mb-1.5 text-[10px]">{reservationKindLabel(r.kind)}</Badge>
          <h4 className="font-semibold text-sm truncate">{title ?? 'Bien'}</h4>
          <p className="text-xs text-muted-foreground">
            {r.start_date && new Date(r.start_date).toLocaleDateString('fr-FR')}
            {r.end_date && ` → ${new Date(r.end_date).toLocaleDateString('fr-FR')}`}
            {r.visit_at && new Date(r.visit_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <Badge variant="outline" className={statusColor}>{reservationStatusLabel(r.status)}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t pt-2">
        <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {r.contact_name}</span>
        <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" /> {r.contact_phone}</a>
        {r.message && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> message</span>}
      </div>
      {r.message && <p className="text-xs italic text-muted-foreground mt-1.5 bg-muted/50 rounded p-2">"{r.message}"</p>}
      {(onAccept || onReject) && (
        <div className="flex gap-2 mt-2">
          {onAccept && <Button size="sm" className="flex-1 gap-1.5" onClick={onAccept}><Check className="h-3.5 w-3.5" /> Confirmer</Button>}
          {onReject && <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-red-600 hover:text-red-700" onClick={onReject}><X className="h-3.5 w-3.5" /> Refuser</Button>}
        </div>
      )}
    </Card>
  );
}
