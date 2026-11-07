import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, FileText, Loader2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { listOwnerStays, ownerDecideReservation, runBookingMaintenance, subscribeStays, RECEIPT_KIND_LABEL, type StayBundle } from '@/lib/paymentsService';
import { StayStatusBadge, PaymentStatusBadge, fmtStayDate } from '@/components/payment/StayBadges';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export default function OwnerStaysPanel() {
  const { user } = useAuth();
  const [stays, setStays] = useState<StayBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refusing, setRefusing] = useState<StayBundle | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data: props } = await supabase.from('properties').select('id').eq('owner_id', user.id);
      setStays(await listOwnerStays((props ?? []).map(p => p.id)));
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    runBookingMaintenance().finally(load);
    const off = subscribeStays('owner', load);
    const poll = setInterval(load, 60000);
    return () => { off(); clearInterval(poll); };
  }, [load]);

  const decide = async (s: StayBundle, accept: boolean, why?: string) => {
    setBusy(s.id);
    try {
      await ownerDecideReservation(s.id, accept, why);
      toast.success(accept ? 'Réservation confirmée — le client reçoit sa confirmation définitive.' : 'Réservation refusée — le client est prévenu et des alternatives lui sont proposées.');
      setRefusing(null); setReason('');
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const toConfirm = stays.filter(s => s.status === 'paid_awaiting_owner');
  const others = stays.filter(s => s.status !== 'paid_awaiting_owner' && s.status !== 'expired');

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Séjours réservés en ligne</h3>
        <span className="text-[11px] text-muted-foreground">Paiements en mode simulation</span>
      </div>

      {toConfirm.length > 0 && (
        <div className="space-y-2">
          {toConfirm.map(s => {
            const late = s.owner_respond_by && new Date(s.owner_respond_by) < new Date();
            return (
              <Card key={s.id} className="p-4 border-secondary/60 bg-secondary/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-muted-foreground">{s.confirmation_number}</p>
                    <h4 className="font-semibold text-sm text-foreground truncate">{s.property_title}</h4>
                    <p className="text-xs text-muted-foreground">{fmtStayDate(s.check_in)} → {fmtStayDate(s.check_out)} · {s.nights} nuit(s)</p>
                  </div>
                  <StayStatusBadge status={s.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.guests_count} pers. · {s.user_name}</span>
                  <span className="font-semibold text-foreground">{fmt(s.total_price)} FCFA</span>
                  {s.owner_respond_by && (
                    <span className={`flex items-center gap-1 ${late ? 'text-destructive font-semibold' : ''}`}>
                      <Clock className="h-3 w-3" /> Réponse avant le {new Date(s.owner_respond_by).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {s.message && <p className="mt-2 text-xs italic text-muted-foreground bg-muted/60 rounded p-2">« {s.message} »</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1 gap-1.5" disabled={busy === s.id} onClick={() => decide(s, true)}>
                    {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Confirmer la disponibilité
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive" disabled={busy === s.id} onClick={() => setRefusing(s)}>
                    <X className="h-3.5 w-3.5" /> Refuser
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {others.length === 0 && toConfirm.length === 0 ? (
        <Card className="p-5 text-center text-xs text-muted-foreground">Aucun séjour réservé en ligne pour le moment.</Card>
      ) : others.length > 0 && (
        <div className="space-y-2">
          {others.slice(0, 20).map(s => (
            <Card key={s.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{s.property_title}</p>
                  <p className="text-xs text-muted-foreground">{fmtStayDate(s.check_in)} → {fmtStayDate(s.check_out)} · {s.user_name} · {fmt(s.total_price)} FCFA</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StayStatusBadge status={s.status} />
                  <PaymentStatusBadge status={s.payments[0]?.status} />
                </div>
              </div>
              {s.receipts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.receipts.map(r => (
                    <Link key={r.id} to={`/recu/${r.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                      <FileText className="h-3 w-3" /> {RECEIPT_KIND_LABEL[r.kind]}{r.version > 1 ? ` v${r.version}` : ''}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!refusing} onOpenChange={o => { if (!o) { setRefusing(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser cette réservation ?</DialogTitle>
            <DialogDescription>Le client sera prévenu, le paiement simulé passera en « remboursement simulé » et des logements alternatifs lui seront proposés.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} maxLength={300} onChange={e => setReason(e.target.value)} placeholder="Motif (facultatif) : logement indisponible, travaux…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefusing(null)}>Retour</Button>
            <Button variant="destructive" disabled={busy === refusing?.id} onClick={() => refusing && decide(refusing, false, reason)}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
