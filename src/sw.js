/* Service worker: offline app shell + cached fonts. The build injects BUILD_ID and PRECACHE. */
const BUILD_ID = '__BUILD_ID__';
const PRECACHE = self.__PRECACHE__ || [];
const SHELL_CACHE = `100top-shell-${BUILD_ID}`;
const RUNTIME_CACHE = '100top-runtime-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'verses.quran.foundation'];
const RUNTIME_LIMIT = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('100top-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

// Pages: network first so content updates show immediately; fall back to cache offline.
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(RUNTIME_CACHE, RUNTIME_LIMIT);
    }
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (await caches.match(request, { ignoreSearch: true }));
    if (cached) return cached;
    const shell = await caches.match('./');
    if (shell && request.mode === 'navigate') return shell;
    throw err;
  }
}

// Versioned assets and fonts never change for a given URL: cache first.
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate' || url.pathname.endsWith('.xml')) {
      event.respondWith(networkFirst(request));
    } else if (url.searchParams.has('v')) {
      event.respondWith(cacheFirst(request, SHELL_CACHE));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
  // Everything else (recitation audio) goes straight to the network.
});
