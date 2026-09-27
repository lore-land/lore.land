const CACHE_VERSION = 'lore-pwa-v2026_09_26.B';
/* Chapters a reader has opened (or asked to keep) live in their own cache,
 * which survives releases: navigations are network-first, so a kept page is
 * only ever served when the network is gone, and it is refreshed on the next
 * online visit. Prose is prerendered, so a kept page is a readable page. */
const PAGES_CACHE = 'lore-pages-v1';
const OFFLINE_URL = '/book/pwa/offline.html';

/* Precache is the offline shell and its icons, nothing more. The shell is
 * self-contained (inline styles and script) so it renders whole with zero
 * network and never drifts against hashed build assets
 * (lore-c005-offline-honesty). Everything else accumulates by use. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([
      '/book/pwa/offline.html',
      '/book/pwa/icons/favicon.svg',
      '/book/pwa/icons/icon-192.png'
    ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== CACHE_VERSION && key !== PAGES_CACHE)
      .map((key) => caches.delete(key)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/** Pages are keyed by path: ?try= and ?source= visits share one kept copy. */
function pageKey(url) {
  const { origin, pathname } = new URL(url);
  return new Request(`${origin}${pathname}`);
}

function cacheable(response) {
  return response && response.ok && response.type === 'basic';
}

/** Stylesheets and scripts a kept page links to, so it is kept dressed. */
function linkedAssets(html, base) {
  const found = new Set();
  for (const match of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) found.add(match[1]);
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) found.add(match[1]);
  return [...found]
    .map((href) => new URL(href, base))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);
}

async function keepPages(urls, assets, client) {
  const pages = await caches.open(PAGES_CACHE);
  const wanted = new Set(assets);
  let kept = 0;
  for (const url of urls) {
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (cacheable(response)) {
        const html = await response.clone().text();
        linkedAssets(html, response.url || url).forEach((asset) => wanted.add(asset));
        await pages.put(pageKey(response.url || url), response);
        kept += 1;
      }
    } catch {
      // Offline or refused: keep what we can, report the count honestly.
    }
  }
  // Versioned assets (?v=release) belong to this release's cache.
  const shelf = await caches.open(CACHE_VERSION);
  await Promise.all([...wanted].map(async (asset) => {
    if (await shelf.match(asset)) {
      return;
    }
    try {
      const response = await fetch(asset);
      if (cacheable(response)) {
        await shelf.put(asset, response);
      }
    } catch {
      // A missing stylesheet leaves a readable, plainer page — prose is prerendered.
    }
  }));
  client?.postMessage({ type: 'CHAPTERS_KEPT', kept, total: urls.length });
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  /* Optional skipWaiting from the update toast (interaction-surface.mjs). */
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  /* The reader asked to keep every chapter (reading-switches.mjs). */
  if (data.type === 'KEEP_CHAPTERS' && Array.isArray(data.urls)) {
    const sameOrigin = (url) => new URL(url, self.location.origin).origin === self.location.origin;
    const urls = data.urls.filter(sameOrigin);
    const assets = (Array.isArray(data.assets) ? data.assets : []).filter(sameOrigin);
    event.waitUntil(keepPages(urls, assets, event.source));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = (await event.preloadResponse) || await fetch(request);
        if (cacheable(response)) {
          const copy = response.clone();
          event.waitUntil(caches.open(PAGES_CACHE).then((cache) => cache.put(pageKey(request.url), copy)));
        }
        return response;
      } catch {
        const kept = await caches.match(pageKey(request.url), { ignoreSearch: true });
        return kept || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (cacheable(response)) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
