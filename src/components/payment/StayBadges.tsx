import { Badge } from '@/components/ui/badge';
import { PAYMENT_STATUS_LABEL, STAY_STATUS_LABEL, type PaymentStatus, type StayStatus } from '@/lib/paymentLogic';

const STAY_TONE: Record<string, string> = {
  awaiting_payment: 'border-secondary/50 bg-secondary/10 text-secondary',
  paid_awaiting_owner: 'border-secondary bg-secondary/20 text-foreground',
  pending: 'border-secondary/50 bg-secondary/10 text-secondary',
  confirmed: 'border-primary bg-primary text-primary-foreground',
  refused: 'border-destructive/40 bg-destructive/10 text-destructive',
  expired: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
};

export function StayStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-[10px] ${STAY_TONE[status] ?? ''}`}>
      {STAY_STATUS_LABEL[status as StayStatus] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline" className="text-[10px] text-muted-foreground">{PAYMENT_STATUS_LABEL.not_initiated}</Badge>;
  const tone = status === 'simulated_validated' ? 'border-primary/40 bg-primary/10 text-primary'
    : status === 'simulated_refunded' ? 'border-secondary/40 bg-secondary/10 text-secondary'
    : status === 'simulated_failed' || status === 'otp_incorrect' ? 'border-destructive/40 bg-destructive/10 text-destructive'
    : 'text-muted-foreground';
  return <Badge variant="outline" className={`text-[10px] ${tone}`}>{PAYMENT_STATUS_LABEL[status as PaymentStatus] ?? status}</Badge>;
}

export const fmtStayDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
