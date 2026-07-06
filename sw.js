const CACHE = 'hub-vitoria-v8';
const HTML  = './hub.html';
const STATIC = [
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([HTML, ...STATIC]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // APIs externas: sem interceptação
  if (url.includes('api.anthropic.com') || url.includes('supabase.co')) return;

  // hub.html: network-first — sempre busca versão atual; cache só como fallback offline
  if (e.request.destination === 'document' || url.endsWith('hub.html') || url.includes('hub.html?')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(HTML, clone));
          return res;
        })
        .catch(() => caches.match(HTML))
    );
    return;
  }

  // Demais assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => {})
    )
  );
});
