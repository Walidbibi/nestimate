const CACHE = 'nestimate-v3';
const ASSETS = [
  './index.html',
  './css/styles.css',
  './js/utils.js',
  './js/calc.js',
  './js/amort.js',
  './js/ui.js',
  './js/main.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Réseau en priorité pour les polices externes et les fichiers JS/HTML
  if (e.request.url.includes('fontshare.com') || e.request.url.match(/\.(js|html)(\?|$)/)) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache en priorité pour le reste (CSS, icônes…)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
