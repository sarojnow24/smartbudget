const CACHE_NAME = "smartbudget-cache-v5";

const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL — Pre-cache basic files

self.addEventListener("fetch", event => {
  const url = event.request && event.request.url ? event.request.url : "";

  // Ignore non-http(s) requests (chrome-extension etc.)
  if (!url.startsWith("http")) return;

  // Network-first for navigation (page load)
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
        .catch(() => caches.match(event.request).then(cached => cached || caches.match("./offline.html")))
    );
    return;
  }

  // Network-first for other requests (scripts, images, etc.)
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


