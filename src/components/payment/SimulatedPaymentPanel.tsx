import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Loader2, RotateCcw, ShieldAlert, Smartphone, Timer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { buildTransferSyntax, secondsLeft, type PaymentOperator } from '@/lib/paymentLogic';
import {
  confirmSimulatedPayment, getPaymentOperators, getSetting, initiateSimulatedPayment, type PaymentRow,
} from '@/lib/paymentsService';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export interface PayableStay {
  id: string;
  confirmation_number: string;
  total_price: number;
  hold_expires_at: string | null;
  property_title: string;
}

type Step = 'choose' | 'transfer' | 'otp' | 'done' | 'failed' | 'expired';

export default function SimulatedPaymentPanel({
  stay, defaultPhone = '', onValidated, onRestartBooking,
}: {
  stay: PayableStay;
  defaultPhone?: string;
  onValidated?: (receiptId: string | null) => void;
  onRestartBooking?: () => void;
}) {
  const [operators, setOperators] = useState<PaymentOperator[]>([]);
  const [opCode, setOpCode] = useState<string>('');
  const [phone, setPhone] = useState(defaultPhone);
  const [step, setStep] = useState<Step>('choose');
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('123456');
  const [busy, setBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [left, setLeft] = useState(() => secondsLeft(stay.hold_expires_at));

  useEffect(() => {
    getPaymentOperators().then(list => {
      const enabled = list.filter(o => o.enabled !== false);
      setOperators(enabled);
      if (enabled[0]) setOpCode(c => c || enabled[0].code);
    });
    getSetting<string>('payment_demo_otp', '123456').then(v => setDemoOtp(String(v)));
  }, []);

  useEffect(() => {
    if (step === 'done') return;
    const t = setInterval(() => {
      const s = secondsLeft(stay.hold_expires_at);
      setLeft(s);
      if (s <= 0) setStep(cur => (cur === 'done' ? cur : 'expired'));
    }, 1000);
    return () => clearInterval(t);
  }, [stay.hold_expires_at, step]);

  const op = operators.find(o => o.code === opCode);
  const syntax = useMemo(
    () => (op && payment ? buildTransferSyntax(op, payment.amount, payment.transaction_ref) : ''),
    [op, payment],
  );

  const start = async () => {
    if (!op) return;
    if (phone.replace(/\D/g, '').length < 8) { toast.error('Numéro de téléphone invalide (8 chiffres minimum).'); return; }
    setBusy(true);
    try {
      const p = await initiateSimulatedPayment(stay.id, op.code, phone.trim());
      setPayment(p); setOtp(''); setOtpError(null); setStep('transfer');
    } catch (e: any) {
      if (/expir/i.test(e.message)) setStep('expired'); else toast.error(e.message);
    } finally { setBusy(false); }
  };

  const validate = async () => {
    if (!payment || otp.length < 6) return;
    setBusy(true); setOtpError(null);
    try {
      const r = await confirmSimulatedPayment(payment.id, otp);
      if (r.status === 'validated' || r.status === 'already_validated') {
        setReceiptId(r.receipt_id); setStep('done'); onValidated?.(r.receipt_id);
        import('@/lib/celebrate').then(m => m.celebrateReservation()).catch(() => {});
      } else if (r.status === 'otp_incorrect') {
        setOtp(''); setOtpError(`Code incorrect. ${r.attempts_left} essai(s) restant(s).`);
      } else if (r.status === 'simulated_failed') {
        setStep('failed');
      } else if (r.status === 'expired') {
        setStep('expired');
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const restart = () => { setPayment(null); setOtp(''); setOtpError(null); setStep('choose'); };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-start gap-2 rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-xs">
        <ShieldAlert className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-foreground">
          <strong>Mode simulation.</strong> Aucun argent réel n'est transféré et aucun code n'est exécuté.
          Ne communiquez jamais votre code PIN Mobile Money.
        </p>
      </div>

      {step !== 'done' && (
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Montant à régler</span>
          <span className="font-bold text-primary text-sm">{fmt(stay.total_price)} FCFA</span>
          <span className={`flex items-center gap-1 font-semibold tabular-nums ${left < 120 ? 'text-destructive' : 'text-foreground'}`}>
            <Timer className="h-3.5 w-3.5" /> {mm}:{ss}
          </span>
        </div>
      )}

      {step === 'choose' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-foreground">Votre numéro Mobile Money</label>
          <Input type="tel" inputMode="tel" value={phone} maxLength={20} placeholder="70 00 00 00" onChange={e => setPhone(e.target.value)} />
          <p className="text-xs font-semibold text-foreground pt-1">Choisissez l'opérateur</p>
          <div className="grid grid-cols-2 gap-2">
            {operators.map(o => (
              <button
                key={o.code}
                type="button"
                onClick={() => setOpCode(o.code)}
                aria-pressed={opCode === o.code}
                className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${opCode === o.code ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black ${o.code === 'orange_money' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {o.code === 'orange_money' ? 'OM' : 'MV'}
                </span>
                <p className="mt-2 text-sm font-semibold text-foreground">{o.name}</p>
                <p className="text-[10px] text-muted-foreground">Mode simulation</p>
              </button>
            ))}
          </div>
          <Button onClick={start} disabled={busy || !op} className="w-full h-11">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smartphone className="h-4 w-4 mr-2" /> Préparer le paiement simulé</>}
          </Button>
        </div>
      )}

      {step === 'transfer' && payment && op && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-3 space-y-1.5 text-sm">
            <Row label="Opérateur" value={op.name} />
            <Row label="Bénéficiaire" value={op.display_name || 'SapSapHouse'} />
            <Row label="Numéro de réception" value={payment.receiver_number} />
            <Row label="Montant" value={`${fmt(payment.amount)} FCFA`} />
            <Row label="Référence" value={payment.transaction_ref} mono />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Syntaxe de transfert (fictive, non exécutable)</p>
            <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
              <code className="flex-1 break-all text-xs font-mono text-foreground select-all">{syntax}</code>
              <Button
                type="button" size="sm" variant="outline" className="shrink-0 gap-1"
                onClick={() => navigator.clipboard?.writeText(syntax).then(() => toast.success('Syntaxe copiée'), () => toast.error('Copie impossible'))}
              >
                <Copy className="h-3.5 w-3.5" /> Copier
              </Button>
            </div>
          </div>
          <Button onClick={() => setStep('otp')} className="w-full h-11">Simuler le transfert</Button>
          <Button variant="ghost" onClick={restart} className="w-full h-9 text-xs">Changer d'opérateur</Button>
        </div>
      )}

      {step === 'otp' && payment && (
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold text-foreground">Confirmation fictive {op?.name}</p>
          <p className="text-xs text-muted-foreground">
            Saisissez le code de test <strong className="text-foreground font-mono">{demoOtp}</strong>.
            Ce code sert uniquement à la démonstration — ce n'est pas votre code PIN.
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} aria-label="Code de test">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {otpError && <p className="text-xs font-semibold text-destructive">{otpError}</p>}
          <Button onClick={validate} disabled={busy || otp.length < 6} className="w-full h-11">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider le paiement simulé'}
          </Button>
          <Button variant="ghost" onClick={restart} className="w-full h-9 text-xs gap-1"><RotateCcw className="h-3 w-3" /> Recommencer la simulation</Button>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <p className="text-base font-bold text-foreground">Paiement simulé validé</p>
          <p className="text-xs text-muted-foreground">
            Aucun argent réel n'a été reçu. SapSapHouse vérifie maintenant la disponibilité ;
            vous recevrez une notification dès la confirmation.
          </p>
          {receiptId && (
            <Link to={`/recu/${receiptId}`} className="inline-flex w-full">
              <Button variant="outline" className="w-full gap-2"><FileText className="h-4 w-4" /> Voir l'accusé de paiement</Button>
            </Link>
          )}
        </div>
      )}

      {step === 'failed' && (
        <div className="space-y-3 text-center">
          <p className="text-sm font-bold text-destructive">Simulation échouée</p>
          <p className="text-xs text-muted-foreground">Trop de codes incorrects. Vous pouvez recommencer tant que vos dates sont protégées.</p>
          <Button onClick={restart} className="w-full gap-1"><RotateCcw className="h-4 w-4" /> Recommencer la simulation</Button>
        </div>
      )}

      {step === 'expired' && (
        <div className="space-y-3 text-center">
          <p className="text-sm font-bold text-destructive">Protection des dates expirée</p>
          <p className="text-xs text-muted-foreground">Le délai de paiement est dépassé et les dates ont été libérées. Relancez une réservation pour continuer.</p>
          {onRestartBooking && <Button onClick={onRestartBooking} className="w-full">Refaire une réservation</Button>}
        </div>
      )}

      <p className="text-[10px] text-center text-muted-foreground">Réservation {stay.confirmation_number} · {stay.property_title}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold text-foreground text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
