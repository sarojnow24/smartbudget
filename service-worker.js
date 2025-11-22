const CACHE_NAME = "smartbudget-cache-v2";

const urlsToCache = [
  "/", 
  "/index.html",

  // icons
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.png",

  // external libraries cached dynamically
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Network falling back to cache (best for dynamic scripts/CDNs)
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Save a copy to cache for offline use
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, respClone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request)
          .then(cached => cached || caches.match("/index.html"));
      })
  );
});
