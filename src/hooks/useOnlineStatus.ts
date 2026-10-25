import { useEffect, useState } from "react";

/**
 * Statut en ligne fiable : navigator.onLine seul déclenche de faux
 * « hors ligne » (VPN, changement de réseau, veille). On confirme
 * toujours par une vraie requête avant d'afficher la bannière.
 */
async function reallyOffline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    // Le navigateur dit hors ligne : on confirme par un ping léger.
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      await fetch(`/favicon.ico?ping=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: ctrl.signal,
      });
      clearTimeout(t);
      return false; // la requête est passée → en ligne
    } catch {
      return true;
    }
  }
  return false;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const offline = await reallyOffline();
      if (!cancelled) setIsOnline(!offline);
    };

    const on = () => setIsOnline(true);
    const off = () => { void check(); };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    // Vérification initiale + contrôle périodique discret (60 s)
    void check();
    const interval = window.setInterval(() => {
      if (!navigator.onLine) void check();
    }, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.clearInterval(interval);
    };
  }, []);

  return isOnline;
}
