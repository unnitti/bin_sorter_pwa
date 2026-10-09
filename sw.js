const CACHE = 'bin-sorter-cache-v02';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const networkUpdate = caches.open(CACHE).then((cache) =>
    fetch(event.request).then((response) => {
      if (response && response.ok) {
        return cache.put(event.request, response.clone()).then(() => response);
      }
      return response;
    })
  );

  // Keep the refresh alive even when a cached response is returned immediately.
  event.waitUntil(networkUpdate.then(() => undefined).catch(() => undefined));

  event.respondWith(
    caches.open(CACHE)
      .then((cache) => cache.match(event.request))
      .then((cached) => cached || networkUpdate)
  );
});
