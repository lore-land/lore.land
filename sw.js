const CACHE_VERSION = 'lore-pwa-v2026_02_28.G';
const OFFLINE_URL = '/book/pwa/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll([
        OFFLINE_URL,
        '/book/styles/fixtures/fonts.css?v=2026_02_28.G&ctx=canon:fonts',
        '/book/styles/fixtures/baseline.css?v=2026_02_28.G&ctx=canon:baseline',
        '/book/styles/fixtures/home.css?v=2026_02_28.G&ctx=home:scene'
      ]);
    }).then(() => self.skipWaiting())
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
