/* ═══════════════════════════════════════════════════════════
   Alif Tasbih — Service Worker (Caching Only)
   Version: INCREMENT THIS ON EVERY DEPLOY to bust old caches
   e.g. v6 → v7 → v8 ...
═══════════════════════════════════════════════════════════ */
const SW_VERSION = 'alif-tasbih-v6'; // ← CHANGE THIS ON EVERY DEPLOY

/* Assets cached on install */
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/logo.png'
];

/* External CDN assets (cached on first fetch) */
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/adhan@4.3.3/lib/adhan.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  console.log(`[SW ${SW_VERSION}] Installing…`);
  event.waitUntil(
    caches.open(SW_VERSION).then(cache => {
      // Pre-cache local assets (failures are non-fatal individually)
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Pre-cache miss:', url, e))
        )
      );
    })
  );
  // Take over immediately — don't wait for old SW to die
  self.skipWaiting();
});

/* ── ACTIVATE ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  console.log(`[SW ${SW_VERSION}] Activating…`);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SW_VERSION)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH — Stale-While-Revalidate for HTML, Cache-First for rest ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  /* ── index.html → Network First (always get latest app) ── */
  if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          // Clone & cache the fresh version
          const clone = networkRes.clone();
          caches.open(SW_VERSION).then(c => c.put(event.request, clone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html')) // offline fallback
    );
    return;
  }

  /* ── Everything else → Cache First, update in background ── */
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(networkRes => {
          if (
            networkRes &&
            networkRes.status === 200 &&
            (networkRes.type === 'basic' || networkRes.type === 'cors')
          ) {
            const clone = networkRes.clone();
            caches.open(SW_VERSION).then(c => c.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(() => null);

      return cached || networkFetch;
    })
  );
});

/* ── NOTIFICATION CLICK ──────────────────────────────────── */
/* Handles clicks on foreground FCM pushes shown by this SW.  */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const payload = event.notification.data || {};

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus any existing open window / tab
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            return;
          }
        }
        // No open window — open a new one
        if (clients.openWindow) {
          return clients.openWindow(payload.clickAction || './');
        }
      })
  );
});

