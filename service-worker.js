const CACHE_NAME = '36-xun-calendar-v2'; // Bumped version to clear old cache
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
        // Use catch to prevent one missing file from stopping the whole cache process
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(url).catch(err => console.warn(`[Service Worker] Failed to cache ${url}:`, err))
          )
        );
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

// Fetch event - Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls and non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Vite's HMR and internal requests during development
  if (event.request.url.includes('@vite') || event.request.url.includes('@fs') || event.request.url.includes('node_modules')) {
    return;
  }

  // Use Network First strategy instead of Cache First
  // This ensures we always get the latest version if online, fixing the "stale UI on refresh" issue
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response and update cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch((error) => {
        console.log('[Service Worker] Network request failed, falling back to cache for:', event.request.url);
        return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            // If HTML request fails and not in cache, return index.html
            if (event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/index.html');
            }
        });
      })
  );
});
