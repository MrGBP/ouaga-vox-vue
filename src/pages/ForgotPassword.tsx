import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Email envoyé. Vérifie ta boîte de réception.');
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
          <h1 className="text-lg font-bold">Mot de passe oublié</h1>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Entre ton email, tu recevras un lien pour le réinitialiser.
          </p>
        </div>

        {sent ? (
          <div className="text-sm text-center text-muted-foreground space-y-3">
            <p>✅ Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.</p>
            <p className="text-xs">Pense à vérifier le dossier spam.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              disabled={busy}
              type="submit"
              className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#1a3560' }}
            >
              {busy ? '…' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <Link to="/auth" className="block text-center text-xs text-muted-foreground mt-4 hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
