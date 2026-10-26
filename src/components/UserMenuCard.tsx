import { LogIn, LogOut, User as UserIcon, ChevronRight, LayoutDashboard, Home, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { accountNavigation } from '@/lib/accountNavigation';

const icons = { account: UserIcon, dashboard: LayoutDashboard, home: Home, calendar: Calendar, messages: MessageSquare };

/**
 * Carte utilisateur pour les menus (mobile / tablette).
 * Connecté : avatar initiales + nom + email + accès « Mon compte » + déconnexion.
 * Non connecté : un seul bouton « Se connecter / Créer un compte ».
 */
const UserMenuCard = ({ onAction }: { onAction?: () => void }) => {
  const { user, loading, isOwner, openAuthModal, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading && !user) return <div className="flex justify-center p-4" role="status" aria-label="Chargement du compte"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <Button variant="default"
        onClick={() => { onAction?.(); openAuthModal(); }}
        className="w-full h-auto flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:opacity-95 transition text-left whitespace-normal"
      >
        <span className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
          <LogIn className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block">Se connecter</span>
          <span className="block text-[11px] font-normal opacity-80">ou créer un compte en 1 minute</span>
        </span>
        <ChevronRight className="h-4 w-4 opacity-70" />
      </Button>
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
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-3 pb-3">
        <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-foreground truncate">{name}</span>
          {user.email && name !== user.email && (
            <span className="block text-[11px] text-muted-foreground truncate">{user.email}</span>
          )}
        </span>
      </div>
      <div className="border-t border-border pt-2 space-y-1">
        {accountNavigation(isOwner).map(item => {
          const Icon = icons[item.icon];
          return <Button key={item.path} variant="ghost" disabled={loading} onClick={() => { onAction?.(); navigate(item.path); }} className="w-full justify-start gap-2 h-auto min-h-10 px-2 py-2 text-xs whitespace-normal text-left">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Button>;
        })}
        {loading && <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" aria-label="Chargement des accès" />}
      </div>
      <Button variant="ghost"
        onClick={() => { onAction?.(); void signOut(); }}
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition"
      >
        <LogOut className="h-3.5 w-3.5" />
        Se déconnecter
      </Button>
    </div>
  );
};

export default UserMenuCard;
