import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // registration handled by src/pwa/registerSW.ts
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "offline.html",
        "icons/*.png",
      ],
      manifest: {
        name: "SapSapHouse",
        short_name: "SapSapHouse",
        description:
          "Location immobilière au Burkina Faso, au Mali et au Ghana",
        theme_color: "#1a3560",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "fr",
        categories: ["lifestyle", "travel", "business"],
        icons: [
          { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        shortcuts: [
          { name: "Carte des biens", short_name: "Carte", description: "Voir tous les biens sur la carte", url: "/?tab=map", icons: [{ src: "/icons/shortcut-map.png", sizes: "96x96" }] },
          { name: "Rechercher un bien", short_name: "Rechercher", description: "Rechercher un logement", url: "/?tab=search", icons: [{ src: "/icons/shortcut-search.png", sizes: "96x96" }] },
          { name: "Mes favoris", short_name: "Favoris", description: "Voir mes biens favoris", url: "/?tab=favorites", icons: [{ src: "/icons/shortcut-heart.png", sizes: "96x96" }] },
        ],
        screenshots: [
          { src: "/screenshots/mobile-home.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Accueil SapSapHouse sur mobile" },
          { src: "/screenshots/desktop-home.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "SapSapHouse sur desktop" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "property-images-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes("tile.openstreetmap") ||
              url.hostname.includes("tiles.stadiamaps"),
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles-cache",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes("fonts.googleapis") ||
              url.hostname.includes("fonts.gstatic"),
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        // Le service worker est désactivé en dev / preview Lovable.
        // Il ne s'active qu'en production publiée.
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
