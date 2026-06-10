import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, Lock, User as UserIcon, Phone, MessageCircle, Home as HomeIcon } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';

const WHATSAPP_NUMBER = '22657976660';

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
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const T = {
    title_login: isEn ? 'Sign in' : 'Connexion',
    title_signup: isEn ? 'Create an account' : 'Créer un compte',
    full_name: isEn ? 'Full name' : 'Nom complet',
    phone: isEn ? 'Phone (optional)' : 'Téléphone (optionnel)',
    email: 'Email',
    password: isEn ? 'Password' : 'Mot de passe',
    submit_login: isEn ? 'Sign in' : 'Se connecter',
    submit_signup: isEn ? 'Create account' : 'Créer le compte',
    or: isEn ? 'or' : 'ou',
    whatsapp: isEn ? 'Continue with WhatsApp' : 'Continuer avec WhatsApp',
    no_account: isEn ? "No account? Sign up" : "Pas de compte ? S'inscrire",
    has_account: isEn ? 'Already have an account? Sign in' : 'Déjà un compte ? Se connecter',
    no_signup: isEn ? 'Continue without an account' : 'Continuer sans compte',
    connect_for: isEn ? 'Sign in to' : 'Connectez-vous pour',
    owner_title: isEn ? "I'm a property owner" : 'Je suis propriétaire',
    owner_desc: isEn ? 'I want to publish my listings. You can also enable it later.' : 'Je veux publier mes biens. Tu pourras aussi l\'activer plus tard.',
    ok_created: isEn ? 'Account created.' : 'Compte créé.',
    ok_owner_created: isEn ? 'Owner account created.' : 'Compte propriétaire créé.',
    ok_signed_in: isEn ? 'Signed in' : 'Connecté',
    err: isEn ? 'Error' : 'Erreur',
  };
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [asOwner, setAsOwner] = useState(false);
  const [busy, setBusy] = useState(false);

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
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? '' },
          },
        });
        if (error) throw error;
        const newUserId = signUpData.user?.id;
        if (asOwner && newUserId) {
          const { error: roleErr } = await supabase
            .from('user_roles')
            .insert({ user_id: newUserId, role: 'owner' });
          if (roleErr) {
            localStorage.setItem('sapsap_pending_owner_role', '1');
          }
        }
        toast.success(asOwner ? T.ok_owner_created : T.ok_created);
        track('auth_signup_success', { reason, as_owner: asOwner });
        onSuccess?.();
        onClose();
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) throw error;
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
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

            <div className="flex flex-col items-center mb-4">
              <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center mb-2.5" style={{ background: '#1a3560' }}>
                <Building2 size={22} className="text-white" />
              </div>
              <h2 className="text-base font-bold">SapSapHouse</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{mode === 'login' ? T.title_login : T.title_signup}</p>
              {reason && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center px-4">
                  {T.connect_for} <span className="font-medium text-foreground">{reason}</span>
                </p>
              )}
            </div>

            <form onSubmit={submit} className="space-y-2.5">
              {mode === 'signup' && (
                <>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                      placeholder={T.full_name}
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                      placeholder={T.phone}
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                  placeholder={T.email}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                  placeholder={T.password}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {mode === 'signup' && (
                <label className="flex items-start gap-2.5 mt-1 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={asOwner}
                    onChange={e => setAsOwner(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#1a3560]"
                  />
                  <span className="text-xs leading-relaxed">
                    <span className="font-semibold flex items-center gap-1.5"><HomeIcon size={13} /> {T.owner_title}</span>
                    <span className="text-muted-foreground">{T.owner_desc}</span>
                  </span>
                </label>
              )}

              <button
                disabled={busy}
                type="submit"
                className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{ background: '#1a3560' }}
              >
                {busy ? '…' : mode === 'login' ? T.submit_login : T.submit_signup}
              </button>
            </form>

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{T.or}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={continueWithWhatsApp}
              className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[0.98]"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="h-4 w-4" />
              {T.whatsapp}
            </button>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-xs text-muted-foreground mt-3 hover:underline"
            >
              {mode === 'login' ? T.no_account : T.has_account}
            </button>

            <button
              onClick={onClose}
              className="w-full text-center text-[11px] text-muted-foreground mt-2 hover:text-foreground"
            >
              {T.no_signup}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

