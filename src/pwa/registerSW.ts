// Guarded service-worker registration wrapper.
// Never registers in dev, iframe preview, Lovable preview hosts,
// or when ?sw=off is present. In those contexts it also unregisters
// any previously installed /sw.js to keep the preview clean.

const SW_PATH = "/sw.js";

function hostnameMatchesRefusedPreview(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterExistingAppSW(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_PATH);
        })
        .map((r) => r.unregister())
    );
  } catch {
    /* noop */
  }
}

export async function registerAppSW(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const urlHasKill = new URL(window.location.href).searchParams.get("sw") === "off";
  const refused =
    !import.meta.env.PROD ||
    inIframe ||
    hostnameMatchesRefusedPreview(window.location.hostname) ||
    urlHasKill;

  if (refused) {
    await unregisterExistingAppSW();
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Notify PWAUpdatePrompt component
        window.dispatchEvent(
          new CustomEvent("sapsap:sw-update", { detail: { updateSW } })
        );
      },
      onOfflineReady() {
        // eslint-disable-next-line no-console
        console.log("[PWA] SapSapHouse prêt hors ligne");
      },
    });
  } catch {
    /* noop */
  }
}
