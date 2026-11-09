const CACHE_VERSION = 'lore-pwa-v2026_11_09.L';
/* Chapters a reader has opened (or asked to keep) live in their own cache,
 * which survives releases: navigations are network-first, so a kept page is
 * only ever served when the network is gone, and it is refreshed on the next
 * online visit. Prose is prerendered, so a kept page is a readable page. */
const PAGES_CACHE = 'lore-pages-v1';
/* What a kept page needs to be itself — its stylesheets, its scripts and every
 * module they import — lives beside it and survives releases too, so a page kept
 * last month still opens dressed and working offline. Versioned URLs (?v=…) mean
 * an old page asks for its own old assets, and finds them here. */
const KEPT_ASSETS = 'lore-kept-assets-v1';
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
      .filter((key) => key !== CACHE_VERSION && key !== PAGES_CACHE && key !== KEPT_ASSETS)
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
  for (const match of html.matchAll(/<link[^>]+rel="(?:stylesheet|modulepreload|preload)"[^>]+href="([^"]+)"/g)) found.add(match[1]);
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) found.add(match[1]);
  return [...found]
    .map((href) => new URL(href, base))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);
}

/** The modules a script imports (static and dynamic, with their ?v= tokens), so a kept page keeps its whole graph. */
function importedAssets(source, base) {
  const found = new Set();
  for (const match of source.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]/gm)) {
    const spec = match[1] || match[2] || match[3];
    if (spec && (spec.startsWith('.') || spec.startsWith('/'))) found.add(new URL(spec, base).href);
  }
  return [...found].filter((href) => new URL(href).origin === self.location.origin);
}

async function keepAsset(shelf, asset, seen, budget) {
  if (seen.has(asset) || seen.size >= budget) return;
  seen.add(asset);
  let response = await shelf.match(asset);
  if (!response) {
    try {
      response = await fetch(asset);
      if (!cacheable(response)) return;
      await shelf.put(asset, response.clone());
    } catch {
      // A missing stylesheet leaves a readable, plainer page — prose is prerendered.
      return;
    }
  }
  if (/\.m?js(\?|$)/.test(asset)) {
    const source = await response.text().catch(() => '');
    for (const next of importedAssets(source, asset)) await keepAsset(shelf, next, seen, budget);
  }
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
  const shelf = await caches.open(KEPT_ASSETS);
  const seen = new Set();
  for (const asset of wanted) await keepAsset(shelf, asset, seen, 900);
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

/** The page that answers a navigation: an address that begins ?/ is a route, and /texture/ answers it. */
function answeringRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === '/' && url.search.startsWith('?/')) return new Request(`${url.origin}/texture/${url.search}`, { credentials: 'same-origin' });
  return null;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const route = answeringRequest(request);
      const key = pageKey(route ? route.url : request.url);
      const network = (async () => {
        const response = route ? await fetch(route) : ((await event.preloadResponse) || await fetch(request));
        if (cacheable(response)) {
          const copy = response.clone();
          event.waitUntil(caches.open(PAGES_CACHE).then((cache) => cache.put(key, copy)));
        }
        return response;
      })();
      // Network first, always: a kept copy answers only when the network fails. (Racing a slow network with the
      // kept copy served an older release's page under this release's styles, which looked broken.)
      try {
        return await network;
      } catch {
        const kept = await caches.match(key, { ignoreSearch: true });
        return kept || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  /* The book's own data (catalog, release notes, the almanac, the hand) is asked of the network first, so a
   * returning reader never reads last release's notes; the copy answers offline. */
  if (url.pathname.startsWith('/book/content/') || url.pathname.startsWith('/book/fonts/spwashi/')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (cacheable(response)) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)));
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        return cached || Response.error();
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
