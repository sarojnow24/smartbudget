// ----------------- Version and Cache Name -----------------
const APP_VERSION = "1.0.0"; // Update this on new releases
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

// ----------------- Files to Cache -----------------
const urlsToCache = [
  "/smartbudget/",               // root
  "/smartbudget/index.html",
  "/smartbudget/offline.html",
  "/smartbudget/icon-192.png",
  "/smartbudget/icon-512.png"
  "/smartbudget/manifest.json"
];

// ----------------- Install Event -----------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ----------------- Activate Event -----------------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      )
    )
  );
  self.clients.claim();
});

// ----------------- Fetch Handler -----------------
self.addEventListener("fetch", event => {
  const url = event.request?.url || "";
  if (!url.startsWith("http")) return;

  // Handle page navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()).catch(()=>{}));
          }
          return response;
        })
        .catch(() => caches.match("/smartbudget/offline.html"))
    );
    return;
  }

  // Handle other resources (JS, CSS, images, icons)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()).catch(()=>{}));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// ----------------- Skip Waiting for Updates -----------------
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
