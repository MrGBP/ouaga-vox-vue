import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Demo bypass kept for backward compat (local mode)
      if (email === 'admin@sapsaphouse.bf' && password === 'admin2026') {
        localStorage.setItem('sapsap_admin_auth', 'true');
        navigate('/admin');
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id);
      const isAdmin = !!roles?.some(r => r.role === 'admin');
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("Ce compte n'a pas le rôle admin.");
      }
      localStorage.setItem('sapsap_admin_auth', 'true');
      toast.success('Connecté');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message ?? 'Identifiants invalides');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-[400px] mx-4 rounded-2xl bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center mb-3" style={{ background: '#1a3560' }}>
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-foreground">SapSapHouse</h1>
          <p className="text-xs text-muted-foreground mt-1">Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
            <input type="email" placeholder="admin@sapsaphouse.bf" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <button type="submit" disabled={busy}
            className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#e02d2d' }}>
            {busy ? '…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
          Démo : <code>admin@sapsaphouse.bf</code> / <code>admin2026</code><br/>
          Ou utilise un compte avec rôle <b>admin</b> en base.
        </p>

        <a href="/" className="block text-center text-xs text-muted-foreground mt-6 hover:underline">
          ← Retour au site
        </a>
      </div>
    </div>
  );
}
