// ----------------- Version and Cache Name -----------------
const APP_VERSION = "1.0.0"; // Change this when releasing a new version
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

// ----------------- Files to Cache -----------------
const urlsToCache = [
  "./",
  "/smartbudget/?source=pwa",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// ----------------- Install -----------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ----------------- Activate -----------------
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

  // Handle page navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()).catch(()=>{}));
          }
          return response;
        })
        .catch(() => caches.match("./offline.html"))
    );
    return;
  }

  // Handle other requests (JS, CSS, images, icons)
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
