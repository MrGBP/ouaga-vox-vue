import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X, ChevronLeft, ChevronRight, Check, Minus, Plus, Loader2, Calendar as CalendarIcon, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  createPublicReservation,
  getReservedDates,
  expandReservedNights,
  type PublicReservationRow,
} from '@/lib/reservationsPublicService';
import { sendConfirmationEmail } from '@/lib/emailTemplates';
import { isTypeFurnished, pricePerNight as pricePerNightCalc } from '@/lib/mockData';
import { track } from '@/lib/analytics';
import { notifyOwner } from '@/lib/notifications';
import { openWhatsApp, openEmail, openCountrySupport, buildReservationOwnerMessage } from '@/lib/contact';
import { useCountryConfig } from '@/hooks/useCountryConfig';
import { MessageCircle, Mail, LifeBuoy } from 'lucide-react';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { hasBlockedConflict } from '@/lib/blockedDatesService';

interface Property {
  id: string;
  title: string;
  type?: string;
  price: number;
  quartier: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  agent_name?: string;
  agent_phone?: string;
  furnished?: boolean;
}

interface ReservationFlowProps {
  property: Property;
  onClose: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSameDay = (a: Date, b: Date) => toKey(a) === toKey(b);

// ── Calendrier d'un mois (style Trip.com / Booking) ──
const MonthCalendar = ({
  month, year, today,
  checkIn, checkOut,
  hoverDate,
  bookedNights,
  onSelectDate,
  onHoverDate,
}: {
  month: number; year: number; today: Date;
  checkIn: Date | null; checkOut: Date | null;
  hoverDate: Date | null;
  bookedNights: Set<string>;
  onSelectDate: (d: Date) => void;
  onHoverDate: (d: Date | null) => void;
}) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  // Range preview (hover)
  const previewEnd = !checkOut && hoverDate && checkIn && hoverDate > checkIn ? hoverDate : null;
  const rangeStart = checkIn;
  const rangeEnd = checkOut || previewEnd;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-3">
        <span className="text-sm font-semibold text-foreground">{MONTHS_FR[month]} {year}</span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAYS_FR.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-muted-foreground py-1">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const key = toKey(day);
          const isPast = day < today;
          const isBooked = bookedNights.has(key);
          const isToday = isSameDay(day, today);
          const isCheckIn = checkIn && isSameDay(day, checkIn);
          const isCheckOut = checkOut && isSameDay(day, checkOut);
          const inRange = rangeStart && rangeEnd && day > rangeStart && day < rangeEnd;
          const isExtremity = isCheckIn || isCheckOut;
          const isDisabled = isPast || isBooked;

          let cellClass = 'relative h-10 w-full flex flex-col items-center justify-center text-xs font-medium transition-colors ';
          let inner: React.ReactNode = day.getDate();

          if (isPast) {
            cellClass += 'text-muted-foreground/40 line-through cursor-not-allowed';
          } else if (isBooked) {
            cellClass += 'cursor-not-allowed';
            inner = (
              <>
                <span className="text-destructive/70 line-through">{day.getDate()}</span>
                <span className="text-[7px] leading-none text-destructive/70 font-semibold uppercase">Réservé</span>
              </>
            );
          } else if (isExtremity) {
            cellClass += 'bg-primary text-primary-foreground rounded-lg font-bold';
          } else if (inRange) {
            cellClass += 'bg-primary/10 text-primary rounded-none';
          } else if (isToday) {
            cellClass += 'text-primary font-bold border border-primary rounded-lg';
          } else {
            cellClass += 'text-foreground hover:bg-muted rounded-lg cursor-pointer';
          }

          const bgClass = isBooked && !isPast ? 'bg-[#fee2e2]' : '';

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectDate(day)}
              onMouseEnter={() => !isDisabled && onHoverDate(day)}
              onMouseLeave={() => onHoverDate(null)}
              className={`${cellClass} ${bgClass}`}
              aria-label={day.toLocaleDateString('fr-FR')}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Compteur voyageurs ──
const GuestCounter = ({ label, sub, value, onChange, min = 0 }: { label: string; sub?: string; value: number; onChange: (v: number) => void; min?: number }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const ReservationFlow = ({ property, onClose }: ReservationFlowProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const country = useCountryConfig();
  useLockBackdrop(true);


  const [step, setStep] = useState<1 | 2 | 3>(1);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Guest counter removed — single occupant by default
  const guestsCount = 1;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [bookedNights, setBookedNights] = useState<Set<string>>(new Set());
  const [conflict, setConflict] = useState<{ from: Date; next: Date | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<PublicReservationRow | null>(null);

  // Window viewport (responsive : 2 mois desktop, 1 mobile)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  useEffect(() => {
    const onR = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Load booked dates + prefill from auth
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await getReservedDates(property.id);
      if (cancelled) return;
      setBookedNights(expandReservedNights(rows));
    })();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setEmail(user.email ?? '');
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      if (meta.full_name) setName(meta.full_name);
      if (meta.phone) setPhone(meta.phone);
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (cancelled || !profile) return;
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
    })();
    return () => { cancelled = true; };
  }, [property.id]);

  // Find next free night after a given date
  const nextFreeNight = (from: Date): Date | null => {
    const cur = new Date(from);
    for (let i = 0; i < 365; i++) {
      cur.setDate(cur.getDate() + 1);
      if (!bookedNights.has(toKey(cur)) && cur >= today) return new Date(cur);
    }
    return null;
  };

  // Range contains a booked night ?
  const rangeHasBooked = (start: Date, end: Date): Date | null => {
    const cur = new Date(start);
    while (cur < end) {
      if (bookedNights.has(toKey(cur))) return new Date(cur);
      cur.setDate(cur.getDate() + 1);
    }
    return null;
  };

  const handleSelectDate = (d: Date) => {
    setConflict(null);
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(d);
      setCheckOut(null);
      return;
    }
    if (d <= checkIn) {
      setCheckIn(d);
      setCheckOut(null);
      return;
    }
    // Validate range
    const conflictDate = rangeHasBooked(checkIn, d);
    if (conflictDate) {
      setConflict({ from: conflictDate, next: nextFreeNight(conflictDate) });
      return;
    }
    setCheckOut(d);
  };

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
    : 0;

  const isFurnished = isTypeFurnished(property.type || '') || property.furnished || false;
  const nightlyPrice = isFurnished ? pricePerNightCalc(property.price) : Math.round(property.price / 30);
  const totalPrice = nightlyPrice * nights;

  const formatDate = (d: Date | null) => d ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '';
  const formatDateLong = (d: Date | null) => d ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const goPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const goNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const canGoBack = useMemo(() => {
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const lastOfPrev = new Date(prevYear, prevMonth + 1, 0);
    return lastOfPrev >= today;
  }, [calMonth, calYear, today]);

  const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

  const handleConfirm = async () => {
    if (!checkIn || !checkOut || nights === 0) return;
    if (!name.trim() || name.trim().length < 2) {
      toast({ title: 'Nom requis', variant: 'destructive' }); return;
    }
    if (!validEmail(email)) {
      toast({ title: 'Email invalide', variant: 'destructive' }); return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 6) {
      toast({ title: 'Téléphone requis', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    try {
      const { row, error } = await createPublicReservation({
        property_id: property.id,
        property_title: property.title,
        property_quartier: property.quartier,
        user_name: name.trim(),
        user_email: email.trim(),
        user_phone: phone.trim(),
        message: message.trim() || null,
        check_in: toKey(checkIn),
        check_out: toKey(checkOut),
        nights,
        guests_count: guestsCount,
        price_per_night: nightlyPrice,
        total_price: totalPrice,
      });
      if (error || !row) throw error || new Error('insert failed');
      // Génère + log l'email (envoi réel à brancher plus tard)
      sendConfirmationEmail(row, {
        id: property.id,
        title: property.title,
        quartier: property.quartier,
        address: property.address,
        image: property.images?.[0],
        latitude: property.latitude,
        longitude: property.longitude,
        agent_name: property.agent_name,
        agent_phone: property.agent_phone,
      });
      // Lot 3: notifier le propriétaire (in-app + email + WhatsApp deep link)
      notifyOwner({
        propertyId: property.id,
        reservationId: row.id,
        ownerPhone: property.agent_phone,
        ownerEmail: (property as any).agent_email,
        title: `Nouvelle réservation — ${property.title}`,
        body: `${name.trim()} a réservé du ${toKey(checkIn)} au ${toKey(checkOut)} (${nights} nuit${nights > 1 ? 's' : ''}).\nTél: ${phone.trim()}\nEmail: ${email.trim()}`,
        senderName: 'SapSapHouse',
      }).catch(() => { /* swallow */ });
      track('reservation_submitted', { property_id: property.id, nights, total: totalPrice });
      setSubmitted(row);
    } catch (err: any) {
      console.error('Reservation error', err);
      toast({ title: 'Erreur', description: err?.message ?? 'Réessayez.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendu écran de confirmation ──
  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-foreground/40 z-[800] flex items-center justify-center p-4">
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">{t('reservation.succes_titre')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('reservation.succes_numero')}</p>
            <p className="text-2xl font-bold text-primary tracking-wider mb-6">{submitted.confirmation_number}</p>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm text-left mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Bien</span><span className="font-semibold">{property.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('reservation.arrivee')}</span><span className="font-semibold">{formatDateLong(checkIn)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('reservation.depart')}</span><span className="font-semibold">{formatDateLong(checkOut)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Durée</span><span className="font-semibold">{nights} {t('reservation.nuits')}</span></div>
              <div className="flex justify-between pt-2 border-t border-border text-base font-bold"><span>{t('reservation.total')}</span><span className="text-primary">{fmt(totalPrice)} FCFA</span></div>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Pour accélérer la confirmation, notifie directement le propriétaire :
            </p>

            {(() => {
              const ownerMsg = buildReservationOwnerMessage({
                propertyTitle: property.title,
                clientName: name,
                clientPhone: phone,
                clientEmail: email,
                checkIn: checkIn ? formatDateLong(checkIn) : undefined,
                checkOut: checkOut ? formatDateLong(checkOut) : undefined,
                guests: guestsCount,
                totalPrice,
                currencySymbol: country.currency_symbol,
                confirmationNumber: submitted.confirmation_number,
              });
              return (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    type="button"
                    onClick={() => openWhatsApp(property.agent_phone, ownerMsg)}
                    disabled={!property.agent_phone}
                    className="h-11 bg-[#25D366] hover:bg-[#1ebd58] text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEmail({
                      to: (property as any).agent_email || country.support_email || '',
                      subject: `Réservation ${submitted.confirmation_number} — ${property.title}`,
                      body: ownerMsg,
                    })}
                    className="h-11"
                  >
                    <Mail className="h-4 w-4 mr-1.5" /> Email
                  </Button>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => openCountrySupport(country, `Réservation ${submitted.confirmation_number} — ${property.title}`)}
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 mb-3"
            >
              <LifeBuoy className="h-3 w-3" /> Besoin d'aide ? Contacter le service client {country.flag_emoji}
            </button>

            <Button onClick={onClose} className="w-full bg-primary text-primary-foreground">{t('reservation.fermer')}</Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/40 z-[800] flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-border"
      >
        {/* Header + progress */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" /> {t('reservation.titre')}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          {/* Steps */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
              <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>① {t('reservation.etape1')}</span>
              <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>② {t('reservation.etape2')}</span>
              <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground'}>③ {t('reservation.etape3')}</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{property.title}</strong> · {property.quartier}
              </p>

              {/* Calendar header navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goPrevMonth}
                  disabled={!canGoBack}
                  className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
                  aria-label="Mois précédent"
                ><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs text-muted-foreground">Sélectionnez votre arrivée puis votre départ</span>
                <button onClick={goNextMonth} className="p-1.5 rounded hover:bg-muted" aria-label="Mois suivant">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Calendars */}
              <div className="flex gap-4">
                <MonthCalendar
                  month={calMonth} year={calYear} today={today}
                  checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                  bookedNights={bookedNights}
                  onSelectDate={handleSelectDate}
                  onHoverDate={setHoverDate}
                />
                {isDesktop && (() => {
                  const nm = calMonth === 11 ? 0 : calMonth + 1;
                  const ny = calMonth === 11 ? calYear + 1 : calYear;
                  return (
                    <MonthCalendar
                      month={nm} year={ny} today={today}
                      checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                      bookedNights={bookedNights}
                      onSelectDate={handleSelectDate}
                      onHoverDate={setHoverDate}
                    />
                  );
                })()}
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> Sélectionné</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/10" /> Période</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#fee2e2]" /> Réservé</span>
              </div>

              {/* Conflict popup */}
              <AnimatePresence>
                {conflict && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-destructive mb-1">{t('reservation.indisponible_titre')}</p>
                      <p className="text-foreground/80">
                        La période sélectionnée inclut le <strong>{formatDateLong(conflict.from)}</strong> qui est déjà réservé.
                      </p>
                      {conflict.next && (
                        <p className="mt-1 text-foreground/80">
                          {t('reservation.prochaines_dispos')} : <strong>{formatDateLong(conflict.next)}</strong>
                        </p>
                      )}
                      <button onClick={() => setConflict(null)} className="mt-2 text-primary font-semibold hover:underline">Choisir d'autres dates</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected summary */}
              {checkIn && (
                <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('reservation.arrivee')}</p>
                    <p className="font-semibold">{formatDate(checkIn)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('reservation.depart')}</p>
                    <p className="font-semibold">{checkOut ? formatDate(checkOut) : '—'}</p>
                  </div>
                  {nights > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Durée</p>
                      <p className="font-semibold">{nights} {nights > 1 ? t('reservation.nuits') : t('reservation.nuit')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Guest counter removed per simplified flow */}

              <Button
                onClick={() => setStep(2)}
                disabled={!checkIn || !checkOut}
                className="w-full bg-primary text-primary-foreground h-11"
              >
                {t('reservation.continuer')}
              </Button>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div className="space-y-3">
              <input
                type="text" placeholder={t('reservation.nom_complet') + ' *'}
                value={name} onChange={e => setName(e.target.value.slice(0, 100))}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background"
              />
              <input
                type="email" placeholder={t('reservation.email') + ' *'}
                value={email} onChange={e => setEmail(e.target.value.slice(0, 255))}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background"
              />
              <input
                type="tel" placeholder={t('reservation.telephone') + ' *'}
                value={phone} onChange={e => setPhone(e.target.value.slice(0, 30))}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background"
              />
              <textarea
                placeholder={t('reservation.message_optionnel')}
                value={message} onChange={e => setMessage(e.target.value.slice(0, 500))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background resize-none"
              />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                  <ChevronLeft className="h-4 w-4 mr-1" /> {t('reservation.retour')}
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-11 bg-primary text-primary-foreground">
                  {t('reservation.continuer')}
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <img
                  src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'}
                  className="w-24 h-20 rounded-lg object-cover" alt=""
                />
                <div>
                  <h4 className="text-sm font-bold text-foreground">{property.title}</h4>
                  <p className="text-xs text-muted-foreground">{property.quartier}, Ouagadougou</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('reservation.arrivee')}</span><span className="font-semibold">{formatDateLong(checkIn)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('reservation.depart')}</span><span className="font-semibold">{formatDateLong(checkOut)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Durée</span><span className="font-semibold">{nights} {nights > 1 ? t('reservation.nuits') : t('reservation.nuit')}</span></div>
                
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between text-sm text-foreground">
                  <span>{nights} {nights > 1 ? t('reservation.nuits') : t('reservation.nuit')} × {fmt(nightlyPrice)} {(property as any).currency || 'FCFA'}</span>
                  <span className="font-semibold">{fmt(totalPrice)} {(property as any).currency || 'FCFA'}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-border text-base font-bold">
                  <span>{t('reservation.total')}</span>
                  <span className="text-primary">{fmt(totalPrice)} {(property as any).currency || 'FCFA'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleConfirm} disabled={submitting}
                  className="w-full bg-primary text-primary-foreground h-12 text-sm font-semibold"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi…</> : t('reservation.confirmer')}
                </Button>
                <button
                  disabled
                  className="w-full h-11 rounded-lg bg-muted/60 text-muted-foreground text-xs font-medium cursor-not-allowed"
                  title="Bientôt disponible"
                >
                  💳 Paiement mobile — {t('reservation.paiement_bientot')}
                </button>
                <Button variant="outline" onClick={() => setStep(2)} className="w-full h-9 text-xs">
                  <ChevronLeft className="h-3 w-3 mr-1" /> {t('reservation.retour')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationFlow;
