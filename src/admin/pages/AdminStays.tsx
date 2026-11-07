import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { STAY_STATUS_LABEL } from '@/lib/paymentLogic';
import {
  listAllStays, ownerDecideReservation, reissueReceipt, runBookingMaintenance, subscribeStays, RECEIPT_KIND_LABEL,
  type ReceiptRow, type StayBundle,
} from '@/lib/paymentsService';
import { getCalendarOccupancy, OCCUPANCY_LEGEND, occupancyByNight, type OccupancyState } from '@/lib/reservationsPublicService';
import { StayStatusBadge, PaymentStatusBadge, fmtStayDate } from '@/components/payment/StayBadges';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AdminStays() {
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Séjours, paiements & reçus" subtitle="Réservations en ligne, paiements simulés, reçus et disponibilités de tous les logements." />
      <Tabs defaultValue="stays">
        <TabsList>
          <TabsTrigger value="stays">Séjours</TabsTrigger>
          <TabsTrigger value="availability">Disponibilités</TabsTrigger>
        </TabsList>
        <TabsContent value="stays" className="mt-4"><StaysTable /></TabsContent>
        <TabsContent value="availability" className="mt-4"><AvailabilityGrid /></TabsContent>
      </Tabs>
    </div>
  );
}

function StaysTable() {
  const { isAdmin, isReadOnlyAdmin } = useAuth();
  const canWrite = isAdmin && !isReadOnlyAdmin;
  const [rows, setRows] = useState<StayBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [reissue, setReissue] = useState<ReceiptRow | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try { setRows(await listAllStays()); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    runBookingMaintenance().finally(load);
    const off = subscribeStays('admin', load);
    return off;
  }, [load]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter(r => (status === 'all' || r.status === status)
      && (!n || `${r.confirmation_number} ${r.property_title} ${r.user_name} ${r.user_phone} ${r.payments.map(p => p.transaction_ref).join(' ')}`.toLowerCase().includes(n)));
  }, [rows, status, q]);

  const counts = useMemo(() => ({
    awaiting: rows.filter(r => r.status === 'paid_awaiting_owner').length,
    validated: rows.reduce((s, r) => s + r.payments.filter(p => p.status === 'simulated_validated').length, 0),
    refunds: rows.reduce((s, r) => s + r.payments.filter(p => p.status === 'simulated_refunded').length, 0),
    confirmed: rows.filter(r => r.status === 'confirmed').length,
  }), [rows]);

  const decide = async (r: StayBundle, accept: boolean) => {
    setBusy(r.id);
    try { await ownerDecideReservation(r.id, accept, accept ? undefined : 'Refus enregistré par l’administration'); toast.success(accept ? 'Séjour confirmé' : 'Séjour refusé'); load(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          ['Attente propriétaire', counts.awaiting], ['Paiements simulés validés', counts.validated],
          ['Remboursements simulés', counts.refunds], ['Séjours confirmés', counts.confirmed],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
            <p className="text-2xl font-bold text-foreground">{v as number}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Référence, logement, client, transaction…" className="pl-9 bg-card" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[220px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STAY_STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load} aria-label="Actualiser"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-2.5">Réservation</th><th className="p-2.5">Logement</th><th className="p-2.5">Client</th>
                <th className="p-2.5">Dates</th><th className="p-2.5 text-right">Total</th><th className="p-2.5">Statuts</th>
                <th className="p-2.5">Paiement</th><th className="p-2.5">Reçus</th><th className="p-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Aucun séjour.</td></tr>}
              {filtered.map(r => {
                const p = r.payments[0];
                return (
                  <tr key={r.id} className="align-top">
                    <td className="p-2.5 font-mono">{r.confirmation_number}<div className="text-[10px] text-muted-foreground font-sans">{new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></td>
                    <td className="p-2.5 max-w-[180px]"><Link to={`/property/${r.property_id}`} target="_blank" className="font-semibold hover:underline line-clamp-2">{r.property_title}</Link><div className="text-muted-foreground">{r.property_quartier}</div></td>
                    <td className="p-2.5">{r.user_name}<div className="text-muted-foreground">{r.user_phone}</div></td>
                    <td className="p-2.5 whitespace-nowrap">{fmtStayDate(r.check_in)}<br />→ {fmtStayDate(r.check_out)}</td>
                    <td className="p-2.5 text-right font-semibold whitespace-nowrap">{fmt(r.total_price)} F</td>
                    <td className="p-2.5"><StayStatusBadge status={r.status} />{r.owner_respond_by && r.status === 'paid_awaiting_owner' && <div className="mt-1 text-[10px] text-muted-foreground">avant {new Date(r.owner_respond_by).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}</td>
                    <td className="p-2.5"><PaymentStatusBadge status={p?.status} />{p && <div className="mt-1 text-[10px] text-muted-foreground font-mono">{p.transaction_ref}<br />{p.operator === 'orange_money' ? 'Orange Money' : 'Moov Money'} · {p.receiver_number}</div>}</td>
                    <td className="p-2.5 space-y-1">
                      {r.receipts.map(rc => (
                        <div key={rc.id} className="flex items-center gap-1">
                          <Link to={`/recu/${rc.id}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline"><FileText className="h-3 w-3" />{rc.kind === 'payment_ack' ? 'Accusé' : 'Confirmation'}{rc.version > 1 ? ` v${rc.version}` : ''}</Link>
                          {canWrite && <button type="button" className="text-[10px] text-muted-foreground hover:text-foreground underline" onClick={() => setReissue(rc)}>corriger</button>}
                        </div>
                      ))}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {canWrite && r.status === 'paid_awaiting_owner' && (
                        <div className="flex flex-col gap-1">
                          <Button size="sm" className="h-7 text-[11px]" disabled={busy === r.id} onClick={() => decide(r, true)}>Confirmer</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive" disabled={busy === r.id} onClick={() => decide(r, false)}>Refuser</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!reissue} onOpenChange={o => { if (!o) { setReissue(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Émettre un document rectificatif</DialogTitle>
            <DialogDescription>Le reçu {reissue?.receipt_number} reste inchangé ; une nouvelle version traçable est créée avec le motif indiqué.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={300} placeholder="Motif de la correction" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReissue(null)}>Annuler</Button>
            <Button disabled={reason.trim().length < 3} onClick={async () => {
              if (!reissue) return;
              try { const id = await reissueReceipt(reissue.id, reason); toast.success('Nouvelle version émise'); setReissue(null); setReason(''); load(); window.open(`/recu/${id}`, '_blank'); }
              catch (e: any) { toast.error(e.message); }
            }}>Émettre la version {(reissue?.version ?? 1) + 1}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-[10px] text-muted-foreground">Tous les paiements affichés sont des simulations : aucun fonds réel n'a été reçu. Libellés : {Object.values(RECEIPT_KIND_LABEL).join(' / ')}.</p>
    </div>
  );
}

const DAYS = 21;
function AvailabilityGrid() {
  const [start, setStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [props, setProps] = useState<Array<{ id: string; title: string; quartier: string }>>([]);
  const [occ, setOcc] = useState<Record<string, Map<string, OccupancyState>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('properties').select('id,title,quartier').eq('admin_status', 'published').order('title').limit(60);
      const list = (data ?? []) as Array<{ id: string; title: string; quartier: string }>;
      setProps(list);
      const entries = await Promise.all(list.map(async p => [p.id, occupancyByNight(await getCalendarOccupancy(p.id))] as const));
      setOcc(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; }), [start]);
  const tone = (s?: OccupancyState) => OCCUPANCY_LEGEND.find(l => l.state === (s ?? 'available'))?.className ?? '';
  const shift = (n: number) => setStart(d => { const x = new Date(d); x.setDate(x.getDate() + n); return x; });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => shift(-7)} aria-label="Semaine précédente"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => shift(7)} aria-label="Semaine suivante"><ChevronRight className="h-4 w-4" /></Button>
          <span className="ml-2 text-sm font-semibold text-foreground">{days[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {days[DAYS - 1].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {OCCUPANCY_LEGEND.map(l => <span key={l.state} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-sm ${l.className}`} />{l.label}</span>)}
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="text-[10px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card p-2 text-left min-w-[180px]">Logement</th>
                {days.map(d => <th key={key(d)} className={`p-1 w-7 text-center font-medium ${d.getDay() === 0 || d.getDay() === 6 ? 'text-secondary' : 'text-muted-foreground'}`}>{d.getDate()}<br />{['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()]}</th>)}
              </tr>
            </thead>
            <tbody>
              {props.length === 0 && <tr><td colSpan={DAYS + 1} className="p-6 text-center text-muted-foreground">Aucun logement publié.</td></tr>}
              {props.map(p => (
                <tr key={p.id} className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-2"><p className="font-semibold text-foreground truncate max-w-[200px]">{p.title}</p><p className="text-muted-foreground">{p.quartier}</p></td>
                  {days.map(d => { const s = occ[p.id]?.get(key(d)); return <td key={key(d)} className="p-0.5"><div title={OCCUPANCY_LEGEND.find(l => l.state === (s ?? 'available'))?.label} className={`h-6 w-6 rounded-sm ${tone(s)}`} /></td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
