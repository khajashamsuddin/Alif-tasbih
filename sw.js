/* ═══════════════════════════════════════════════════════════
   Alif Tasbih — Service Worker
   Version: INCREMENT THIS ON EVERY DEPLOY to bust old caches
   e.g. v2 → v3 → v4 ...
═══════════════════════════════════════════════════════════ */
const SW_VERSION = 'alif-tasbih-v4'; // ← CHANGE THIS ON EVERY DEPLOY

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

/* ══════════════════════════════════════════════════════════
   BACKGROUND NOTIFICATION SCHEDULER
   Works on Android Chrome when SW is kept alive.
   Uses a self-rescheduling setTimeout loop inside the SW.
══════════════════════════════════════════════════════════ */

/* Called from index.html via postMessage when reminders change */
self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_REMINDERS') {
    scheduleNextReminder(data.reminders || []);
  }

  if (data.type === 'CANCEL_REMINDERS') {
    clearPendingTimers();
  }
});

let pendingTimers = [];

function clearPendingTimers() {
  pendingTimers.forEach(t => clearTimeout(t));
  pendingTimers = [];
}

/**
 * Given an array of reminder objects, schedule the next one
 * that should fire today (or tomorrow if all have passed).
 *
 * Reminder shape expected from index.html:
 * {
 *   id: string,
 *   title: string,
 *   msg: string,
 *   timeStr: 'HH:MM',   ← local time string
 *   enabled: boolean,
 *   targetId: string | null
 * }
 */
function scheduleNextReminder(reminders) {
  clearPendingTimers();

  const enabled = reminders.filter(r => r.enabled && r.timeStr);
  if (!enabled.length) return;

  const now = new Date();

  enabled.forEach(rem => {
    const [h, m] = rem.timeStr.split(':').map(Number);
    const fire = new Date(now);
    fire.setHours(h, m, 0, 0);

    // If already past today, schedule for tomorrow
    if (fire <= now) fire.setDate(fire.getDate() + 1);

    const delay = fire.getTime() - now.getTime();
    console.log(`[SW] Scheduling "${rem.title}" in ${Math.round(delay / 60000)} min`);

    const t = setTimeout(() => {
      showReminderNotification(rem);
      // Re-schedule same reminder for next day
      scheduleNextReminder([rem]);
    }, delay);

    pendingTimers.push(t);
  });
}

function showReminderNotification(rem) {
  self.registration.showNotification(rem.title, {
    body: rem.msg,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: rem.id,              // prevents duplicate stacking
    renotify: true,
    data: {
      target: 'dua',
      id: rem.targetId || null,
      reminderId: rem.id
    }
  });
}

/* ── NOTIFICATION CLICK ──────────────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const payload = event.notification.data || {};

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            client.postMessage(payload);
            return;
          }
        }
        // Open new window
        if (clients.openWindow) {
          const deepLink = encodeURIComponent(JSON.stringify(payload));
          return clients.openWindow(`./index.html?deepLink=${deepLink}`);
        }
      })
  );
});
