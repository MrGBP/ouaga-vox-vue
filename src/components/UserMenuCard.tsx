import { LogIn, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Carte utilisateur pour les menus (mobile / tablette).
 * Connecté : avatar initiales + nom + email + accès « Mon compte » + déconnexion.
 * Non connecté : un seul bouton « Se connecter / Créer un compte ».
 */
const UserMenuCard = ({ onAction }: { onAction?: () => void }) => {
  const { user, openAuthModal, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        onClick={() => { onAction?.(); openAuthModal(); }}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:opacity-95 transition text-left"
      >
        <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <LogIn className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block">Se connecter</span>
          <span className="block text-[11px] font-normal opacity-80">ou créer un compte en 1 minute</span>
        </span>
        <ChevronRight className="h-4 w-4 opacity-70" />
      </button>
    );
  }

  const name = (user.user_metadata?.full_name as string | undefined) || user.email || 'Utilisateur';
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <button
        onClick={() => { onAction?.(); navigate('/mon-compte'); }}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-foreground truncate">{name}</span>
          {user.email && name !== user.email && (
            <span className="block text-[11px] text-muted-foreground truncate">{user.email}</span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-0.5">
            <UserIcon className="h-3 w-3" /> Mon compte
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      <button
        onClick={() => { onAction?.(); signOut(); }}
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition"
      >
        <LogOut className="h-3.5 w-3.5" />
        Se déconnecter
      </button>
    </div>
  );
};

export default UserMenuCard;
