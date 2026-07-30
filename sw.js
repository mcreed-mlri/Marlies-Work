/* Minimal service worker for Marlie's MLRI Work PWA. */
/* Bumped to v5 when the icons moved into icons/. This one is not optional: every
   entry in PRECACHE below changed path, so a returning visitor's STATIC_CACHE holds
   six URLs that now 404. The activate handler only deletes caches whose names do not
   match, so without a rename the stale entries would survive.

   README explains the general rule: bump after significant changes. Change both
   names together. v4 was masslegalhelp/ plus the shared result copy. */
const CACHE = 'mlri-work-v5';
const STATIC_CACHE = 'mlri-work-static-v5';

// Only precache assets that rarely change. HTML/JS/CSS stay network-first.
const PRECACHE = [
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/favicon.ico',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const MUTABLE = /\.(?:html?|js|css|json|webmanifest)$/i;

function isMutable(url) {
  return MUTABLE.test(url.pathname) || url.pathname.endsWith('/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: always try the network; keep a copy only for offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // HTML, JS, CSS, and JSON: network-first so deploys reach users without a hard refresh.
  if (isMutable(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for stable assets (images, fonts, etc.).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
