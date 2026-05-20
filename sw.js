// Service Worker for Tower Defense — enables offline play
const CACHE = 'td-v49';
const FILES = [
  './',
  './index.html',
  './js/Game.js?v=48',
  './js/Enemy.js?v=48',
  './js/Projectile.js?v=48',
  './js/Tower.js?v=48',
  './js/Map.js?v=48',
  './js/WaveManager.js?v=48',
  './js/Mine.js?v=48',
  './js/Trap.js?v=48',
  './js/constants.js?v=48',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
