/**
 * Sorca Service Worker
 * Handles push notifications, offline caching, and PWA support.
 */

const CACHE_NAME = 'sorca-v2';
const STATIC_CACHE = 'sorca-static-v2';
const DYNAMIC_CACHE = 'sorca-dynamic-v2';

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192',
  '/icon-512',
];

// Install event — precache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache failed for some resources:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event — network-first for pages/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // API requests — network only (don't cache API responses)
  if (url.pathname.startsWith('/api/')) return;

  // Static assets (JS, CSS, images, fonts) — cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|ico)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML pages — network-first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'Sorca',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'sorca-notification',
    data: {},
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.data?.urgent || false,
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/';
  
  // Route based on notification type
  switch (data.type) {
    case 'homework_reminder':
      url = '/user-dashboard?tab=homework';
      break;
    case 'session_prompt':
      url = '/?start=true';
      break;
    case 'crisis_alert':
      url = '/dashboard';
      break;
    case 'week_summary':
      url = '/user-dashboard?tab=summaries';
      break;
    case 'time_capsule':
      url = '/user-dashboard?tab=capsule';
      break;
    case 'daily_checkin':
      url = '/user-dashboard?tab=mood';
      break;
    case 'voice_session_summary':
      url = '/user-dashboard?tab=voice';
      break;
    default:
      url = data.url || '/';
  }

  // Handle notification actions (buttons)
  if (event.action === 'checkin') {
    url = '/user-dashboard?tab=mood';
  } else if (event.action === 'voice') {
    url = '/user-dashboard?tab=voice&start=true';
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
