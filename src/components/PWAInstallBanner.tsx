import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X, Share } from "lucide-react";

const BANNER_DISMISSED_KEY = "sapsap_pwa_dismissed";
const DELAY_MS = 30_000;

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(BANNER_DISMISSED_KEY)) return;

    // Show only when we can prompt (or on iOS where we just guide)
    if (!isInstallable && !isIOS) return;

    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [isInstallable, isInstalled, isIOS]);

  if (!visible || isInstalled) return null;

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    const r = await install();
    if (r === "accepted") setVisible(false);
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 py-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)" }}
      role="dialog"
      aria-label="Installer SapSapHouse"
    >
      <div className="max-w-md mx-auto flex items-start gap-3">
        <img
          src="/icons/icon-96x96.png"
          alt=""
          className="w-10 h-10 rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">
            Installer SapSapHouse
          </div>
          {isIOS ? (
            <div className="text-xs text-muted-foreground mt-0.5">
              Appuyez sur <Share className="inline h-3 w-3 mx-0.5" /> Partager
              puis « Sur l'écran d'accueil ».
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-0.5">
              Accès rapide depuis votre écran d'accueil.
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={dismiss}
              className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              Plus tard
            </button>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Installer →
              </button>
            )}
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
