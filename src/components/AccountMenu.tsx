import { Calendar, ChevronDown, Home, LayoutDashboard, Loader2, LogOut, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { accountNavigation } from '@/lib/accountNavigation';
import PushNotificationsToggle from '@/components/PushNotificationsToggle';

const icons = { account: User, dashboard: LayoutDashboard, home: Home, calendar: Calendar, messages: MessageSquare, admin: ShieldCheck };

export default function AccountMenu() {
  const { user, loading, isOwner, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const name = (user.user_metadata?.full_name as string | undefined) || user.email || 'Utilisateur';
  const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" aria-label="Menu du compte" className="gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{initials}</span>
        <span className="max-w-[120px] truncate">{name.split(' ')[0]}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)] z-[210]">
      <DropdownMenuLabel className="font-normal">
        <span className="block truncate text-sm font-semibold">{name}</span>
        {user.email && name !== user.email && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {accountNavigation(isOwner, isAdmin).map(item => {
        const Icon = icons[item.icon];
        return <DropdownMenuItem key={item.path} disabled={loading} onSelect={() => navigate(item.path)} className="gap-2 min-h-10 cursor-pointer">
          <Icon className="h-4 w-4 text-primary shrink-0" />{item.label}
        </DropdownMenuItem>;
      })}
      {loading && <div role="status" aria-label="Chargement des accès" className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
      <DropdownMenuSeparator />
      <div className="px-2"><PushNotificationsToggle compact /></div>
      <DropdownMenuItem onSelect={() => { void signOut(); }} className="gap-2 min-h-10 text-destructive cursor-pointer"><LogOut className="h-4 w-4" />Se déconnecter</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}