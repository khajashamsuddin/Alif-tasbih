/* ═══════════════════════════════════════════════════════════
   Alif Tasbih — Service Worker (Caching + FCM Background Push)
   Version: INCREMENT THIS ON EVERY DEPLOY to bust old caches
═══════════════════════════════════════════════════════════ */

/* ── STEP 1: Firebase imports (FCM background support) ───── */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyAOR4xA3h_clZjX-XpeUEL4Mjj0leoG8hw',
  authDomain:        'alif-tasbih.firebaseapp.com',
  projectId:         'alif-tasbih',
  storageBucket:     'alif-tasbih.firebasestorage.app',
  messagingSenderId: '808279704019',
  appId:             '1:808279704019:web:5677b5369561b61538af26'
});

const messagingInstance = firebase.messaging();

/* Background message handler — fires when app is CLOSED or in background */
messagingInstance.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message received:', payload);

  const notif = payload.notification || {};
  const data  = payload.data         || {};

  const title = notif.title || data.title || 'Alif Tasbih';
  const body  = notif.body  || data.body  || '';
  const icon  = notif.icon  || data.icon  || './icon-192.PNG';

  self.registration.showNotification(title, {
    body,
    icon,
    badge:   './icon-192.PNG',
    vibrate: [200, 100, 200],
    tag:     data.tag || 'fcm-bg',
    renotify: true,
    data:    { ...data, clickAction: notif.click_action || data.click_action || './' }
  });
});

/* ── STEP 2: Caching config ──────────────────────────────── */
const SW_VERSION = 'alif-tasbih-v9'; // ← CHANGE THIS ON EVERY DEPLOY

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.PNG',
  './icon-512.PNG',
  './assets/logo.png'
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  console.log(`[SW ${SW_VERSION}] Installing…`);
  event.waitUntil(
    caches.open(SW_VERSION).then(cache => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Pre-cache miss:', url, e))
        )
      );
    })
  );
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

/* ── FETCH — Network First for HTML, Cache First for rest ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  /* index.html → Network First */
  if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          const clone = networkRes.clone();
          caches.open(SW_VERSION).then(c => c.put(event.request, clone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* Everything else → Cache First */
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200 &&
              (networkRes.type === 'basic' || networkRes.type === 'cors')) {
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
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const payload = event.notification.data || {};

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            client.postMessage(payload);
            return;
          }
        }
        if (clients.openWindow) {
          const deepLink = encodeURIComponent(JSON.stringify(payload));
          return clients.openWindow(`./index.html?deepLink=${deepLink}`);
        }
      })
  );
});