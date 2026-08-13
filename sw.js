const CACHE = 'linggan-shaizi-v8';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './fonts/fonts.css'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(a => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
  // Tell open pages to reload so the new version shows immediately
  self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage('reload-new-version')));
});

self.addEventListener('fetch', e => {
  // Cache-first for everything; on miss, fetch and cache same-origin GETs
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET' && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
    )
  );
});
