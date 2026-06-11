import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { finalizeSignupProfile } from '@/lib/authProfile';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Supabase auto-parses the hash/fragment on load and persists the session.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Finalize profile (owner role pending, etc.) if needed
          const pendingOwner = localStorage.getItem('sapsap_pending_owner_role') === '1';
          try {
            await finalizeSignupProfile({
              fullName: session.user.user_metadata?.full_name,
              phone: session.user.user_metadata?.phone,
              asOwner: pendingOwner,
            });
            if (pendingOwner) localStorage.removeItem('sapsap_pending_owner_role');
          } catch {}
          toast.success('Email vérifié ! Bienvenue 🎉');
          navigate('/', { replace: true });
        } else {
          toast.error('Lien invalide ou expiré.');
          navigate('/auth', { replace: true });
        }
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur de vérification');
        navigate('/auth', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-[#1a3560] animate-spin" />
        <p className="text-sm text-muted-foreground">Vérification en cours…</p>
      </div>
    </div>
  );
}
