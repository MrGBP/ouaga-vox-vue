import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Building2, Home as HomeIcon } from 'lucide-react';
import { finalizeSignupProfile } from '@/lib/authProfile';

const signupSchema = z.object({
  first_name: z.string().trim().min(2, 'Prénom trop court').max(40),
  last_name: z.string().trim().min(2, 'Nom trop court').max(40),
  email: z.string().trim().email('Email invalide').max(255),
  password: z.string().min(6, 'Min 6 caractères').max(72),
  phone: z.string().trim().max(30).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6),
});

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' });
  const [asOwner, setAsOwner] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [busy, setBusy] = useState(false);

  // « Rester connecté » décoché : la session est purgée à la fermeture de l'onglet.
  const armSessionOnly = () => {
    window.addEventListener('pagehide', () => {
      try {
        Object.keys(window.localStorage)
          .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
          .forEach(k => window.localStorage.removeItem(k));
      } catch { /* stockage indisponible */ }
    }, { once: true });
  };

  useEffect(() => { if (!loading && user) navigate(redirectTo); }, [user, loading, navigate, redirectTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const fullName = `${parsed.data.first_name} ${parsed.data.last_name}`.trim();
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: parsed.data.email, password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: fullName, phone: parsed.data.phone ?? '' },
          },
        });
        if (error) throw error;
        if (signUpData.session) {
          await finalizeSignupProfile({ fullName, phone: parsed.data.phone, asOwner });
          toast.success(asOwner ? 'Compte propriétaire créé, bienvenue !' : 'Compte créé, bienvenue !');
        } else {
          if (asOwner) localStorage.setItem('sapsap_pending_owner_role', '1');
          toast.success(`Un lien de confirmation a été envoyé à ${parsed.data.email}. Cliquez dessus pour activer votre compte.`, { duration: 10000 });
          setMode('login');
        }
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) throw error;
        if (!stayLoggedIn) armSessionOnly();
        toast.success('Connecté');
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-[420px] mx-4 rounded-2xl bg-white p-8 shadow-xl border">
        <div className="flex flex-col items-center mb-6">
          <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center mb-3" style={{ background: '#1a3560' }}>
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold">SapSapHouse</h1>
          <p className="text-xs text-muted-foreground mt-1">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div className="flex gap-2">
                <input className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Prénom" autoComplete="given-name"
                  value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                <input className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Nom" autoComplete="family-name"
                  value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <input className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Téléphone (optionnel)"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </>
          )}
          <input type="email" className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Mot de passe"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 mt-1 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" checked={asOwner} onChange={e => setAsOwner(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1a3560]" />
              <span className="text-xs leading-relaxed">
                <span className="font-semibold flex items-center gap-1.5"><HomeIcon size={13} /> Je suis propriétaire</span>
                <span className="text-muted-foreground">Je veux publier mes biens. Tu pourras aussi l'activer plus tard.</span>
              </span>
            </label>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)}
                  className="h-4 w-4 accent-[#1a3560]" />
                <span className="text-xs text-foreground">Rester connecté</span>
              </label>
              <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: '#1a3560' }}>
                Mot de passe oublié ?
              </Link>
            </div>
          )}

          <button disabled={busy} type="submit" className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#1a3560' }}>
            {busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>

        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-center text-xs text-muted-foreground mt-4 hover:underline">
          {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>

        <Link to="/" className="block text-center text-xs text-muted-foreground mt-3 hover:underline">← Retour au site</Link>
      </div>
    </div>
  );
}
