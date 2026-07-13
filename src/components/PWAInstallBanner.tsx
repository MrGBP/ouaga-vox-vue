import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X, Share } from "lucide-react";

const SNOOZE_KEY = "sapsap_pwa_snoozed_until";
const FIRST_DELAY_MS = 4_000;
const SNOOZE_MS = 24 * 60 * 60 * 1000; // 1 jour après "Plus tard"
const REMIND_MS = 90_000; // ré-apparaît après 90s si simplement fermé (X)

function isMobileOrTablet() {
  if (typeof window === "undefined") return false;
  // Coarse pointer = touch device (mobile / tablette)
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 1280;
  return coarse || narrow;
}

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    if (typeof window === "undefined") return;
    if (!isMobileOrTablet()) return;
    if (!isInstallable && !isIOS) return;

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    const now = Date.now();
    const delay = snoozedUntil > now ? snoozedUntil - now : FIRST_DELAY_MS;

    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [isInstallable, isInstalled, isIOS]);

  // Re-nag: si l'utilisateur ferme sans "Plus tard", on revient dans REMIND_MS
  useEffect(() => {
    if (visible) return;
    if (isInstalled) return;
    if (!isInstallable && !isIOS) return;
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozedUntil > Date.now()) return;
    const t = setTimeout(() => setVisible(true), REMIND_MS);
    return () => clearTimeout(t);
  }, [visible, isInstallable, isInstalled, isIOS]);

  if (!visible || isInstalled) return null;

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setVisible(false);
  };
  const closeSoft = () => {
    // Fermeture douce : reviendra dans REMIND_MS
    localStorage.removeItem(SNOOZE_KEY);
    setVisible(false);
  };

  const handleInstall = async () => {
    const r = await install();
    if (r === "accepted") {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
      setVisible(false);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-4 py-3 animate-slide-in-right"
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
              Accès rapide depuis votre écran d'accueil, en un clic.
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={snooze}
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
          onClick={closeSoft}
          aria-label="Fermer"
          className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
