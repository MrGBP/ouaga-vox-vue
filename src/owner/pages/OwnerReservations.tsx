import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalIcon, Phone, User as UserIcon, MessageSquare, Check, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyPropertyReservations } from '../lib/ownerService';
import { reservationKindLabel, reservationStatusLabel, updateReservationStatus, type ReservationRow } from '@/lib/reservationsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PeriodKey = 'month' | 'quarter' | 'semester' | 'year';
const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: 'month',    label: 'Mois',       days: 30 },
  { key: 'quarter',  label: 'Trimestre',  days: 90 },
  { key: 'semester', label: '6 mois',     days: 180 },
  { key: 'year',     label: 'Année',      days: 365 },
];

function refDate(r: ReservationRow): Date | null {
  const d = r.visit_at || r.start_date || r.created_at;
  return d ? new Date(d) : null;
}

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

      {!loading && reservations.length > 0 && <SynthesisCard reservations={reservations} />}


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

function SynthesisCard({ reservations }: { reservations: ReservationRow[] }) {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const days = PERIODS.find(p => p.key === period)!.days;

  const stats = useMemo(() => {
    const now = Date.now();
    const startCurr = now - days * 86400000;
    const startPrev = now - 2 * days * 86400000;

    const inRange = (r: ReservationRow, from: number, to: number) => {
      const d = refDate(r); if (!d) return false;
      const t = d.getTime();
      return t >= from && t < to;
    };
    const curr = reservations.filter(r => inRange(r, startCurr, now));
    const prev = reservations.filter(r => inRange(r, startPrev, startCurr));

    const split = (arr: ReservationRow[]) => ({
      visits: arr.filter(r => r.kind === 'visit').length,
      reservations: arr.filter(r => r.kind !== 'visit').length,
      confirmed: arr.filter(r => r.status === 'confirmed' || r.status === 'completed').length,
    });
    const c = split(curr);
    const p = split(prev);
    const conversion = c.visits > 0 ? Math.round((c.confirmed / c.visits) * 100) : 0;
    const prevConv = p.visits > 0 ? Math.round((p.confirmed / p.visits) * 100) : 0;
    const evolution = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));

    return {
      curr: c, prev: p, conversion, prevConv,
      evVisits: evolution(c.visits, p.visits),
      evRes: evolution(c.reservations, p.reservations),
      evConv: conversion - prevConv,
    };
  }, [reservations, days]);

  const Trend = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';
    return <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}><Icon className="h-3 w-3" />{value > 0 ? '+' : ''}{value}{suffix}</span>;
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">📊 Synthèse</h3>
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                period === p.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Visites</div>
          <div className="text-2xl font-bold mt-0.5">{stats.curr.visits}</div>
          <div className="mt-1"><Trend value={stats.evVisits} /></div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Réservations</div>
          <div className="text-2xl font-bold mt-0.5">{stats.curr.reservations}</div>
          <div className="mt-1"><Trend value={stats.evRes} /></div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Confirmées</div>
          <div className="text-2xl font-bold mt-0.5">{stats.curr.confirmed}</div>
          <div className="text-[10px] text-muted-foreground mt-1">période précédente : {stats.prev.confirmed}</div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversion</div>
          <div className="text-2xl font-bold mt-0.5">{stats.conversion}%</div>
          <div className="mt-1"><Trend value={stats.evConv} /></div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Visites → réservations confirmées. Comparé à la période précédente de même durée.
      </p>
    </Card>
  );
}

