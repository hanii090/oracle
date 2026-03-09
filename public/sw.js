/**
 * Sorca Service Worker
 * Handles push notifications for homework reminders, session prompts, etc.
 */

const CACHE_NAME = 'sorca-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
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
