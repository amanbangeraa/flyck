/// <reference lib="webworker" />

const CACHE_NAME = 'flyck-cache-v1';
const SHELL = [
  '/',
  '/fallback.jpg',
  '/styles/globals.css',
];

self.addEventListener('install', (e: ExtendableEvent) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.destination === 'image') {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then(
          (resp) =>
            resp ||
            fetch(req)
              .then((netResp) => {
                cache.put(req, netResp.clone());
                return netResp;
              })
              .catch(() => cache.match('/fallback.jpg'))
        )
      )
    );
  }
});
