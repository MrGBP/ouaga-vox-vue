// Clé publique VAPID (safe à exposer côté client — la clé privée reste server-side)
export const VAPID_PUBLIC_KEY =
  "BGH0OoqBk8uG1f0ceXwJEjHcmwREyzRdQ9lRoKam9sIpE5T-qgc3pj5iY057w2v4nDRcYkPKcXdReELRQca2vUE";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}
