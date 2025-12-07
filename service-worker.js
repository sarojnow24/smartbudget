const APP_VERSION = "1.0.0"; 
const CACHE_NAME = `smartbudget-cache-v${APP_VERSION}`;

// Full list of files in your GitHub repo
const contentToCache = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png",
  "./main.js",         // Add this if you have a main JS
  "./style.css",       // Add this if you have a CSS file
  "./manifest.json",
  "./screenshot1.png",
  "./screenshot2.png",
  "./well-known/assetlinks.json"
  // Add more assets if you have others like fonts, images, icons
];

// Install: cache all files
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("[SW] Caching app shell & content");
      await cache.addAll(contentToCache);
    })()
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve cached content, fallback to offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
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
