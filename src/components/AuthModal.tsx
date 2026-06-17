import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGeoCity } from '@/hooks/useGeoCity';

const BRAND = '#1a3560';

type Method = 'whatsapp' | 'email';
type Step = 'choose' | 'enter' | 'otp' | 'name';

interface CountryPhone {
  code: string;
  flag: string;
  dial: string;
  label: string;
}
const COUNTRIES: CountryPhone[] = [
  { code: 'BF', flag: '🇧🇫', dial: '+226', label: 'Burkina Faso' },
  { code: 'ML', flag: '🇲🇱', dial: '+223', label: 'Mali' },
  { code: 'GH', flag: '🇬🇭', dial: '+233', label: 'Ghana' },
];

interface AuthModalProps {
  open: boolean;
  reason?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// 6-case OTP input — TikTok style, paste auto, focus auto.
function OtpBoxes({ value, onChange, onComplete, disabled }: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Auto-focus first box on mount
    setTimeout(() => refs.current[0]?.focus(), 50);
  }, []);

  const setAt = (i: number, ch: string) => {
    const arr = value.split('');
    arr[i] = ch;
    while (arr.length < 6) arr.push('');
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (next.length === 6 && /^\d{6}$/.test(next)) onComplete(next);
  };

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setAt(i, '');
      return;
    }
    if (digits.length >= 6) {
      // Paste of full code
      const full = digits.slice(0, 6);
      onChange(full);
      refs.current[5]?.focus();
      if (/^\d{6}$/.test(full)) onComplete(full);
      return;
    }
    if (digits.length === 1) {
      setAt(i, digits);
      if (i < 5) refs.current[i + 1]?.focus();
    } else {
      // multi-digit paste from middle
      const chars = digits.split('');
      const arr = value.split('');
      while (arr.length < 6) arr.push('');
      for (let k = 0; k < chars.length && i + k < 6; k++) arr[i + k] = chars[k];
      const next = arr.join('').slice(0, 6);
      onChange(next);
      const nextIdx = Math.min(5, i + chars.length);
      refs.current[nextIdx]?.focus();
      if (next.length === 6 && /^\d{6}$/.test(next)) onComplete(next);
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={e => {
            const txt = e.clipboardData.getData('text');
            if (/\d/.test(txt)) {
              e.preventDefault();
              handleChange(0, txt);
            }
          }}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="w-11 h-14 rounded-xl border-2 text-center text-xl font-bold outline-none transition-all bg-white"
          style={{
            borderColor: value[i] ? BRAND : 'hsl(var(--border))',
            boxShadow: value[i] ? '0 0 0 3px rgba(26,53,96,.12)' : undefined,
          }}
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function AuthModal({ open, reason, onClose, onSuccess }: AuthModalProps) {
  useLockBackdrop(open);
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const { activeCity } = useGeoCity();
  const isEn = i18n.language?.startsWith('en');

  const T = {
    join: isEn ? 'Join SapSapHouse' : 'Rejoindre SapSapHouse',
    subtitle: isEn ? 'Sign in or sign up in less than 30 seconds.' : 'Connectez-vous ou créez votre compte en moins de 30 secondes.',
    with_whatsapp: isEn ? 'Continue with WhatsApp' : 'Continuer avec WhatsApp',
    with_email: isEn ? 'Continue with email' : "Continuer avec l'email",
    terms: isEn ? 'By continuing, you agree to our Terms and Privacy Policy.' : 'En continuant, vous acceptez les CGU et la politique de confidentialité.',
    phone_label: isEn ? 'WhatsApp number' : 'Numéro WhatsApp',
    email_label: 'Email',
    phone_ph: '70 12 34 56',
    email_ph: 'vous@exemple.com',
    send_code: isEn ? 'Send code' : 'Envoyer le code',
    sending: isEn ? 'Sending…' : 'Envoi…',
    enter_code: isEn ? 'Enter the 6-digit code' : 'Saisissez le code à 6 chiffres',
    code_sent_phone: isEn ? 'Code sent by WhatsApp to' : 'Code envoyé par WhatsApp au',
    code_sent_email: isEn ? 'Code sent by email to' : 'Code envoyé par email à',
    verifying: isEn ? 'Verifying…' : 'Vérification…',
    resend_in: isEn ? 'Resend in' : 'Renvoyer dans',
    resend: isEn ? 'Resend the code' : 'Renvoyer le code',
    name_q: isEn ? 'How should we call you?' : "Comment on vous appelle ?",
    name_ph: isEn ? 'Your first name' : 'Votre prénom',
    start: isEn ? 'Get started' : 'Commencer',
    err_phone: isEn ? 'Invalid number' : 'Numéro invalide',
    err_email: isEn ? 'Invalid email' : 'Email invalide',
    back: isEn ? 'Back' : 'Retour',
    change: isEn ? 'Change' : 'Modifier',
    connect_for: isEn ? 'Sign in to' : 'Connectez-vous pour',
  };

  // ---- State ----
  const defaultCountry = COUNTRIES.find(c => c.code === activeCity?.country) || COUNTRIES[0];
  const [step, setStep] = useState<Step>('choose');
  const [method, setMethod] = useState<Method>('whatsapp');
  const [country, setCountry] = useState<CountryPhone>(defaultCountry);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('choose');
      setMethod('whatsapp');
      setCountry(defaultCountry);
      setPhoneLocal(''); setEmail(''); setCode(''); setName('');
      setBusy(false); setResendIn(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Countdown for resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(x => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const fullPhone = `${country.dial}${phoneLocal.replace(/\D/g, '')}`;
  const target = method === 'whatsapp' ? fullPhone : email.trim();

  const sendCode = async () => {
    setBusy(true);
    try {
      if (method === 'whatsapp') {
        const digits = phoneLocal.replace(/\D/g, '');
        if (digits.length < 6 || digits.length > 14) { toast.error(T.err_phone); return; }
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: { channel: 'whatsapp' as any },
        });
        if (error) throw error;
      } else {
        const em = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast.error(T.err_email); return; }
        const { error } = await supabase.auth.signInWithOtp({
          email: em,
          options: { shouldCreateUser: true, emailRedirectTo: undefined },
        });
        if (error) throw error;
      }
      setStep('otp');
      setCode('');
      setResendIn(60);
      track('auth_otp_sent', { method, reason });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (token: string) => {
    setBusy(true);
    try {
      const { data, error } = await (method === 'whatsapp'
        ? supabase.auth.verifyOtp({ phone: fullPhone, token, type: 'sms' })
        : supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' }));
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('No session');
      track('auth_otp_verified', { method, reason });

      // Check if first connection (empty profile name)
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (!prof?.full_name) {
        setStep('name');
        setBusy(false);
        return;
      }
      toast.success(isEn ? 'Signed in' : 'Connecté');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? T.err_phone);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    const n = name.trim();
    if (n.length < 2) { toast.error(isEn ? 'Name too short' : 'Prénom trop court'); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: n }, { onConflict: 'id' });
      if (error) throw error;
      track('auth_profile_created', { reason });
      toast.success(isEn ? `Welcome, ${n}!` : `Bienvenue, ${n} !`);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  // ---- Screens ----
  const ChooseScreen = (
    <div className="space-y-3">
      <button
        onClick={() => { setMethod('whatsapp'); setStep('enter'); }}
        className="w-full h-14 rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2.5 transition active:scale-[0.98] shadow-sm"
        style={{ background: '#25D366' }}
      >
        <MessageCircle className="h-5 w-5" />
        {T.with_whatsapp}
      </button>
      <button
        onClick={() => { setMethod('email'); setStep('enter'); }}
        className="w-full h-14 rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2.5 transition active:scale-[0.98] shadow-sm"
        style={{ background: BRAND }}
      >
        <Mail className="h-5 w-5" />
        {T.with_email}
      </button>
      <p className="text-[11px] text-muted-foreground text-center pt-2 px-2">{T.terms}</p>
    </div>
  );

  const EnterScreen = (
    <div className="space-y-3">
      {method === 'whatsapp' ? (
        <>
          <label className="text-[12px] font-semibold text-foreground">{T.phone_label}</label>
          <div className="flex gap-2">
            <select
              value={country.code}
              onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) || COUNTRIES[0])}
              className="h-12 rounded-xl border bg-white px-2 text-[14px] font-semibold"
              style={{ minWidth: 110 }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="tel"
              autoFocus
              value={phoneLocal}
              onChange={e => setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder={T.phone_ph}
              className="flex-1 h-12 rounded-xl border px-3 text-[16px] outline-none focus:border-[#1a3560]"
            />
          </div>
        </>
      ) : (
        <>
          <label className="text-[12px] font-semibold text-foreground">{T.email_label}</label>
          <input
            type="email"
            inputMode="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={T.email_ph}
            className="w-full h-12 rounded-xl border px-3 text-[16px] outline-none focus:border-[#1a3560]"
          />
        </>
      )}
      <button
        onClick={sendCode}
        disabled={busy}
        className="w-full h-12 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 transition active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: BRAND }}
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {T.sending}</> : T.send_code}
      </button>
      <button
        onClick={() => setStep('choose')}
        className="w-full text-[12px] text-muted-foreground hover:text-foreground py-2"
      >
        ← {T.back}
      </button>
    </div>
  );

  const OtpScreen = (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-[13px] text-muted-foreground">
          {method === 'whatsapp' ? T.code_sent_phone : T.code_sent_email}
        </p>
        <p className="text-[14px] font-semibold text-foreground">{target}</p>
        <button
          onClick={() => setStep('enter')}
          className="text-[11px] underline underline-offset-2"
          style={{ color: BRAND }}
        >
          {T.change}
        </button>
      </div>
      <OtpBoxes
        value={code}
        onChange={setCode}
        onComplete={verifyCode}
        disabled={busy}
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {T.verifying}
        </div>
      )}
      <div className="text-center">
        {resendIn > 0 ? (
          <span className="text-[12px] text-muted-foreground">{T.resend_in} {resendIn}s</span>
        ) : (
          <button
            onClick={sendCode}
            disabled={busy}
            className="text-[13px] font-semibold disabled:opacity-50"
            style={{ color: BRAND }}
          >
            {T.resend}
          </button>
        )}
      </div>
    </div>
  );

  const NameScreen = (
    <div className="space-y-4">
      <label className="block text-[14px] font-semibold text-foreground text-center">{T.name_q}</label>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={T.name_ph}
        onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
        className="w-full h-12 rounded-xl border px-4 text-[16px] outline-none focus:border-[#1a3560] text-center"
      />
      <button
        onClick={saveName}
        disabled={busy || name.trim().length < 2}
        className="w-full h-12 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 transition active:scale-[0.98]"
        style={{ background: BRAND }}
      >
        {busy ? '…' : T.start}
      </button>
    </div>
  );

  const Body = (
    <>
      {step === 'choose' && ChooseScreen}
      {step === 'enter' && EnterScreen}
      {step === 'otp' && OtpScreen}
      {step === 'name' && NameScreen}
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {isMobile ? (
            <motion.div
              key="auth-mobile"
              className="fixed inset-0 z-[200] bg-white flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              <div className="flex items-center justify-between px-3 h-14 border-b border-border/60">
                <button
                  onClick={step === 'choose' ? onClose : () => setStep(step === 'name' ? 'choose' : step === 'otp' ? 'enter' : 'choose')}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted"
                  aria-label={T.back}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: BRAND }}>
                    <Building2 size={15} className="text-white" />
                  </div>
                  <span className="text-[14px] font-bold">SapSapHouse</span>
                </div>
                <button onClick={onClose} className="w-11 h-11 flex items-center justify-center"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
                <div className="max-w-[400px] mx-auto">
                  <h1 className="text-[22px] font-bold leading-tight text-center" style={{ color: BRAND }}>
                    {step === 'name' ? T.name_q : T.join}
                  </h1>
                  {step === 'choose' && (
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6 text-center">{T.subtitle}</p>
                  )}
                  {step === 'otp' && (
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6 text-center">{T.enter_code}</p>
                  )}
                  {(step === 'enter' || step === 'name') && <div className="h-6" />}

                  {reason && step === 'choose' && (
                    <div className="mb-5 px-3 py-2.5 rounded-xl text-[12px] text-center" style={{ background: '#f1f5f9', color: BRAND }}>
                      {T.connect_for} <span className="font-semibold">{reason}</span>
                    </div>
                  )}

                  {Body}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-desktop"
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
              <motion.div
                className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center mb-5">
                  <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center mb-2.5" style={{ background: BRAND }}>
                    <Building2 size={22} className="text-white" />
                  </div>
                  <h2 className="text-[18px] font-bold">{step === 'name' ? T.name_q : T.join}</h2>
                  {step === 'choose' && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 text-center">{T.subtitle}</p>
                  )}
                  {step === 'otp' && (
                    <p className="text-[12px] text-muted-foreground mt-0.5">{T.enter_code}</p>
                  )}
                  {reason && step === 'choose' && (
                    <p className="text-[12px] text-muted-foreground mt-2 text-center px-2">
                      {T.connect_for} <span className="font-medium text-foreground">{reason}</span>
                    </p>
                  )}
                </div>

                {step !== 'choose' && step !== 'name' && (
                  <button
                    onClick={() => setStep(step === 'otp' ? 'enter' : 'choose')}
                    className="mb-3 text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> {T.back}
                  </button>
                )}

                {Body}
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
