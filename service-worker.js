const CACHE_NAME = '36-xun-calendar-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/output.css',
  '/src/core/app.js',
  '/src/core/State.js',
  '/src/core/Calendar.js',
  '/src/core/BackgroundLoader.js',
  '/src/components/MacroView.js',
  '/src/components/OverviewView.js',
  '/src/components/DetailView.js',
  '/src/components/SummaryView.js',
  '/src/components/Modal.js',
  '/src/components/BackupModal.js',
  '/src/components/SettingsModal.js',
  '/src/components/BodyStateSelector.js',
  '/src/components/SleepSlider.js',
  '/src/components/CompleteSleepModule.js',
  '/src/components/XunSleepTrendChart.js',
  '/src/components/MoneyAwarenessModule.js',
  '/src/components/MoneyObservationSummary.js',
  '/src/components/MenstrualView.js',
  '/src/config.js',
  '/src/quote.js',
  '/src/core/XunSummary.js',
  '/src/core/sync/BackupManager.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls and non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response since it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache the new resource
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Return a basic offline fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});
