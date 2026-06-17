import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, Lock, User as UserIcon, Phone, MessageCircle, Home as HomeIcon, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { useIsMobile } from '@/hooks/use-mobile';
import { finalizeSignupProfile } from '@/lib/authProfile';

const WHATSAPP_NUMBER = '22657976660';
const BRAND = '#1a3560';

const signupSchema = z.object({
  full_name: z.string().trim().min(2, 'Nom trop court').max(80),
  email: z.string().trim().email('Email invalide').max(255),
  password: z.string().min(6, 'Min 6 caractères').max(72),
  phone: z.string().trim().max(30).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6),
});

interface AuthModalProps {
  open: boolean;
  reason?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ open, reason, onClose, onSuccess }: AuthModalProps) {
  useLockBackdrop(open);
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const T = {
    title_login: isEn ? 'Sign in' : 'Connexion',
    title_signup: isEn ? 'Create an account' : 'Créer un compte',
    welcome_login: isEn ? 'Welcome back' : 'Heureux de vous revoir',
    welcome_signup: isEn ? 'Join SapSapHouse' : 'Rejoignez SapSapHouse',
    subtitle_login: isEn ? 'Sign in to manage your bookings and favorites.' : 'Connectez-vous pour gérer vos réservations et favoris.',
    subtitle_signup: isEn ? 'Create your account in less than a minute.' : 'Créez votre compte en moins d\'une minute.',
    full_name: isEn ? 'Full name' : 'Nom complet',
    phone: isEn ? 'Phone (optional)' : 'Téléphone (optionnel)',
    email: 'Email',
    password: isEn ? 'Password' : 'Mot de passe',
    submit_login: isEn ? 'Sign in' : 'Se connecter',
    submit_signup: isEn ? 'Create account' : 'Créer mon compte',
    or: isEn ? 'or' : 'ou',
    whatsapp: isEn ? 'Continue with WhatsApp' : 'Continuer avec WhatsApp',
    tab_login: isEn ? 'Sign in' : 'Se connecter',
    tab_signup: isEn ? 'Sign up' : "S'inscrire",
    no_signup: isEn ? 'Continue without an account' : 'Continuer sans compte',
    connect_for: isEn ? 'Sign in to' : 'Connectez-vous pour',
    owner_title: isEn ? "I'm a property owner" : 'Je suis propriétaire',
    owner_desc: isEn ? 'I want to publish my listings. You can enable it later.' : 'Je veux publier mes biens. Activable plus tard.',
    ok_created: isEn ? 'Account created.' : 'Compte créé.',
    ok_owner_created: isEn ? 'Owner account created.' : 'Compte propriétaire créé.',
    ok_signed_in: isEn ? 'Signed in' : 'Connecté',
    err: isEn ? 'Error' : 'Erreur',
    forgot: isEn ? 'Forgot password?' : 'Mot de passe oublié ?',
    terms: isEn ? 'By continuing you accept our Terms & Privacy.' : 'En continuant vous acceptez nos CGU et notre politique.',
  };
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [asOwner, setAsOwner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const resendConfirmation = async () => {
    if (!form.email) { toast.error(isEn ? 'Enter your email' : 'Entrez votre email'); return; }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
    else toast.success(isEn ? '📧 Email resent!' : '📧 Email renvoyé !');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? '' },
          },
        });
        if (error) throw error;
        if (signUpData.session) {
          await finalizeSignupProfile({ fullName: parsed.data.full_name, phone: parsed.data.phone, asOwner });
          toast.success(asOwner ? T.ok_owner_created : T.ok_created);
          track('auth_signup_success', { reason, as_owner: asOwner });
          onSuccess?.();
          onClose();
        } else {
          if (asOwner) localStorage.setItem('sapsap_pending_owner_role', '1');
          toast.success(
            isEn
              ? `📧 Check your email — a confirmation link was sent to ${parsed.data.email}.`
              : `📧 Vérifiez votre email — un lien de confirmation a été envoyé à ${parsed.data.email}.`,
            { duration: 8000 }
          );
          track('auth_signup_success', { reason, as_owner: asOwner, pending_confirmation: true });
          setShowResendOption(true);
        }
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) {
          if (/email not confirmed/i.test(error.message)) {
            setShowResendOption(true);
            toast.error(isEn ? '📧 Email not verified. Check your inbox.' : '📧 Email non vérifié. Vérifiez votre boîte mail.');
            return;
          }
          throw error;
        }
        toast.success(T.ok_signed_in);
        track('auth_signin_success', { reason });
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message ?? T.err);
    } finally { setBusy(false); }
  };

  const continueWithWhatsApp = () => {
    track('auth_whatsapp_continue', { reason });
    const msg = encodeURIComponent(
      reason ? `Bonjour SapSap, je souhaite ${reason} sans créer de compte.` : 'Bonjour SapSap, je souhaite continuer via WhatsApp.'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
  };

  // ---------- Shared form body ----------
  const FormBody = (
    <form onSubmit={submit} className="space-y-3">
      {mode === 'signup' && (
        <>
          <Field icon={<UserIcon className="h-[18px] w-[18px]" />}>
            <input
              className="auth-input"
              placeholder={T.full_name}
              autoComplete="name"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field icon={<Phone className="h-[18px] w-[18px]" />}>
            <input
              className="auth-input"
              placeholder={T.phone}
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
        </>
      )}
      <Field icon={<Mail className="h-[18px] w-[18px]" />}>
        <input
          type="email"
          className="auth-input"
          placeholder={T.email}
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field icon={<Lock className="h-[18px] w-[18px]" />}>
        <input
          type={showPwd ? 'text' : 'password'}
          className="auth-input pr-10"
          placeholder={T.password}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShowPwd(p => !p)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
          aria-label="toggle password"
        >
          {showPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </Field>

      {mode === 'login' && (
        <div className="flex justify-end -mt-1">
          <a
            href="/forgot-password"
            onClick={onClose}
            className="text-[12px] font-medium hover:underline"
            style={{ color: BRAND }}
          >
            {T.forgot}
          </a>
        </div>
      )}

      {mode === 'signup' && (
        <label className="flex items-start gap-2.5 mt-1 px-3 py-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            checked={asOwner}
            onChange={e => setAsOwner(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#1a3560]"
          />
          <span className="text-[12px] leading-relaxed">
            <span className="font-semibold flex items-center gap-1.5"><HomeIcon size={13} /> {T.owner_title}</span>
            <span className="text-muted-foreground">{T.owner_desc}</span>
          </span>
        </label>
      )}

      <button
        disabled={busy}
        type="submit"
        className="w-full h-12 rounded-xl text-[15px] font-semibold text-white disabled:opacity-60 transition active:scale-[0.98] shadow-sm"
        style={{ background: BRAND }}
      >
        {busy ? '…' : mode === 'login' ? T.submit_login : T.submit_signup}
      </button>

      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{T.or}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={continueWithWhatsApp}
        className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[0.98]"
        style={{ background: '#25D366' }}
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {T.whatsapp}
      </button>

      {showResendOption && (
        <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-[12px] text-amber-900 mb-1.5">
            {isEn ? "Didn't receive the email?" : "Vous n'avez pas reçu l'email ?"}
          </p>
          <button
            type="button"
            onClick={resendConfirmation}
            className="text-[12px] font-semibold underline underline-offset-2"
            style={{ color: BRAND }}
          >
            {isEn ? 'Resend confirmation email' : "Renvoyer l'email de confirmation"}
          </button>
        </div>
      )}

      {mode === 'signup' && (
        <p className="text-[11px] text-muted-foreground text-center px-2 pt-1">{T.terms}</p>
      )}
    </form>
  );

  const Tabs = (
    <div className="relative grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-4 text-[13px] font-semibold">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm"
        animate={{ left: mode === 'login' ? 4 : 'calc(50% + 0px)' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      />
      <button
        type="button"
        onClick={() => { setMode('login'); setShowResendOption(false); }}
        className={`relative z-10 h-10 rounded-lg transition ${mode === 'login' ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {T.tab_login}
      </button>
      <button
        type="button"
        onClick={() => { setMode('signup'); setShowResendOption(false); }}
        className={`relative z-10 h-10 rounded-lg transition ${mode === 'signup' ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {T.tab_signup}
      </button>
    </div>
  );

  // Shared style for inputs (injected once)
  const styleTag = (
    <style>{`
      .auth-input {
        width: 100%;
        height: 48px;
        border-radius: 12px;
        border: 1px solid hsl(var(--border));
        padding-left: 40px;
        padding-right: 12px;
        font-size: 16px; /* avoid iOS zoom */
        background: white;
        outline: none;
        transition: border-color .15s, box-shadow .15s;
      }
      .auth-input:focus {
        border-color: ${BRAND};
        box-shadow: 0 0 0 3px rgba(26,53,96,.12);
      }
    `}</style>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {styleTag}
          {isMobile ? (
            // ============ MOBILE : full-screen sheet ============
            <motion.div
              key="auth-mobile"
              className="fixed inset-0 z-[200] bg-white flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-3 h-14 border-b border-border/60">
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Retour"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: BRAND }}>
                    <Building2 size={15} className="text-white" />
                  </div>
                  <span className="text-[14px] font-bold">SapSapHouse</span>
                </div>
                <div className="w-11" />
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
                <div className="max-w-[420px] mx-auto">
                  <h1 className="text-[22px] font-bold leading-tight" style={{ color: BRAND }}>
                    {mode === 'login' ? T.welcome_login : T.welcome_signup}
                  </h1>
                  <p className="text-[13px] text-muted-foreground mt-1 mb-4">
                    {mode === 'login' ? T.subtitle_login : T.subtitle_signup}
                  </p>

                  {reason && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl text-[12px]" style={{ background: '#f1f5f9', color: BRAND }}>
                      {T.connect_for} <span className="font-semibold">{reason}</span>
                    </div>
                  )}

                  {Tabs}
                  {FormBody}

                  <button
                    onClick={onClose}
                    className="w-full text-center text-[12px] text-muted-foreground mt-4 py-2 hover:text-foreground"
                  >
                    {T.no_signup}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // ============ DESKTOP : centered modal ============
            <motion.div
              key="auth-desktop"
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
              <motion.div
                className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
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

                <div className="flex flex-col items-center mb-4">
                  <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center mb-2.5" style={{ background: BRAND }}>
                    <Building2 size={22} className="text-white" />
                  </div>
                  <h2 className="text-[16px] font-bold">SapSapHouse</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {mode === 'login' ? T.subtitle_login : T.subtitle_signup}
                  </p>
                  {reason && (
                    <p className="text-[12px] text-muted-foreground mt-1.5 text-center px-4">
                      {T.connect_for} <span className="font-medium text-foreground">{reason}</span>
                    </p>
                  )}
                </div>

                {Tabs}
                {FormBody}

                <button
                  onClick={onClose}
                  className="w-full text-center text-[11px] text-muted-foreground mt-3 hover:text-foreground"
                >
                  {T.no_signup}
                </button>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

/** Input wrapper with left-icon. */
function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
  );
}
