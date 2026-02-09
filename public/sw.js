/**
 * Service Worker for PWA Support
 * 
 * This service worker provides offline functionality by caching
 * static assets and API responses.
 */

const CACHE_NAME = 'bossnouadi-v1';
const STATIC_CACHE_NAME = 'bossnouadi-static-v1';
const DYNAMIC_CACHE_NAME = 'bossnouadi-dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/logo.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('bossnouadi-');
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // For API requests, use network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For static assets, use cache-first strategy
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For HTML pages, use network-first with cache fallback
  event.respondWith(networkFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Fetch failed:', error);
    // Return offline fallback if available
    return caches.match('/');
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, falling back to cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw error;
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  const data = event.data?.json() || {};
  const title = data.title || 'Boss Nouadi';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    dir: 'rtl',
    lang: 'ar',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background sync for offline data (for future use)
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // TODO: Implement background sync for offline data
  console.log('[ServiceWorker] Syncing data...');
}
