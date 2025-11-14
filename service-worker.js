const CACHE_NAME = 'smartbajet-cache-v1';
const urlsToCache = [
  '/',                  // home page
  '/index.html',        // your main HTML file
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install service worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Serve cached files when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
