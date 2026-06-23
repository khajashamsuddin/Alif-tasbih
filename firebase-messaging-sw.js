/* ═══════════════════════════════════════════════════════════
   Alif Tasbih — Dedicated Firebase Messaging Service Worker
   SCOPE: /fcm-push/ (Dummy scope to prevent caching conflicts)
═══════════════════════════════════════════════════════════ */

// 1. Import Firebase Compat SDKs (Standard for non-module SWs)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// 2. Initialize Firebase (must match the app config)
firebase.initializeApp({
  apiKey: "AIzaSyAOR4xA3h_clZjX-XpeUEL4Mjj0leoG8hw",
  authDomain: "alif-tasbih.firebaseapp.com",
  projectId: "alif-tasbih",
  storageBucket: "alif-tasbih.firebasestorage.app",
  messagingSenderId: "808279704019",
  appId: "1:808279704019:web:5677b5369561b61538af26",
  measurementId: "G-T4Q904YRKN"
});

const messaging = firebase.messaging();

// 3. Handle Background Messages
// When the app is closed, Firebase triggers this callback.
// We then manually show the notification.
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Received background message:', payload);

  const notif       = payload.notification || {};
  const data        = payload.data         || {};
  const title       = notif.title        || data.title        || 'Alif Tasbih Reminder';
  const body        = notif.body         || data.body         || '';
  const icon        = notif.icon         || data.icon         || './icon-192.png';
  const clickAction = notif.click_action || data.click_action || './';
  const tag         = data.tag           || 'fcm-push';

  const options = {
    body,
    icon,
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag,
    renotify: true,
    data: {
      ...data,
      clickAction
    }
  };

  self.registration.showNotification(title, options);
});

// 4. Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
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
            return;
          }
        }
        // No open window — open a new one
        if (clients.openWindow) {
          const targetUrl = payload.clickAction || '/Alif-tasbih/';
          return clients.openWindow(targetUrl);
        }
      })
  );
});
