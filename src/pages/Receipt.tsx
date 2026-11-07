import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Printer, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageSeo from '@/components/PageSeo';
import { useAuth } from '@/hooks/useAuth';
import { getReceipt, getReceiptVersions, RECEIPT_KIND_LABEL, type ReceiptRow } from '@/lib/paymentsService';
import { PAYMENT_STATUS_LABEL, type PaymentStatus } from '@/lib/paymentLogic';
import logo from '@/assets/sapsap-logo-full.png';

const fmt = (n: unknown) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n) || 0);
const d = (iso?: string | null) => iso ? new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const dt = (iso?: string | null) => iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ReceiptPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromAccount = !!(location.state as { fromAccount?: boolean } | null)?.fromAccount;
  // Opened from "Mes séjours": step back to it. Otherwise replace this page with
  // "Mes séjours" so the account's own back button never returns to the receipt.
  const backToStays = () => {
    if (fromAccount && ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0) navigate(-1);
    else navigate('/mon-compte?tab=sejours', { replace: true });
  };
  const { user, loading } = useAuth();
  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);
  const [versions, setVersions] = useState<ReceiptRow[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!user) return;
    setState('loading');
    getReceipt(id).then(async r => {
      setReceipt(r);
      setState(r ? 'ready' : 'missing');
      if (r) setVersions(await getReceiptVersions(r.reservation_id, r.kind));
    }).catch(() => setState('missing'));
  }, [id, user]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to={`/auth?redirect=/recu/${id}`} replace />;

  const c = receipt?.content ?? {};
  const latest = versions[0];
  const isSuperseded = receipt && latest && latest.id !== receipt.id;
  const nightsDetail: Array<{ date: string; price: number; label?: string | null }> = Array.isArray(c.price_detail?.detail) ? c.price_detail.detail : [];

  const download = () => {
    const el = document.getElementById('receipt-doc');
    if (!el || !receipt) return;
    const css = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).map(n => n.outerHTML).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${receipt.receipt_number}</title>${css}</head><body class="bg-background p-6">${el.outerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SapSapHouse-${receipt.receipt_number}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="min-h-screen bg-muted/40 print:bg-background">
      <PageSeo title="Reçu | SapSapHouse" description="Justificatif SapSapHouse de votre réservation." path={`/recu/${id}`} heading="Reçu SapSapHouse" />
      <header className="print:hidden sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={backToStays} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Mes séjours
          </button>
          <div className="flex-1" />
          {receipt && <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={download}><Download className="h-4 w-4" /><span className="hidden sm:inline">Télécharger</span></Button>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" /><span className="hidden sm:inline">Imprimer / PDF</span></Button>
          </>}
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-3 sm:px-4 py-6 print:p-0">
        {state === 'loading' && <div className="py-24 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {state === 'missing' && (
          <div className="rounded-2xl bg-card border border-border p-10 text-center">
            <p className="font-semibold text-foreground">Reçu introuvable</p>
            <p className="text-sm text-muted-foreground mt-1">Ce document n'existe pas ou ne vous est pas accessible.</p>
          </div>
        )}

        {receipt && state === 'ready' && (
          <>
            {isSuperseded && (
              <div className="print:hidden mb-3 rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-xs text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-secondary" />
                Une version plus récente existe.
                <Link to={`/recu/${latest.id}`} replace state={location.state} className="font-semibold text-primary underline">Voir la version {latest.version}</Link>
              </div>
            )}
            <article id="receipt-doc" className="rounded-2xl bg-card border border-border shadow-elevation-1 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
              <div className="bg-primary text-primary-foreground px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
                <div className="rounded-lg bg-card px-2 py-1"><img src={logo} alt="SapSapHouse" className="h-9 w-auto" /></div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">{c.platform || 'SapSapHouse'}</p>
                  <p className="text-base sm:text-lg font-bold">{c.document_title || RECEIPT_KIND_LABEL[receipt.kind]}</p>
                </div>
              </div>

              <div className="border-y-2 border-dashed border-secondary bg-secondary/10 px-5 sm:px-8 py-2.5 text-center">
                <p className="text-[11px] sm:text-xs font-black tracking-wide text-secondary">{c.status_label || 'JUSTIFICATIF DE PAIEMENT SIMULÉ — MODE TEST'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ce document ne constitue pas une preuve de réception réelle de fonds.</p>
              </div>

              <div className="px-5 sm:px-8 py-6 space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="N° de reçu" value={receipt.receipt_number} mono />
                  <Field label="Émis le" value={dt(receipt.issued_at)} />
                  <Field label="Réservation" value={c.reservation_ref} mono />
                  <Field label="Version" value={receipt.version > 1 ? `${receipt.version} (rectificatif)` : '1'} />
                </div>
                {receipt.correction_reason && (
                  <p className="rounded-lg bg-muted p-3 text-xs"><strong>Motif de la correction :</strong> {receipt.correction_reason}</p>
                )}

                <Section title="Logement">
                  <p className="font-semibold text-foreground">{c.property_title}</p>
                  <p className="text-muted-foreground">{[c.quartier, c.city].filter(Boolean).join(', ')}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Réf. {String(c.property_id || '').slice(0, 8).toUpperCase()}</p>
                </Section>

                <Section title="Client">
                  <p className="font-semibold text-foreground">{c.client_name}</p>
                  <p className="text-muted-foreground">{c.client_phone}</p>
                </Section>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Arrivée" value={d(c.check_in)} />
                  <Field label="Départ" value={d(c.check_out)} />
                  <Field label="Durée" value={`${c.nights} nuit${Number(c.nights) > 1 ? 's' : ''}`} />
                </div>

                <Section title="Détail du prix">
                  {nightsDetail.length > 0 && nightsDetail.length <= 31 ? (
                    <ul className="divide-y divide-border">
                      {nightsDetail.map(n => (
                        <li key={n.date} className="flex justify-between py-1 text-xs">
                          <span className="text-muted-foreground">{d(n.date)}{n.label ? ` · ${n.label}` : ''}</span>
                          <span className="tabular-nums">{fmt(n.price)} FCFA</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">{c.nights} nuit(s)</p>
                  )}
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    <Line label="Sous-total" value={`${fmt(c.subtotal)} FCFA`} />
                    {Number(c.discount) !== 0 && <Line label="Réduction" value={`− ${fmt(Math.abs(Number(c.discount)))} FCFA`} />}
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span>Montant total</span><span className="text-primary">{fmt(c.total)} FCFA</span>
                    </div>
                  </div>
                </Section>

                <Section title="Paiement (simulation)">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Opérateur" value={c.operator_name || c.operator || '—'} />
                    <Field label="Numéro de réception" value={c.receiver_number || '—'} />
                    <Field label="Référence de transaction" value={c.transaction_ref || '—'} mono />
                    <Field label="Statut" value={PAYMENT_STATUS_LABEL[c.payment_status as PaymentStatus] || c.payment_status || '—'} />
                    <Field label="Simulation validée le" value={dt(c.payment_validated_at)} />
                    {receipt.kind === 'booking_confirmation' && <Field label="Confirmé par SapSapHouse" value={dt(c.owner_confirmed_at)} />}
                  </div>
                </Section>

                {receipt.kind === 'payment_ack' && (
                  <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    Cet accusé confirme uniquement la validation du parcours de paiement fictif. La disponibilité du logement
                    reste soumise à la confirmation de SapSapHouse.
                  </p>
                )}
              </div>

              <footer className="bg-muted/60 px-5 sm:px-8 py-3 text-[10px] text-muted-foreground flex justify-between gap-2">
                <span>SapSapHouse · sapsaphouse.com</span>
                <span>Document généré automatiquement — non modifiable</span>
              </footer>
            </article>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5">{title}</h3>
      {children}
    </section>
  );
}
function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-semibold text-foreground break-words ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value || '—'}</p>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{value}</span></div>;
}
