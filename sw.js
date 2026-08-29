// Service worker — Planilla ODET
// App shell cache-first (para abrir sin señal). Las llamadas a Supabase van por
// red normal (los datos frescos importan; el offline de datos es una fase futura).
const CACHE = 'odet-planilla-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && url.origin === location.origin) {
    // App shell: cache-first con actualización en segundo plano.
    e.respondWith(
      caches.match(e.request).then(cached => {
        const net = fetch(e.request).then(resp => {
          if (resp && resp.status === 200) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          return resp;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
  // Supabase y CDN: red normal (no interceptar).
});
