import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, Lock, User as UserIcon, Phone, MessageCircle } from 'lucide-react';
import { z } from 'zod';
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
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? '' },
          },
        });
        if (error) throw error;
        toast.success('Compte créé. Vérifie ton email si la confirmation est activée.');
        track('auth_signup_success', { reason });
        onSuccess?.();
        onClose();
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) throw error;
        toast.success('Connecté');
        track('auth_signin_success', { reason });
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur');
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
              {reason && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center px-4">
                  Connectez-vous pour <span className="font-medium text-foreground">{reason}</span>
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
                      placeholder="Nom complet"
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                      placeholder="Téléphone (optionnel)"
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
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm"
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <button
                disabled={busy}
                type="submit"
                className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{ background: '#1a3560' }}
              >
                {busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
              </button>
            </form>

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={continueWithWhatsApp}
              className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[0.98]"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="h-4 w-4" />
              Continuer avec WhatsApp
            </button>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-xs text-muted-foreground mt-3 hover:underline"
            >
              {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>

            <button
              onClick={onClose}
              className="w-full text-center text-[11px] text-muted-foreground mt-2 hover:text-foreground"
            >
              Continuer sans compte
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
