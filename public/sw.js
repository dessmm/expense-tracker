const CACHE_NAME = 'zenith-ledger-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

// Install Event - Pre-cache basic app shell routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Dynamic caching and offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for Supabase calls or local API routes
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle navigate requests (HTML pages) - Network-first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest page version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If the specific route is not cached, return the root page "/"
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, images, etc.) - Cache-first with Network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache newly fetched static assets
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // If static asset fetch fails, return nothing/fallback
      });
    })
  );
});
