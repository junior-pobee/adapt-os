const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const CACHE_NAME = "adapt-os-react-v2";
const APP_SHELL = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/offline.html`,
  `${BASE_PATH}/manifest.json`
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("adapt-os-react-") && key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(`${BASE_PATH}/`)) return;
  if (url.pathname.startsWith(`${BASE_PATH}/api/`)) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await caches.match(`${BASE_PATH}/offline.html`)) ?? Response.error();
      return Response.error();
    })
  );
});
