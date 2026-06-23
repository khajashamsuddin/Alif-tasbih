/* ═══════════════════════════════════════════════════════════
   Alif Tasbih — Dedicated Firebase Messaging Service Worker
═══════════════════════════════════════════════════════════ */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Received background message:', payload);

  const notif       = payload.notification || {};
  const data        = payload.data         || {};
  const title       = notif.title        || data.title        || 'Alif Tasbih Reminder';
  const body        = notif.body         || data.body         || '';
  const icon        = notif.icon         || data.icon         || './icon-192.PNG';
  const clickAction = notif.click_action || data.click_action || './';
  const tag         = data.tag           || 'fcm-push';

  const options = {
    body,
    icon,
    badge: './icon-192.PNG',
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const payload = event.notification.data || {};

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            return;
          }
        }
        if (clients.openWindow) {
          const targetUrl = payload.clickAction || '/Alif-tasbih/';
          return clients.openWindow(targetUrl);
        }
      })
  );
});
