import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthProvider } from "@/hooks/useAuth";
import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import SearchPage from "./pages/Search";
import ResultatsPage from "./pages/Resultats";
import PropertyPage from "./pages/Property";
import MonCompte from "./pages/MonCompte";
import Publier from "./pages/Publier";
import NotFound from "./pages/NotFound";
import { useCountryLocale } from "@/hooks/useCountryLocale";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import OfflineBanner from "@/components/OfflineBanner";

const AdminLayout = lazy(() => import("@/admin/AdminLayout"));
const OwnerLayout = lazy(() => import("@/owner/OwnerLayout"));

const queryClient = new QueryClient();

const LocaleSync = () => { useCountryLocale(); return null; };

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isPWA = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
    const isFirstLaunch = !localStorage.getItem('sapsap_launched');
    if (isFirstLaunch) localStorage.setItem('sapsap_launched', '1');
    return isPWA || isFirstLaunch;
  });

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NavigationProvider>
          <AnimatePresence>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          </AnimatePresence>
          <LocaleSync />
          <Toaster />
          <Sonner />
          <OfflineBanner />
          <PWAInstallBanner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/resultats" element={<ResultatsPage />} />
              <Route path="/property/:id" element={<PropertyPage />} />
              {/* Deep link partage : /bien/:id → même fiche, URL canonique pour partages */}
              <Route path="/bien/:id" element={<PropertyPage />} />
              <Route path="/mon-compte" element={<MonCompte />} />
              <Route path="/publier" element={<Publier />} />
              <Route
                path="/admin/*"
                element={
                  <Suspense fallback={
                    <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:14 }}>
                      Chargement…
                    </div>
                  }>
                    <AdminLayout />
                  </Suspense>
                }
              />
              <Route
                path="/proprietaire/*"
                element={
                  <Suspense fallback={
                    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                      Chargement…
                    </div>
                  }>
                    <OwnerLayout />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NavigationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
