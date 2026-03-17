import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@sapsaphouse.bf' && password === 'admin2026') {
      localStorage.setItem('sapsap_admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Email ou mot de passe incorrect');
    }
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
            <input
              type="email"
              placeholder="admin@sapsaphouse.bf"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full h-11 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#e02d2d' }}
          >
            Se connecter
          </button>
        </form>

        <a href="/" className="block text-center text-xs text-muted-foreground mt-6 hover:underline">
          ← Retour au site
        </a>
      </div>
    </div>
  );
}
