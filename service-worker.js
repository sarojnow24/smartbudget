const CACHE_NAME = "smartbudget-cache-v5";

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL — Pre-cache basic files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error("Cache addAll failed:", err);
    })
  );
  self.skipWaiting();
});

// ACTIVATE — Remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH — Network first, cache fallback (with protection for chrome-extension)
self.addEventListener("fetch", event => {
  // Validate request URL
  const url = event.request && event.request.url ? event.request.url : "";

  // 1) Skip chrome-extension:// and other unsupported schemes
  if (!url.startsWith("http")) {
    return; // Let the browser handle it
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache good HTTP responses
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone).catch(err => {
            // Some responses cannot be cached (opaque, CORS, etc.)
            // We ignore these safely
          });
        });

        return response;
      })
      .catch(() => {
        // Network failed → check cache → fallback to index.html offline
        return caches.match(event.request)
          .then(cached => cached || caches.match("./index.html"));
      })
  );
});

