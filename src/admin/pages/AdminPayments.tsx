import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import { useAuth } from '@/hooks/useAuth';
import { buildTransferSyntax, DEFAULT_OPERATORS, type PaymentOperator } from '@/lib/paymentLogic';
import { getPaymentOperators, getSetting, saveSetting } from '@/lib/paymentsService';

export default function AdminPayments() {
  const { isAdmin, isReadOnlyAdmin } = useAuth();
  const canWrite = isAdmin && !isReadOnlyAdmin;
  const [ops, setOps] = useState<PaymentOperator[]>(DEFAULT_OPERATORS);
  const [otp, setOtp] = useState('123456');
  const [holdMin, setHoldMin] = useState(10);
  const [ownerHours, setOwnerHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getPaymentOperators(), getSetting('payment_demo_otp', '123456'), getSetting('booking_hold_minutes', 10), getSetting('owner_response_hours', 24),
    ]).then(([o, code, h, oh]) => { setOps(o); setOtp(String(code)); setHoldMin(Number(h)); setOwnerHours(Number(oh)); }).finally(() => setLoading(false));
  }, []);

  const upd = (i: number, patch: Partial<PaymentOperator>) => setOps(list => list.map((o, j) => j === i ? { ...o, ...patch } : o));

  const save = async () => {
    for (const o of ops) {
      if (!/^\d{8}$/.test(o.receiver.trim())) { toast.error(`${o.name} : numéro de réception à 8 chiffres requis.`); return; }
      if (!o.syntax.startsWith('TEST-')) { toast.error(`${o.name} : la syntaxe doit commencer par « TEST- » (simulation).`); return; }
    }
    if (!/^\d{6}$/.test(otp)) { toast.error('Le code de test doit comporter 6 chiffres.'); return; }
    if (holdMin < 5 || holdMin > 60) { toast.error('Protection des dates : entre 5 et 60 minutes.'); return; }
    if (ownerHours < 1 || ownerHours > 72) { toast.error('Délai propriétaire : entre 1 et 72 heures.'); return; }
    setSaving(true);
    try {
      await saveSetting('payment_operators', ops.map(o => ({ ...o, receiver: o.receiver.trim() })));
      await saveSetting('payment_demo_otp', otp);
      await saveSetting('booking_hold_minutes', holdMin);
      await saveSetting('owner_response_hours', ownerHours);
      toast.success('Réglages enregistrés');
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-5">
      <AdminPageHeader
        title="Paiements & réservations"
        subtitle="Mode simulation : aucun transfert réel n'est déclenché."
        actions={canWrite && <Button onClick={save} disabled={saving} className="gap-1.5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer</Button>}
      />

      {ops.map((o, i) => (
        <section key={o.code} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{o.name}</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">Actif <Switch checked={o.enabled !== false} disabled={!canWrite} onCheckedChange={v => upd(i, { enabled: v })} /></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Labeled label="Numéro de réception SapSapHouse"><Input value={o.receiver} disabled={!canWrite} inputMode="numeric" maxLength={8} onChange={e => upd(i, { receiver: e.target.value.replace(/\D/g, '') })} /></Labeled>
            <Labeled label="Nom affiché"><Input value={o.display_name} disabled={!canWrite} maxLength={40} onChange={e => upd(i, { display_name: e.target.value })} /></Labeled>
          </div>
          <Labeled label="Syntaxe fictive ({RECEIVER}, {AMOUNT}, {REF})"><Input value={o.syntax} disabled={!canWrite} className="font-mono text-xs" onChange={e => upd(i, { syntax: e.target.value })} /></Labeled>
          <p className="text-[11px] text-muted-foreground">Aperçu : <code className="font-mono">{buildTransferSyntax(o, 25000, 'TXOMAB12CD34')}</code></p>
        </section>
      ))}

      <section className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-3 gap-3">
        <Labeled label="Code de test (OTP fictif)"><Input value={otp} disabled={!canWrite} inputMode="numeric" maxLength={6} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} /></Labeled>
        <Labeled label="Protection des dates (minutes)"><Input type="number" min={5} max={60} value={holdMin} disabled={!canWrite} onChange={e => setHoldMin(Number(e.target.value))} /></Labeled>
        <Labeled label="Délai de réponse propriétaire (heures)"><Input type="number" min={1} max={72} value={ownerHours} disabled={!canWrite} onChange={e => setOwnerHours(Number(e.target.value))} /></Labeled>
      </section>
      <p className="text-[11px] text-muted-foreground">Les canaux WhatsApp, SMS et email sont enregistrés comme « simulation, non envoyé » tant qu'aucun service d'envoi n'est connecté.</p>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
