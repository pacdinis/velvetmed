// ============================================================
// sw.js — Service Worker (offline + cache)
// VelvetMed Angola App
// ============================================================

const CACHE_NAME = 'velvetmed-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/utils.js',
  '/js/store.js',
  '/js/api.js',
  '/js/sync.js',
  '/js/gps.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/ponto.js',
  '/js/mapa.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalar — pré-cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar — limpar caches antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first para assets estáticos, network-first para API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Chamadas ao Apps Script — sempre network, sem cache
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ ok: false, error: 'offline' }),
          { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Assets estáticos — cache first, fallback network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
      )
  );
});
