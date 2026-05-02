const CACHE_NAME = "calculadora-do-produtor-pwa-v5-icon-refresh";
const ICON_VERSION = "20260502-favicon-refresh";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  `/icon?v=${ICON_VERSION}`,
  `/apple-icon?v=${ICON_VERSION}`,
  `/pwa-icon-512.png?v=${ICON_VERSION}`,
  `/pwa-maskable-512.png?v=${ICON_VERSION}`,
  `/pwa-monochrome-512.png?v=${ICON_VERSION}`,
  `/android-chrome-512x512.png?v=${ICON_VERSION}`,
  `/android-chrome-192x192.png?v=${ICON_VERSION}`,
  `/icone-180x180.png?v=${ICON_VERSION}`,
  `/apple-touch-icon.png?v=${ICON_VERSION}`,
  `/favicon-32x32.png?v=${ICON_VERSION}`,
  `/favicon-16x16.png?v=${ICON_VERSION}`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

          return Promise.resolve(false);
        }),
      ),
    ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  const isPwaAsset =
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon" ||
    url.pathname === "/apple-icon" ||
    url.pathname === "/pwa-icon-512.png" ||
    url.pathname === "/pwa-maskable-512.png" ||
    url.pathname === "/pwa-monochrome-512.png" ||
    url.pathname === "/android-chrome-512x512.png" ||
    url.pathname === "/android-chrome-192x192.png" ||
    url.pathname === "/icone-180x180.png" ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/favicon-32x32.png" ||
    url.pathname === "/favicon-16x16.png";

  if (!isPwaAsset) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      if (cached) {
        void fetch(request)
          .then((response) => {
            if (response.ok) {
              return cache.put(request, response.clone());
            }

            return undefined;
          })
          .catch(() => undefined);

        return cached;
      }

      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    }),
  );
});
