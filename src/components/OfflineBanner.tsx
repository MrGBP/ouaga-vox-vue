import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs py-1.5 font-medium">
      📡 Vous êtes hors ligne — Contenu en cache affiché
    </div>
  );
}
