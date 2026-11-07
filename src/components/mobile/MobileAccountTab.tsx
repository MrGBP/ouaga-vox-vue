import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, ChevronRight, User as UserIcon, LayoutDashboard, Home, Calendar, MessageSquare, ShieldCheck, Bell, Heart, Receipt, BadgeCheck, Loader2, LifeBuoy, MessageCircle, Mail, FileText, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { accountNavigation } from '@/lib/accountNavigation';
import PushNotificationsToggle from '@/components/PushNotificationsToggle';
import { rememberReturnTab } from '@/lib/returnTo';
import { useState } from 'react';
import { useCountryConfig, fetchCountrySupport } from '@/hooks/useCountryConfig';
import { openWhatsApp, openEmail } from '@/lib/contact';

const FAQ = [
  { q: 'Comment réserver un logement ?', a: 'Choisissez vos dates sur la fiche du bien, payez par Mobile Money, puis recevez la confirmation et votre reçu dans Mon compte.' },
  { q: 'Mon paiement est-il sécurisé ?', a: 'Le paiement passe uniquement par SapSapHouse. Les dates sont bloquées pendant 10 minutes le temps de payer.' },
  { q: 'Puis-je annuler ?', a: 'Oui, depuis Mes séjours. Les conditions d’annulation sont rappelées avant le paiement.' },
  { q: 'Comment publier mon logement ?', a: 'Touchez « Mettre mon logement en ligne » : décrivez-le, ajoutez vos photos, fixez vos prix et vos disponibilités. Vous gérez ensuite vos réservations vous-même.' },
];

function HostCard({ isOwner, go }: { isOwner: boolean; go: (p: string) => void }) {
  return (
    <button type="button" onClick={() => go(isOwner ? '/proprietaire/biens?new=1' : '/publier')} className="w-full text-left rounded-3xl bg-card border border-border p-5 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform">
      <span className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0"><KeyRound className="h-6 w-6" strokeWidth={1.8} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold text-foreground leading-snug">{isOwner ? 'Ajouter un logement' : 'Mettre mon logement en ligne'}</span>
        <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">{isOwner ? 'Publiez un nouveau logement meublé en quelques minutes.' : 'Publiez votre logement meublé, fixez vos prix et gérez vos réservations en autonomie.'}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function SupportGroup() {
  const country = useCountryConfig();
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const contact = async (kind: 'wa' | 'mail') => {
    const s = (await fetchCountrySupport(country.code).catch(() => null)) || {};
    const wa = (s as any).support_whatsapp || country.support_whatsapp || '+22657976660';
    const mail = (s as any).support_email || country.support_email || 'sapsaphouse@sapsaphouse.com';
    if (kind === 'wa') openWhatsApp(wa, 'Bonjour SapSapHouse, j’ai besoin d’aide.');
    else openEmail({ to: mail, subject: 'Demande d’assistance SapSapHouse' });
  };
  return (
    <Group title="Assistance">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60">
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
        <span className="flex-1"><span className="block text-sm font-medium text-foreground">Centre d’aide</span><span className="block text-xs text-muted-foreground">Réservation, paiement, annulation</span></span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-xl bg-muted/50">
              <button type="button" onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-foreground">
                {f.q}<ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${faq === i ? 'rotate-180' : ''}`} />
              </button>
              {faq === i && <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      )}
      <Row icon={MessageCircle} label="Discuter avec SapSapHouse" hint="Réponse rapide sur WhatsApp" onClick={() => void contact('wa')} />
      <Row icon={Mail} label="Écrire au service client" hint="Par e-mail" onClick={() => void contact('mail')} />
      <Row icon={FileText} label="Conditions & confidentialité" hint="Règles de la plateforme" onClick={() => setOpen(true)} />
    </Group>
  );
}

const icons = { account: UserIcon, dashboard: LayoutDashboard, home: Home, calendar: Calendar, messages: MessageSquare, admin: ShieldCheck, bell: Bell };

const Row = ({ icon: Icon, label, hint, onClick }: { icon: typeof UserIcon; label: string; hint?: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60 transition-colors">
    <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground truncate">{hint}</span>}
    </span>
    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
  </button>
);

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h4 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
    <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">{children}</div>
  </section>
);

export default function MobileAccountTab({ favoritesCount = 0, onOpenFavorites }: { favoritesCount?: number; onOpenFavorites: () => void }) {
  const { user, loading, isOwner, isAdmin, openAuthModal, signOut } = useAuth();
  const rawNavigate = useNavigate();
  const navigate = (path: string) => { rememberReturnTab('profile'); rawNavigate(path); };

  if (loading && !user) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!user) {
    const perks = [
      { icon: Receipt, text: 'Suivez vos réservations et reçus de paiement' },
      { icon: Heart, text: 'Retrouvez vos favoris sur tous vos appareils' },
      { icon: Bell, text: 'Recevez les alertes de disponibilité' },
    ];
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="rounded-3xl bg-primary text-primary-foreground p-6">
          <span className="w-12 h-12 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mb-4"><UserIcon className="h-6 w-6" /></span>
          <h3 className="text-xl font-bold leading-tight">Votre espace SapSapHouse</h3>
          <p className="text-sm opacity-80 mt-1">Connectez-vous pour réserver et gérer vos séjours.</p>
          <ul className="mt-5 space-y-3">
            {perks.map(p => <li key={p.text} className="flex items-center gap-3 text-sm"><p.icon className="h-4 w-4 shrink-0 opacity-90" />{p.text}</li>)}
          </ul>
        </div>
        <div className="space-y-3">
          <Button className="w-full h-12 rounded-xl text-base gap-2" onClick={() => openAuthModal('se connecter')}><LogIn className="h-4 w-4" />Se connecter</Button>
          <Button variant="outline" className="w-full h-12 rounded-xl text-base" onClick={() => openAuthModal('créer un compte')}>Créer un compte</Button>
        </div>
        <section>
          <h4 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Devenir hôte</h4>
          <HostCard isOwner={false} go={navigate} />
        </section>
        <SupportGroup />
      </div>
    );
  }

  const name = (user.user_metadata?.full_name as string | undefined) || user.email || 'Mon compte';
  const initials = name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const nav = accountNavigation(isOwner, isAdmin);
  const pro = nav.filter(i => i.path.startsWith('/proprietaire') || i.path === '/admin');

  return (
    <div className="px-4 py-5 space-y-6">
      <div className="rounded-3xl bg-card border border-border p-5 flex items-center gap-4 shadow-sm">
        <span className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold ring-4 ring-primary/15 shrink-0">{initials}</span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{name}</h3>
          {user.email && name !== user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5"><BadgeCheck className="h-3 w-3" />Compte actif</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: Receipt, label: 'Séjours', on: () => navigate('/mon-compte?tab=sejours') },
          { icon: Heart, label: favoritesCount ? `Favoris · ${favoritesCount}` : 'Favoris', on: onOpenFavorites },
          { icon: Bell, label: 'Alertes', on: () => navigate('/notifications') },
        ].map(t => (
          <button key={t.label} type="button" onClick={t.on} className="rounded-2xl bg-card border border-border py-4 flex flex-col items-center gap-2 active:scale-[0.97] transition-transform shadow-sm">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><t.icon className="h-5 w-5" strokeWidth={1.8} /></span>
            <span className="text-xs font-semibold text-foreground">{t.label}</span>
          </button>
        ))}
      </div>

      <Group title="Paramètres du compte">
        <Row icon={UserIcon} label="Informations personnelles" hint="Nom, téléphone, e-mail" onClick={() => navigate('/mon-compte?tab=profile')} />
        <div className="px-4 py-2"><PushNotificationsToggle compact /></div>
      </Group>

      <section className="space-y-3">
        <h4 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{isOwner ? 'Espace hôte' : 'Devenir hôte'}</h4>
        <HostCard isOwner={isOwner} go={navigate} />
        {pro.length > 0 && (
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {pro.map(i => <Row key={i.path} icon={icons[i.icon]} label={i.path === '/proprietaire' ? 'Tableau de bord hôte' : i.label} onClick={() => navigate(i.path)} />)}
          </div>
        )}
      </section>

      <SupportGroup />

      <Button variant="ghost" onClick={() => void signOut()} className="w-full h-12 rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4" />Se déconnecter
      </Button>
    </div>
  );
}
