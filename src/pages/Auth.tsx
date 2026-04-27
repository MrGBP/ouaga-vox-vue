import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

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

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate('/'); }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email, password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? '' },
          },
        });
        if (error) throw error;
        toast.success('Compte créé. Vérifie ta boîte mail si la confirmation est activée.');
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) throw error;
        toast.success('Connecté');
        navigate('/');
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
              <input className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Nom complet"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <input className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Téléphone (optionnel)"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </>
          )}
          <input type="email" className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Mot de passe"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

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
