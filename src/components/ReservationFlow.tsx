import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, Check, Download, Share2, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createReservation } from '@/lib/reservationsService';

interface Property {
  id: string;
  title: string;
  price: number;
  quartier: string;
  address?: string;
  images?: string[];
}

interface ReservationFlowProps {
  property: Property;
  onClose: () => void;
}

// Pricing tiers
const TIERS = [
  { min: 1, max: 2, discount: 0, name: 'Tarif standard' },
  { min: 3, max: 6, discount: 0.03, name: 'Tarif court séjour' },
  { min: 7, max: 13, discount: 0.06, name: 'Tarif semaine' },
  { min: 14, max: 29, discount: 0.08, name: 'Tarif quinzaine' },
  { min: 30, max: 999, discount: 0.10, name: 'Tarif mensuel' },
];

const getTier = (nights: number) => TIERS.find(t => nights >= t.min && nights <= t.max) || TIERS[0];
const getNextTier = (nights: number) => {
  const currentIdx = TIERS.findIndex(t => nights >= t.min && nights <= t.max);
  return currentIdx < TIERS.length - 1 ? TIERS[currentIdx + 1] : null;
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Simple calendar component
const MiniCalendar = ({
  month, year,
  checkIn, checkOut,
  bookedDates,
  onSelectDate,
  onPrevMonth, onNextMonth
}: {
  month: number; year: number;
  checkIn: Date | null; checkOut: Date | null;
  bookedDates: Set<string>;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));

  const dateKey = (d: Date) => d.toISOString().split('T')[0];

  const isInRange = (d: Date) => {
    if (!checkIn || !checkOut) return false;
    return d >= checkIn && d <= checkOut;
  };

  // Disable previous-month navigation if it would go into the past
  const canGoBack = (() => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastOfPrev = new Date(prevYear, prevMonth + 1, 0);
    return lastOfPrev >= today;
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevMonth}
          disabled={!canGoBack}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{MONTHS_FR[month]} {year}</span>
        <button onClick={onNextMonth} className="p-1 rounded hover:bg-muted" aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_FR.map(d => (
          <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
        ))}
        {days.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const key = dateKey(day);
          const isPast = day < today;
          // Hide past dates entirely (no rendering)
          if (isPast) return <span key={`p${i}`} />;
          const isBooked = bookedDates.has(key);
          const isDisabled = isBooked;
          const isCheckIn = checkIn && dateKey(day) === dateKey(checkIn);
          const isCheckOut = checkOut && dateKey(day) === dateKey(checkOut);
          const inRange = isInRange(day);

          let cellStyle: React.CSSProperties = {};
          let classes = 'w-8 h-8 rounded-md text-xs font-medium transition-colors ';

          if (isCheckIn || isCheckOut) {
            classes += 'bg-primary text-primary-foreground';
          } else if (inRange) {
            classes += 'bg-primary/15 text-primary';
          } else if (isBooked) {
            cellStyle = { background: '#fee2e2' };
            classes += 'text-destructive/70 cursor-not-allowed';
          } else {
            cellStyle = { background: '#d1fae5' };
            classes += 'hover:bg-primary/10 cursor-pointer';
          }

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectDate(day)}
              className={classes}
              style={cellStyle}
              aria-label={day.toLocaleDateString('fr-FR')}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#d1fae5', border: '1px solid #86efac' }} /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }} /> Réservé</span>
      </div>
    </div>
  );
};

const ReservationFlow = ({ property, onClose }: ReservationFlowProps) => {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeShown, setUpgradeShown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('partial');

  // Contact info (prefilled from profile when signed in, editable for guests)
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const { toast } = useToast();

  // Prefill contact info from auth profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setIsAuthed(true);
      // Default to auth metadata
      setContactEmail(user.email ?? '');
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      if (meta.full_name) setContactName(meta.full_name);
      if (meta.phone) setContactPhone(meta.phone);
      // Try profiles table for richer data
      const { data: profile } = await supabase
        .from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (cancelled || !profile) return;
      if (profile.full_name) setContactName(profile.full_name);
      if (profile.phone) setContactPhone(profile.phone);
    })();
    return () => { cancelled = true; };
  }, []);

  // Demo calendar statuses: reserved, available
  const { bookedDates, availableDates } = useMemo(() => {
    const booked = new Set<string>();
    const available = new Set<string>();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    // Days 1-5 reserved
    for (let d = 1; d <= 5; d++) booked.add(new Date(y, m, d).toISOString().split('T')[0]);
    // Days 8-20 available
    for (let d = 8; d <= 20; d++) available.add(new Date(y, m, d).toISOString().split('T')[0]);
    // Days 21-23 reserved
    for (let d = 21; d <= 23; d++) booked.add(new Date(y, m, d).toISOString().split('T')[0]);
    // Days 25+ available
    const lastDay = new Date(y, m + 1, 0).getDate();
    for (let d = 25; d <= lastDay; d++) available.add(new Date(y, m, d).toISOString().split('T')[0]);
    return { bookedDates: booked, availableDates: available };
  }, []);

  const isSameDay = (a: Date, b: Date) => a.toISOString().split('T')[0] === b.toISOString().split('T')[0];

  const handleSelectDate = (d: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(d);
      setCheckOut(null);
      setShowUpgrade(false);
      setUpgradeShown(false);
    } else if (checkIn && !checkOut) {
      if (isSameDay(d, checkIn)) {
        // Double-click same day = 1 night
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOut(nextDay);
      } else if (d < checkIn) {
        // Click before check-in = swap
        setCheckOut(checkIn);
        setCheckIn(d);
      } else {
        // Check no booked dates in range
        const current = new Date(checkIn);
        while (current <= d) {
          const key = current.toISOString().split('T')[0];
          if (bookedDates.has(key)) {
            toast({ title: 'Dates indisponibles', description: 'La plage sélectionnée inclut des jours déjà réservés.', variant: 'destructive' });
            return;
          }
          current.setDate(current.getDate() + 1);
        }
        setCheckOut(d);
      }
      // Show upgrade after 2 seconds
      if (!upgradeShown) {
        setTimeout(() => setShowUpgrade(true), 2000);
        setUpgradeShown(true);
      }
    }
  };

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const pricePerNight = Math.round(property.price / 30); // Monthly to nightly
  const tier = getTier(nights);
  const discountedPrice = Math.round(pricePerNight * (1 - tier.discount));
  const totalPrice = discountedPrice * nights;
  const nextTier = getNextTier(nights);

  const nextTierNights = nextTier ? nextTier.min : 0;
  const nextTierPrice = nextTier ? Math.round(pricePerNight * (1 - nextTier.discount)) : 0;
  const savings = nextTier ? (pricePerNight - nextTierPrice) * nextTierNights : 0;

  const handleUpgradeAccept = () => {
    if (checkIn && nextTier) {
      const newCheckOut = new Date(checkIn);
      newCheckOut.setDate(newCheckOut.getDate() + nextTierNights);
      setCheckOut(newCheckOut);
      setShowUpgrade(false);
    }
  };

  const reservationNumber = submittedId
    ? `RES-${submittedId.split('-')[0].toUpperCase()}`
    : `RES-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const formatDate = (d: Date | null) => d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/40 z-[800] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              {step === 1 && 'Choisir vos dates'}
              {step === 2 && 'Récapitulatif'}
              {step === 3 && 'Paiement'}
              {step === 4 && 'Confirmation'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicators */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <span key={s} className={`w-2 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
              ))}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ── STEP 1: Calendar ── */}
          {step === 1 && (
            <>
              <div className="text-xs text-muted-foreground mb-1">
                <strong className="text-foreground">{property.title}</strong> · {property.quartier}
              </div>

              <MiniCalendar
                month={calMonth}
                year={calYear}
                checkIn={checkIn}
                checkOut={checkOut}
                bookedDates={bookedDates}
                onSelectDate={handleSelectDate}
                onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              />

              <div className="text-xs text-muted-foreground">
                Check-in : <strong>14h00</strong> · Check-out : <strong>11h00</strong>
              </div>

              {nights > 0 && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{nights} nuit{nights > 1 ? 's' : ''} · {fmt(discountedPrice)} FCFA / nuit</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
                    <span>Total estimé</span>
                    <span className="text-primary">{fmt(totalPrice)} FCFA</span>
                  </div>
                  {tier.discount > 0 && (
                    <Badge className="bg-primary/10 text-primary text-xs">
                      🏷️ {tier.name}
                    </Badge>
                  )}
                </div>
              )}

              {/* Upgrade suggestion */}
              <AnimatePresence>
                {showUpgrade && nextTier && nights > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-accent/10 border border-accent/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏷️</span>
                      <span className="text-sm font-semibold text-foreground">{nextTier.name} disponible</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      En passant à {nextTierNights} nuits, votre nuitée passe à <strong className="text-foreground">{fmt(nextTierPrice)} FCFA</strong> au lieu de {fmt(pricePerNight)} FCFA.
                      <br />Vous gagnez <strong className="text-primary">{fmt(savings)} FCFA</strong> sur votre séjour.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpgradeAccept} className="flex-1 bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 mr-1" /> Je passe à {nextTierNights} nuits
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowUpgrade(false)} className="flex-1">
                        Garder {nights} nuits
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={() => setStep(2)}
                disabled={!checkIn || !checkOut}
                className="w-full bg-primary text-primary-foreground"
              >
                Continuer
              </Button>
            </>
          )}

          {/* ── STEP 2: Recap ── */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <img
                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                    className="w-20 h-16 rounded-lg object-cover"
                    alt=""
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{property.title}</h4>
                    <p className="text-xs text-muted-foreground">{property.address || property.quartier}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-medium text-foreground">{formatDate(checkIn)} à 14h00</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-medium text-foreground">{formatDate(checkOut)} à 11h00</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Durée</span><span className="font-medium text-foreground">{nights} nuit{nights > 1 ? 's' : ''}</span></div>
                  {tier.discount > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Tarif</span><Badge className="bg-primary/10 text-primary text-xs">{tier.name}</Badge></div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{fmt(totalPrice)} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Modifier
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground">
                  Payer
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && (
            <>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Mode de paiement</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'orange', label: '🟠 Orange Money', desc: 'Paiement mobile Orange' },
                      { id: 'moov', label: '🔵 Moov Money', desc: 'Paiement mobile Moov' },
                      { id: 'virement', label: '🏦 Virement bancaire', desc: 'Transfert bancaire' },
                    ].map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                          paymentMethod === pm.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground">{pm.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{pm.desc}</span>
                        {paymentMethod === pm.id && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Type de paiement</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentType('partial')}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        paymentType === 'partial' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:bg-muted/50'
                      }`}
                    >
                      Acompte 30%
                      <br /><span className="text-xs font-normal text-muted-foreground">{fmt(Math.round(totalPrice * 0.3))} FCFA</span>
                    </button>
                    <button
                      onClick={() => setPaymentType('full')}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        paymentType === 'full' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:bg-muted/50'
                      }`}
                    >
                      Paiement intégral
                      <br /><span className="text-xs font-normal text-muted-foreground">{fmt(totalPrice)} FCFA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Vos coordonnées (invité ou pré-rempli si connecté) ── */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Vos coordonnées
                  {!isAuthed && <span className="ml-2 text-[10px] font-normal text-muted-foreground">(en tant qu'invité)</span>}
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nom complet *"
                    value={contactName}
                    onChange={e => setContactName(e.target.value.slice(0, 100))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground"
                    maxLength={100}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone *"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value.slice(0, 30))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground"
                    maxLength={30}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email (optionnel)"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value.slice(0, 255))}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground"
                    maxLength={255}
                  />
                  <textarea
                    placeholder="Message à l'agent (optionnel)"
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value.slice(0, 500))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground resize-none"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={submitting}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
                <Button
                  onClick={async () => {
                    if (!paymentMethod) {
                      toast({ title: 'Choisissez un mode de paiement', variant: 'destructive' });
                      return;
                    }
                    if (!contactName.trim() || contactName.trim().length < 2) {
                      toast({ title: 'Nom requis', description: 'Merci d\'indiquer votre nom complet.', variant: 'destructive' });
                      return;
                    }
                    if (!contactPhone.trim() || contactPhone.trim().length < 6) {
                      toast({ title: 'Téléphone requis', description: 'Merci d\'indiquer un numéro joignable.', variant: 'destructive' });
                      return;
                    }
                    setSubmitting(true);
                    try {
                      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.id);
                      if (isUuid) {
                        const row = await createReservation({
                          property_id: property.id,
                          kind: 'booking',
                          start_date: checkIn ? checkIn.toISOString().split('T')[0] : null,
                          end_date: checkOut ? checkOut.toISOString().split('T')[0] : null,
                          guests_count: 1,
                          total_price: totalPrice,
                          contact_name: contactName,
                          contact_phone: contactPhone,
                          contact_email: contactEmail || null,
                          message: contactMessage || null,
                        });
                        setSubmittedId(row.id);
                      } else {
                        // Mock property (not in Supabase) — skip persistence, keep flow
                        console.info('[Reservation] Skipping Supabase persist for mock property', property.id);
                      }
                      setStep(4);
                    } catch (err: any) {
                      console.error('Reservation insert failed:', err);
                      toast({
                        title: 'Erreur d\'enregistrement',
                        description: err?.message ?? 'Réessayez dans un instant.',
                        variant: 'destructive',
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Envoi…</>
                  ) : (
                    <>Confirmer {fmt(paymentType === 'partial' ? Math.round(totalPrice * 0.3) : totalPrice)} FCFA</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 4: Confirmation ── */}
          {step === 4 && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Réservation confirmée !</h3>
                <p className="text-sm text-muted-foreground">N° {reservationNumber}</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bien</span><span className="font-medium text-foreground">{property.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-medium">{formatDate(checkIn)} à 14h00</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-medium">{formatDate(checkOut)} à 11h00</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Durée</span><span className="font-medium">{nights} nuits</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Montant payé</span><span className="font-bold text-primary">{fmt(paymentType === 'partial' ? Math.round(totalPrice * 0.3) : totalPrice)} FCFA</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><Badge className="bg-primary/10 text-primary">CONFIRMÉE</Badge></div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => toast({ title: '📥 Certificat', description: 'Le certificat PDF sera généré et téléchargé.' })}
                >
                  <Download className="h-3 w-3" /> Télécharger PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => toast({ title: '📤 Partage', description: 'Lien de partage WhatsApp copié.' })}
                >
                  <Share2 className="h-3 w-3" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => toast({ title: '📧 Email', description: 'Confirmation envoyée par email.' })}
                >
                  <Mail className="h-3 w-3" /> Email
                </Button>
              </div>

              <Button onClick={onClose} className="w-full bg-primary text-primary-foreground">
                Fermer
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationFlow;
