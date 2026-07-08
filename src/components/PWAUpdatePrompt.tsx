import { useEffect, useState } from "react";

type UpdateFn = (reload?: boolean) => Promise<void>;

export default function PWAUpdatePrompt() {
  const [updateFn, setUpdateFn] = useState<UpdateFn | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ updateSW: UpdateFn }>).detail;
      if (detail?.updateSW) setUpdateFn(() => detail.updateSW);
    };
    window.addEventListener("sapsap:sw-update", handler as EventListener);
    return () => window.removeEventListener("sapsap:sw-update", handler as EventListener);
  }, []);

  if (!updateFn) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md bg-primary text-primary-foreground rounded-xl p-3 flex items-center justify-between shadow-lg">
      <span className="text-sm font-medium">🔄 Mise à jour disponible</span>
      <button
        onClick={() => updateFn(true)}
        className="text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 font-semibold transition-colors"
      >
        Mettre à jour
      </button>
    </div>
  );
}
