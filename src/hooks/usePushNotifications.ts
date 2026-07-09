import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/pushConfig";
import { useAuth } from "@/hooks/useAuth";

const PUSH_SW_PATH = "/push-sw.js";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function isSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getOrRegisterPushSW(): Promise<ServiceWorkerRegistration | null> {
  if (!isSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration(PUSH_SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(PUSH_SW_PATH, { scope: "/" });
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PermissionState>(
    isSupported() ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported()) return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, [user?.id]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (!isSupported()) return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") return false;

      const reg = await getOrRegisterPushSW();
      if (!reg) return false;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!p256dh || !auth) return false;

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" },
      );
      if (error) {
        console.error("Failed to save push subscription", error);
        return false;
      }
      setSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported: isSupported(),
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
