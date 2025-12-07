const CACHE_NAME = "smartbudget-cache-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// Install - cache core files immediately
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(() => {})
  );
  self.skipWaiting();
});

// Activate - remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch - cache-first strategy
self.addEventListener("fetch", event => {
  const url = event.request?.url || "";
  if (!url.startsWith("http")) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        // Serve cached page first
        if (cached) return cached;

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()).catch(()=>{}));
            }
            return response;
          })
          .catch(() => caches.match("./offline.html")); // fallback
      })
    );
    return;
  }

  // For other requests (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()).catch(()=>{}));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Skip waiting for updates
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
