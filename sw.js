/* Contramarea — Service Worker
 * Convierte el juego en una PWA instalable y jugable sin conexión.
 * Estrategia: cache-first para los archivos del propio juego, con red de
 * respaldo y almacenamiento en caché de lo que se descargue con éxito.
 */
'use strict';

const VERSION = 'contramarea-v1.0.0';

/* Rutas relativas al propio service worker: funcionan igual en src/ y en el
 * build empaquetado. Los assets viven un nivel por encima en ambos casos. */
const SHELL = [
  './',
  'index.html',
  'privacy.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/config.js',
  'js/save.js',
  'js/audio.js',
  'js/monetization.js',
  'js/engine.js',
  'js/render.js',
  'js/ui.js',
  'js/main.js'
];

const ICONS = [
  '../assets/icons/icon-192.png',
  '../assets/icons/icon-512.png',
  '../assets/icons/icon-1024.png',
  '../assets/icons/icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // allSettled: si un recurso opcional falla, la instalación no se rompe.
    await Promise.allSettled(
      SHELL.concat(ICONS).map((url) => cache.add(new Request(url, { cache: 'reload' })))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') { return; }

  const url = new URL(req.url);
  // Nunca cachear recursos de terceros (redes de anuncios, CDN externos).
  if (url.origin !== self.location.origin) { return; }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) { return cached; }
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      // Sin conexión: si es una navegación, servimos el juego desde la caché.
      if (req.mode === 'navigate') {
        const shell = await caches.match('index.html');
        if (shell) { return shell; }
      }
      throw err;
    }
  })());
});
