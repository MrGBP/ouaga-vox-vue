import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PushNotificationsToggle() {
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
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        {subscribed ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="text-left">
          <div className="text-sm font-medium">
            {subscribed ? "Notifications push activées" : "Activer les notifications push"}
          </div>
          <div className="text-xs text-muted-foreground">
            {subscribed
              ? "Recevez les messages et réservations même quand l'app est fermée"
              : "Recevez une alerte pour les messages, réservations et alertes"}
          </div>
        </div>
      </div>
      <span
        className={`inline-block h-6 w-11 rounded-full transition-colors relative ${
          subscribed ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            subscribed ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
