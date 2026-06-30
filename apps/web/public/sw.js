const CACHE_NAME = "mira-cache-v4";
const OFFLINE_URL = "/offline";
const APP_SHELL = [
  "/",
  "/today",
  "/care",
  "/profile",
  "/manifest.webmanifest",
  "/mira-icon.svg",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          return (await caches.match(event.request)) || (await caches.match("/")) || (await caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.startsWith("/_next/static/") || /\.(svg|png|ico|woff2?|css|js)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetched;
        })
      )
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "MIRA",
    body: "Есть мягкое напоминание для тебя.",
    url: "/today",
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/today" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/today";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
