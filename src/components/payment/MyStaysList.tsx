import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, FileText, Loader2, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { canPayStay } from '@/lib/paymentLogic';
import { cancelMyStay, listMyStays, runBookingMaintenance, subscribeStays, RECEIPT_KIND_LABEL, type StayBundle } from '@/lib/paymentsService';
import SimulatedPaymentPanel from './SimulatedPaymentPanel';
import { StayStatusBadge, PaymentStatusBadge, fmtStayDate } from './StayBadges';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export default function MyStaysList({ userId, defaultPhone }: { userId: string; defaultPhone?: string }) {
  const [stays, setStays] = useState<StayBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<StayBundle | null>(null);

  const load = useCallback(async () => {
    try { setStays(await listMyStays(userId)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    runBookingMaintenance().finally(load);
    const off = subscribeStays(`me-${userId}`, load);
    return off;
  }, [load, userId]);

  const cancel = async (s: StayBundle) => {
    const paid = s.payments.some(p => p.status === 'simulated_validated');
    if (!confirm(paid ? 'Annuler ce séjour ? Le paiement simulé sera marqué « remboursement simulé ».' : 'Annuler cette réservation ?')) return;
    try { await cancelMyStay(s.id); toast.success('Réservation annulée'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (stays.length === 0) return (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      Aucun séjour réservé. <Link to="/resultats" className="text-primary underline">Trouver un logement</Link>
    </Card>
  );

  return (
    <div className="space-y-3">
      {stays.map(s => {
        const payable = canPayStay(s.status, s.hold_expires_at);
        const cancellable = ['awaiting_payment', 'paid_awaiting_owner', 'pending'].includes(s.status)
          || (s.status === 'confirmed' && new Date(s.check_in + 'T00:00:00') > new Date());
        return (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-muted-foreground">{s.confirmation_number}</p>
                <Link to={`/property/${s.property_id}`} className="font-semibold text-foreground hover:underline line-clamp-1">{s.property_title}</Link>
                <p className="text-xs text-muted-foreground">{s.property_quartier} · {fmtStayDate(s.check_in)} → {fmtStayDate(s.check_out)} · {s.nights} nuit(s)</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StayStatusBadge status={s.status} />
                <PaymentStatusBadge status={s.payments[0]?.status} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">Total</span>
              <span className="font-bold text-primary">{fmt(s.total_price)} FCFA</span>
            </div>
            {s.status === 'paid_awaiting_owner' && (
              <p className="mt-2 text-xs text-muted-foreground">Le propriétaire confirme la disponibilité. Vous serez notifié dès sa réponse.</p>
            )}
            {s.status === 'refused' && s.refusal_reason && <p className="mt-2 text-xs text-destructive">Motif : {s.refusal_reason}</p>}
            {payable && s.hold_expires_at && (
              <p className="mt-2 flex items-center gap-1 text-xs text-secondary font-semibold">
                <Timer className="h-3.5 w-3.5" /> Dates protégées jusqu'à {new Date(s.hold_expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {payable && <Button size="sm" className="gap-1.5" onClick={() => setPaying(s)}><CreditCard className="h-3.5 w-3.5" /> Payer (simulation)</Button>}
              {s.receipts.map(r => (
                <Link key={r.id} to={`/recu/${r.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> {RECEIPT_KIND_LABEL[r.kind]}{r.version > 1 ? ` v${r.version}` : ''}</Button>
                </Link>
              ))}
              {cancellable && <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => cancel(s)}>Annuler</Button>}
            </div>
          </Card>
        );
      })}

      <Dialog open={!!paying} onOpenChange={o => { if (!o) { setPaying(null); load(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paiement Mobile Money</DialogTitle>
            <DialogDescription>Simulation — aucun argent réel n'est transféré.</DialogDescription>
          </DialogHeader>
          {paying && (
            <SimulatedPaymentPanel
              stay={paying}
              defaultPhone={defaultPhone || paying.user_phone}
              onValidated={() => load()}
              onRestartBooking={() => { setPaying(null); load(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
