import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { setMockEnabled, isMockEnabled } from "@/lib/mockMode";

// Helper console pour basculer en mode démo (réaffiche tout le contenu mock)
//   __sapsap.enableDemo()  → active mock + reload
//   __sapsap.disableDemo() → désactive + reload
(window as any).__sapsap = {
  enableDemo: () => { setMockEnabled(true); location.reload(); },
  disableDemo: () => { setMockEnabled(false); location.reload(); },
  isDemo: () => isMockEnabled(),
};

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Enregistrement du service worker (uniquement en production, hors preview Lovable)
import("./pwa/registerSW").then(({ registerAppSW }) => registerAppSW());


