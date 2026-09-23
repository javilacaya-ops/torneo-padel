const CACHE_NAME = 'torneo-padel-v10';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isAppShell = req.mode === 'navigate' || req.destination === 'document' ||
                      req.url.endsWith('/') || req.url.endsWith('index.html');

  if (isAppShell) {
    // Red primero: así cada actualización se ve de inmediato con internet.
    // Si no hay conexión, usa la última copia guardada.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // Assets estáticos (icono, manifest): caché primero, ya que casi no cambian.
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
