import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGeoCity } from '@/hooks/useGeoCity';
import { finalizeSignupProfile } from '@/lib/authProfile';

const BRAND = '#1a3560';

type Step = 'enter' | 'otp' | 'name';
type Mode = 'login' | 'signup';

interface CountryPhone {
  code: string;
  flag: string;
  dial: string;
  label: string;
}
const COUNTRIES: CountryPhone[] = [
  { code: 'BF', flag: '🇧🇫', dial: '+226', label: 'Burkina Faso' },
];

interface AuthModalProps {
  open: boolean;
  reason?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * « Rester connecté » décoché : la session ne survit pas à la fermeture
 * de l'onglet/du navigateur (on purge le token local au pagehide).
 */
function armSessionOnly() {
  const purge = () => {
    try {
      Object.keys(window.localStorage)
        .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        .forEach(k => window.localStorage.removeItem(k));
    } catch { /* stockage indisponible */ }
  };
  window.addEventListener('pagehide', purge, { once: true });
}

// 6-case OTP input — paste auto, focus auto.
function OtpBoxes({ value, onChange, onComplete, disabled }: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
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
    join: isEn ? 'Welcome to SapSapHouse' : 'Bienvenue sur SapSapHouse',
    subtitle: isEn ? 'Sign in or create your account in less than a minute.' : 'Connectez-vous ou créez votre compte en moins d\'une minute.',
    login_tab: isEn ? 'Sign in' : 'Connexion',
    signup_tab: isEn ? 'Sign up' : 'Inscription',
    email_label: 'Email',
    email_ph: 'vous@exemple.com',
    password_label: isEn ? 'Password' : 'Mot de passe',
    password_ph: '••••••••',
    firstname_ph: isEn ? 'First name' : 'Prénom',
    lastname_ph: isEn ? 'Last name' : 'Nom',
    stay: isEn ? 'Stay signed in' : 'Rester connecté',
    forgot: isEn ? 'Forgot password?' : 'Mot de passe oublié ?',
    reset_sent: isEn ? 'Reset link sent to' : 'Lien de réinitialisation envoyé à',
    login_cta: isEn ? 'Sign in' : 'Se connecter',
    signup_cta: isEn ? 'Create my account' : 'Créer mon compte',
    or_code: isEn ? 'or receive a code by email' : 'ou recevoir un code par email',
    send_code: isEn ? 'Send code' : 'Envoyer le code',
    sending: isEn ? 'Sending…' : 'Envoi…',
    enter_code: isEn ? 'Enter the 6-digit code' : 'Saisissez le code à 6 chiffres',
    code_sent_email: isEn ? 'Code sent by email to' : 'Code envoyé par email à',
    verifying: isEn ? 'Verifying…' : 'Vérification…',
    resend_in: isEn ? 'Resend in' : 'Renvoyer dans',
    resend: isEn ? 'Resend the code' : 'Renvoyer le code',
    name_q: isEn ? 'How should we call you?' : 'Comment on vous appelle ?',
    name_ph: isEn ? 'Your first name' : 'Votre prénom',
    start: isEn ? 'Get started' : 'Commencer',
    err_email: isEn ? 'Invalid email' : 'Email invalide',
    err_password: isEn ? 'Password: 6 characters min' : 'Mot de passe : 6 caractères min',
    err_name: isEn ? 'First and last name required' : 'Prénom et nom requis',
    back: isEn ? 'Back' : 'Retour',
    change: isEn ? 'Change' : 'Modifier',
    connect_for: isEn ? 'Sign in to' : 'Connectez-vous pour',
    confirm_sent: isEn ? 'A confirmation link was sent to' : 'Un lien de confirmation a été envoyé à',
    terms: isEn ? 'By continuing, you agree to our Terms and Privacy Policy.' : 'En continuant, vous acceptez les CGU et la politique de confidentialité.',
  };

  // ---- State ----
  const defaultCountry = COUNTRIES.find(c => c.code === activeCity?.country) || COUNTRIES[0];
  const [step, setStep] = useState<Step>('enter');
  const [mode, setMode] = useState<Mode>('login');
  const [country] = useState<CountryPhone>(defaultCountry);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('enter');
      setMode('login');
      setEmail(''); setPassword(''); setShowPassword(false);
      setFirstName(''); setLastName('');
      setStayLoggedIn(true);
      setCode(''); setName('');
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

  const validEmail = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

  const finishLogin = () => {
    if (!stayLoggedIn) armSessionOnly();
    toast.success(isEn ? 'Signed in' : 'Connecté');
    onSuccess?.();
    onClose();
  };

  // ---- Connexion par mot de passe ----
  const loginWithPassword = async () => {
    const em = email.trim();
    if (!validEmail(em)) { toast.error(T.err_email); return; }
    if (password.length < 6) { toast.error(T.err_password); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password });
      if (error) throw error;
      track('auth_signin_success', { reason });
      finishLogin();
    } catch (e: any) {
      toast.error(isEn ? 'Incorrect email or password' : 'Email ou mot de passe incorrect');
    } finally {
      setBusy(false);
    }
  };

  // ---- Inscription (prénom + nom + email + mot de passe) ----
  const signupWithPassword = async () => {
    const em = email.trim();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (firstName.trim().length < 2 || lastName.trim().length < 2) { toast.error(T.err_name); return; }
    if (!validEmail(em)) { toast.error(T.err_email); return; }
    if (password.length < 6) { toast.error(T.err_password); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      track('auth_signup_success', { reason });
      if (data.session) {
        await finalizeSignupProfile({ fullName });
        if (!stayLoggedIn) armSessionOnly();
        toast.success(isEn ? `Welcome, ${firstName.trim()}!` : `Bienvenue, ${firstName.trim()} !`);
        onSuccess?.();
        onClose();
      } else {
        toast.success(`${T.confirm_sent} ${em}.`, { duration: 10000 });
        setMode('login');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  // ---- Mot de passe oublié ----
  const sendReset = async () => {
    const em = email.trim();
    if (!validEmail(em)) { toast.error(T.err_email); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(em, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`${T.reset_sent} ${em}`, { duration: 8000 });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  // ---- Code par email (OTP, alternative sans mot de passe) ----
  const sendCode = async () => {
    const em = email.trim();
    if (!validEmail(em)) { toast.error(T.err_email); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: { shouldCreateUser: true, emailRedirectTo: undefined },
      });
      if (error) throw error;
      setStep('otp');
      setCode('');
      setResendIn(60);
      track('auth_otp_sent', { method: 'email', reason });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (token: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('No session');
      track('auth_otp_verified', { method: 'email', reason });

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
      finishLogin();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
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
      if (!stayLoggedIn) armSessionOnly();
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
  const inputCls = 'w-full h-12 rounded-xl border px-3 text-[16px] outline-none focus:border-[#1a3560] bg-white';

  const EnterScreen = (
    <div className="space-y-3">
      {/* Onglets Connexion / Inscription */}
      <div className="flex rounded-xl bg-muted p-1 mb-1" role="tablist">
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex-1 h-9 rounded-lg text-[13px] font-semibold transition ${
              mode === m ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            {m === 'login' ? T.login_tab : T.signup_tab}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder={T.firstname_ph}
            autoComplete="given-name"
            className={inputCls}
          />
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder={T.lastname_ph}
            autoComplete="family-name"
            className={inputCls}
          />
        </div>
      )}

      <input
        type="email"
        inputMode="email"
        autoFocus={mode === 'login'}
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={T.email_ph}
        className={inputCls}
      />

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') (mode === 'login' ? loginWithPassword : signupWithPassword)(); }}
          placeholder={T.password_label}
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? 'Masquer' : 'Afficher'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {mode === 'login' && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={e => setStayLoggedIn(e.target.checked)}
              className="h-4 w-4 accent-[#1a3560]"
            />
            <span className="text-[12px] text-foreground">{T.stay}</span>
          </label>
          <button
            onClick={sendReset}
            disabled={busy}
            className="text-[12px] font-medium hover:underline disabled:opacity-50"
            style={{ color: BRAND }}
          >
            {T.forgot}
          </button>
        </div>
      )}

      <button
        onClick={mode === 'login' ? loginWithPassword : signupWithPassword}
        disabled={busy}
        className="w-full h-12 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 transition active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: BRAND }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'login' ? T.login_cta : T.signup_cta}
      </button>

      <div className="flex items-center gap-3 py-1">
        <span className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground">ou</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={sendCode}
        disabled={busy}
        className="w-full h-11 rounded-xl border text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-muted/50 transition disabled:opacity-60"
        style={{ color: BRAND, borderColor: 'hsl(var(--border))' }}
      >
        <Mail className="h-4 w-4" />
        {busy ? T.sending : T.or_code}
      </button>

      <p className="text-[11px] text-muted-foreground text-center pt-1 px-2">{T.terms}</p>
    </div>
  );

  const OtpScreen = (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-[13px] text-muted-foreground">{T.code_sent_email}</p>
        <p className="text-[14px] font-semibold text-foreground">{email.trim()}</p>
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
                  onClick={step === 'enter' ? onClose : () => setStep(step === 'name' ? 'enter' : 'enter')}
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
                  {step === 'enter' && (
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6 text-center">{T.subtitle}</p>
                  )}
                  {step === 'otp' && (
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6 text-center">{T.enter_code}</p>
                  )}
                  {step === 'name' && <div className="h-6" />}

                  {reason && step === 'enter' && (
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
                  <X className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center mb-5">
                  <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center mb-3" style={{ background: BRAND }}>
                    <Building2 size={22} className="text-white" />
                  </div>
                  <h1 className="text-lg font-bold" style={{ color: BRAND }}>
                    {step === 'name' ? T.name_q : T.join}
                  </h1>
                  {step === 'enter' && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">{T.subtitle}</p>
                  )}
                  {step === 'otp' && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">{T.enter_code}</p>
                  )}
                </div>

                {reason && step === 'enter' && (
                  <div className="mb-4 px-3 py-2.5 rounded-xl text-[12px] text-center" style={{ background: '#f1f5f9', color: BRAND }}>
                    {T.connect_for} <span className="font-semibold">{reason}</span>
                  </div>
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
