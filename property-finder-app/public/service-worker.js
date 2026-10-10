const CACHE_NAME = 'property-finder-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      const cacheNames = keys;
      const cleanupTasks = cacheNames.map(async key => {
        try {
          const cache = await caches.open(key);
          const entries = await cache.keys();
          const sensitiveEntries = entries.filter(request => {
            const url = new URL(request.url);
            return url.pathname.startsWith('/api/') || request.headers.has('Authorization');
          });
          await Promise.all(sensitiveEntries.map(async request => {
            try {
              await cache.delete(request);
            } catch (error) {
              console.error('Failed to remove sensitive cached API/auth entry during activation:', error);
            }
          }));
          if (key !== CACHE_NAME) {
            await caches.delete(key);
          }
        } catch (error) {
          console.error('Failed to clean cache during service worker activation:', error);
        }
      });
      await Promise.all(cleanupTasks);
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const hasAuthorization = event.request.headers.has('Authorization');
  const isApiRequest = url.pathname.startsWith('/api/');

  if (hasAuthorization || isApiRequest) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(response => response || caches.match('/')))
  );
});
