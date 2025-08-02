// Increment this version when any of the cached files change.
// The new service worker will remove old caches during activation.
const CACHE_NAME = 'med-tracker-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Activate worker immediately after install
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // Begin controlling any existing clients
      .then(() =>
        // Notify clients so they can refresh and load the new version
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        })
      )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    // Only handle GET requests
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Update the cache with a fresh version of the resource
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // Fall back to cache when offline

      // Serve cached response immediately if available, otherwise use network
      return cachedResponse || fetchPromise;
    })
  );
});

// Allow the currently waiting service worker to skip the waiting phase.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
