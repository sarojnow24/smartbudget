const APP_VERSION = "1.0.0"; // Update for each release
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

const contentToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
  "./main.js",   // include your main JS
  "./style.css"  // include your CSS
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("[Service Worker] Caching app shell and content");
      await cache.addAll(contentToCache);
    })()
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve cached content, fetch & cache new content
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        // Serve from cache
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      try {
        // Fetch from network
        const response = await fetch(event.request);
        // Cache the new response for next time
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        console.log("[Service Worker] Fetched & cached:", event.request.url);
        return response;
      } catch (err) {
        // Offline fallback
        console.log("[Service Worker] Offline fallback:", event.request.url);
        if (event.request.mode === "navigate") {
          return caches.match("./offline.html");
        }
        return new Response(null, { status: 503, statusText: "Service Unavailable" });
      }
    })()
  );
});

// Listen for SKIP_WAITING message
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
