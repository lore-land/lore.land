const CACHE_VERSION = 'lore-pwa-v2026_07_18.B';
const OFFLINE_URL = '/book/pwa/offline.html';

/* Precache is exactly one file: the offline shell, which is self-contained
 * (inline styles) so it renders whole with zero network and never drifts
 * against hashed build assets. Nothing else is promised up front
 * (lore-c005-offline-honesty); visited pages accumulate via the fetch
 * handler below. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
