const CACHE_NAME = "calculadora-do-produtor-pwa-v8-offline-app-shell";
const NOTIFICATION_CLICK_MESSAGE_TYPE = "CALC_ARTESAO_NOTIFICATION_CLICK";
const ICON_VERSION = "20260502-favicon-refresh";
const STATIC_ASSETS = [
  "/",
  "/entrar",
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

const NAVIGATION_FALLBACKS = [
  "/entrar",
  "/",
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
    if (request.destination === "image") {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(request);

          if (cached) {
            return cached;
          }

          const response = await fetch(request);
          await cache.put(request, response.clone());

          return response;
        }),
      );
    }

    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          const cachedPage = await cache.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          for (const fallbackPath of NAVIGATION_FALLBACKS) {
            const fallback = await cache.match(fallbackPath);

            if (fallback) {
              return fallback;
            }
          }

          throw new Error("Offline navigation fallback unavailable.");
        }
      }),
    );
    return;
  }

  const isNextStaticAsset = url.pathname.startsWith("/_next/static/");

  if (isNextStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        if (cached) {
          return cached;
        }

        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      }),
    );
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

  const isFontOrImage =
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script";

  if (!isPwaAsset && !isFontOrImage) {
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

function getNotificationTargetUrl(notification) {
  const fallbackUrl = new URL("/", self.location.origin);
  const targetPath = notification?.data?.targetPath;

  if (typeof targetPath !== "string" || !targetPath.trim()) {
    return fallbackUrl;
  }

  try {
    const targetUrl = new URL(targetPath, self.location.origin);

    if (targetUrl.origin !== self.location.origin) {
      return fallbackUrl;
    }

    return targetUrl;
  } catch {
    return fallbackUrl;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = getNotificationTargetUrl(event.notification);

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clientList) => {
        const appClient = clientList.find((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });

        if (appClient) {
          if ("postMessage" in appClient) {
            appClient.postMessage({
              type: NOTIFICATION_CLICK_MESSAGE_TYPE,
              targetPath: `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
            });
          }

          if ("focus" in appClient) {
            await appClient.focus();
          }

          if ("navigate" in appClient) {
            const currentUrl = new URL(appClient.url);

            if (currentUrl.pathname !== targetUrl.pathname) {
              return appClient.navigate(targetUrl.href);
            }
          }

          return appClient;
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl.href);
        }

        return undefined;
      }),
  );
});
