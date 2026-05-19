// Service Worker for Tower Defense — enables offline play
const CACHE = 'td-v42';
const FILES = [
  './',
  './index.html',
  './js/Game.js?v=42',
  './js/Enemy.js?v=42',
  './js/Projectile.js?v=42',
  './js/Tower.js?v=42',
  './js/Map.js?v=42',
  './js/WaveManager.js?v=42',
  './js/Mine.js?v=42',
  './js/Trap.js?v=42',
  './js/constants.js?v=42',
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
