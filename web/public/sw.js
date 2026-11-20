/* YBS Finder offline cache — static shell only (APIs are network-only). */
const CACHE = "ybs-finder-v2";
const PRECACHE = ["/", "/plan", "/stops", "/routes", "/favorites", "/nearby", "/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API: network-only — avoid stale route/plan data and admin leakage in cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline")),
    );
    return;
  }

  // Pages/assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached || caches.match("/offline"));
      return cached || network;
    }),
  );
});
