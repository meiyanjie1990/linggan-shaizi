const CACHE = 'linggan-shaizi-v11';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './fonts/fonts.css'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
  // 让已经打开的页面刷新到新版本
  self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage('reload-new-version')));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 页面本身：网络优先（每次打开都拿最新版，绕过一切缓存时机问题），断网才用缓存兜底
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }
  // 字体、图标等静态资源：缓存优先，离线也能用
  e.respondWith(
    caches.match(req).then(r =>
      r || fetch(req).then(res => {
        if (res.ok && req.method === 'GET' && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
