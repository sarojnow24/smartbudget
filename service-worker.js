// ----------------- Version and Cache -----------------
const APP_VERSION = "1.0.0"; // Update when releasing a new version
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// ----------------- Install -----------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

// ----------------- Activate -----------------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

// ----------------- Fetch -----------------
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()).catch(() => {}));
          }
          return response;
        })
        .catch(() => caches.match("./offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()).catch(() => {}));
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
