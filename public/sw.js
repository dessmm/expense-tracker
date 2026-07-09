const CACHE_NAME = 'zenith-ledger-v1.0.3';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/bills',
  '/budgets',
  '/goals',
  '/income',
  '/categories',
  '/settings',
  '/login',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

// Install Event - Pre-cache basic app shell routes individually to prevent failure cascade
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((asset) => {
          return fetch(asset)
            .then((response) => {
              if (response && response.status === 200) {
                return cache.put(asset, response);
              }
              console.warn(`ServiceWorker skipped caching asset during install: ${asset} (status: ${response ? response.status : 'unknown'})`);
            })
            .catch((err) => {
              console.warn(`ServiceWorker failed to fetch asset during install: ${asset}`, err);
            });
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches (Cache Invalidation)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('ServiceWorker deleting stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for Supabase calls or local API routes
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Caching Strategy:
  // 1. HTML Pages (navigate requests) and CSS/JS assets (hashed per Next.js build) -> Network-First (falling back to cache)
  // This ensures the latest assets are used online and prevents unstyled/broken stale page states.
  const isHtml = request.mode === 'navigate';
  const isCssOrJs = url.pathname.endsWith('.css') || 
                     url.pathname.endsWith('.js') || 
                     url.pathname.includes('_next/static/');

  if (isHtml || isCssOrJs) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // For HTML pages, return root fallback if specific path not cached
            if (isHtml) {
              return caches.match('/');
            }
            return new Response('Offline — Asset not cached', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // 2. Static public assets (images, icons, manifest) & web fonts -> Cache-First (falling back to network)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return new Response('Offline — Static asset not cached', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
