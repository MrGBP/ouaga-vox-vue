import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function PushNotificationsToggle({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!user) return null;
  if (!supported) {
    return (
      <div className="rounded-lg border p-3 text-xs text-muted-foreground">
        Les notifications push ne sont pas prises en charge sur ce navigateur.
        {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
          <> Sur iPhone, installez d'abord l'app sur l'écran d'accueil (Partager → Sur l'écran d'accueil) puis rouvrez-la.</>
        )}
      </div>
    );
  }

  const handleToggle = async () => {
    if (subscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success("Notifications push désactivées");
      else toast.error("Impossible de désactiver les notifications");
    } else {
      if (permission === "denied") {
        toast.error("Notifications bloquées. Autorisez-les dans les réglages du navigateur.");
        return;
      }
      const ok = await subscribe();
      if (ok) toast.success("Notifications push activées 🔔");
      else if (permission !== "granted") toast.error("Autorisation refusée");
      else toast.error("Impossible d'activer les notifications");
    }
  };

  return (
    <div className={`w-full flex items-center justify-between gap-3 ${compact ? 'py-2' : 'rounded-lg border px-4 py-3'}`}>
      <div className="flex items-center gap-2 min-w-0">
        {subscribed ? <Bell className="h-4 w-4 shrink-0 text-primary" /> : <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <div>
          <div className={compact ? 'text-xs font-medium' : 'text-sm font-medium'}>{subscribed ? 'Notifications push activées' : 'Activer les notifications push'}</div>
          {!compact && <div className="text-xs text-muted-foreground">Messages, réservations et alertes, même quand l’app est fermée.</div>}
        </div>
      </div>
      <Switch checked={subscribed} disabled={loading} onCheckedChange={() => { void handleToggle(); }} aria-label="Notifications push" />
    </div>
  );
}
