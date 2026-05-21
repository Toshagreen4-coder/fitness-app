// Service Worker for 健身记录 (Fitness Tracker)
const CACHE_NAME = 'fitness-tracker-v1';
const ASSETS = [
  '/fitness-app/',
  '/fitness-app/index.html',
  '/fitness-app/manifest.json',
  '/fitness-app/icon.svg'
];

// Install: pre-cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf('chrome-extension://') === 0) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // Return cached response immediately
        return cached;
      }
      // Go to network
      return fetch(event.request).then(function(response) {
        // Only cache same-origin successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/fitness-app/index.html');
        }
        // For other requests, just fail gracefully
        return new Response('', { status: 408 });
      });
    })
  );
});
