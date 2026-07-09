// Service Worker dédié aux Web Push (séparé du SW Workbox généré par vite-plugin-pwa).
// Il gère uniquement les événements `push` et `notificationclick`.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "SapSapHouse", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "SapSapHouse";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-96x96.png",
    tag: payload.tag || "sapsap",
    data: payload.data || {},
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          try {
            await client.navigate(url);
            return client.focus();
          } catch {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })(),
  );
});
