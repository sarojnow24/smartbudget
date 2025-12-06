// Change version number on each release
const CACHE_NAME = "smartbudget-cache-v6";

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// Install - Pre-cache basic files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(()=>{})
  );
  self.skipWaiting();
});

// Activate - remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", event => {
  const url = event.request?.url || "";

  if (!url.startsWith("http")) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c=>c.put(event.request, response.clone()).catch(()=>{}));
          }
          return response;
        })
        .catch(()=>caches.match("./offline.html"))
    );
    return;
  }

  // Other requests
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(c=>c.put(event.request, response.clone()).catch(()=>{}));
        }
        return response;
      }).catch(()=>cached)
    )
  );
});

// Listen to skipWaiting messages
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
