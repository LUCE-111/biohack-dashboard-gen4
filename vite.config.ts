import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function offlinePwaPlugin(): Plugin {
  return {
    name: 'biohack-offline-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const bundleFiles = Object.keys(bundle)
        .filter((fileName) => fileName !== 'service-worker.js')
        .map((fileName) => `./${fileName}`);
      const precache = [
        './',
        './index.html',
        './manifest.webmanifest',
        './icons/icon-192.png',
        './icons/icon-512.png',
        ...bundleFiles,
      ];
      const source = `
const CACHE_NAME = 'biohack-dashboard-4.2.0';
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'service-worker.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), offlinePwaPlugin()],
});
