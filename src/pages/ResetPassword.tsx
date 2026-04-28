import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash; getSession picks it up
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Min 6 caractères');
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Mot de passe mis à jour');
      navigate('/auth');
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-[420px] mx-4 rounded-2xl bg-white p-8 shadow-xl border">
        <div className="flex flex-col items-center mb-6">
          <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center mb-3" style={{ background: '#1a3560' }}>
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold">Nouveau mot de passe</h1>
          <p className="text-xs text-muted-foreground mt-1">Définis ton nouveau mot de passe.</p>
        </div>

        {!ready ? (
          <p className="text-sm text-center text-muted-foreground">
            Lien invalide ou expiré. Refais une demande de réinitialisation.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              placeholder="Confirme le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              disabled={busy}
              type="submit"
              className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#1a3560' }}
            >
              {busy ? '…' : 'Mettre à jour'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
