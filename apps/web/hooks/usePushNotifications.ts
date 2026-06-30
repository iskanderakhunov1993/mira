"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const refreshSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(Boolean(subscription));
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const subscribe = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (publicKey) {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      }).catch(() => undefined);
    }

    window.localStorage.setItem("mira-push-subscribed", "true");
    setIsSubscribed(true);
    return true;
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => undefined);
    }
    window.localStorage.setItem("mira-push-subscribed", "false");
    setIsSubscribed(false);
  }, []);

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) setPermission(Notification.permission);
    refreshSubscription().catch(() => undefined);
  }, [refreshSubscription]);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
