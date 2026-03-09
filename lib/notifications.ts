/**
 * Push Notifications Service
 * Handles browser push notifications for homework reminders, session prompts, etc.
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

// Register service worker for push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const keyArray = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray,
    });
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// Show a local notification (when app is in foreground)
export async function showLocalNotification(payload: NotificationPayload): Promise<void> {
  if (!isPushSupported()) return;
  
  const permission = getNotificationPermission();
  if (permission !== 'granted') return;
  
  const registration = await navigator.serviceWorker.ready;
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-72.png',
    tag: payload.tag,
    data: payload.data,
  };
  await registration.showNotification(payload.title, options);
}

// Notification types for the app
export const NOTIFICATION_TYPES = {
  HOMEWORK_REMINDER: 'homework_reminder',
  SESSION_PROMPT: 'session_prompt',
  CRISIS_ALERT: 'crisis_alert',
  WEEK_SUMMARY: 'week_summary',
  TIME_CAPSULE: 'time_capsule',
  DAILY_CHECKIN: 'daily_checkin',
  VOICE_SESSION_SUMMARY: 'voice_session_summary',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Default notification settings
export interface NotificationSettings {
  enabled: boolean;
  homeworkReminders: boolean;
  homeworkReminderTime: string; // HH:MM format
  sessionPrompts: boolean;
  weekSummaryAlerts: boolean;
  timeCapsuleAlerts: boolean;
  dailyCheckin: boolean;
  dailyCheckinTime: string; // HH:MM format
  voiceSessionSummaries: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  homeworkReminders: true,
  homeworkReminderTime: '09:00',
  sessionPrompts: true,
  weekSummaryAlerts: true,
  timeCapsuleAlerts: true,
  dailyCheckin: true,
  dailyCheckinTime: '09:00',
  voiceSessionSummaries: true,
};
