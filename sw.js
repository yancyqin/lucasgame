// Service Worker for Tower Defense — enables offline play
const CACHE = 'td-v47';
const FILES = [
  './',
  './index.html',
  './js/Game.js?v=47',
  './js/Enemy.js?v=47',
  './js/Projectile.js?v=47',
  './js/Tower.js?v=47',
  './js/Map.js?v=47',
  './js/WaveManager.js?v=47',
  './js/Mine.js?v=47',
  './js/Trap.js?v=47',
  './js/constants.js?v=47',
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
