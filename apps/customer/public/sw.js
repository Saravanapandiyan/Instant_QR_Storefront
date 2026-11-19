// Self-unregistering Service Worker
// Automatically purges old Workbox/precache storage and unregisters itself immediately.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            console.log('[SW] Purging cache:', key);
            return caches.delete(key);
          })
        );
      })
      .then(function () {
        console.log('[SW] Unregistering service worker...');
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.claim();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          if (client.navigate) {
            client.navigate(client.url);
          }
        });
      })
  );
});

// Pass-through: NEVER serve stale index.html or intercept navigation
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
