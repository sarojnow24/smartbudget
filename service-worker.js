const APP_VERSION = '1.0.0'; // Update for each release
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

// List of files to cache for offline support
const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json",      // add your JS file(s)
  "./style.css"     // add your CSS file(s)
];

// Install service worker and cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error("Cache failed:", err))
  );
  self.skipWaiting();
});

// Activate service worker and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

// Fetch handler to serve cached content or fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Put a copy of the response in the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // If fetch fails (offline), return from cache or fallback
        return caches.match(event.request)
          .then(cached => cached || caches.match('./offline.html'));
      })
  );
});

// Skip waiting for updates when notified
self.addEventListener('message', (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
