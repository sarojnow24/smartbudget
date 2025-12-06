const CACHE_NAME = "smartbudget-cache-v5";

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL — Pre-cache essential files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(()=>{})
  );
  self.skipWaiting();
});

// ACTIVATE — Delete old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// FETCH — Network-first strategy
self.addEventListener("fetch", event => {
  const url = event.request && event.request.url ? event.request.url : "";

  if (!url.startsWith("http")) return;

  // Navigation (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone).catch(()=>{}));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(cached => cached || caches.match("./offline.html"))
        )
    );
    return;
  }

  // Other requests: network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone).catch(()=>{}));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached))
  );
});
