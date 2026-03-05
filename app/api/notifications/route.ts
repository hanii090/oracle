import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications';

/**
 * Notifications API — manage push notification subscriptions and settings
 * 
 * POST /api/notifications/subscribe - Subscribe to push notifications
 * POST /api/notifications/settings - Update notification settings
 * GET /api/notifications/settings - Get notification settings
 */

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  homeworkReminders: z.boolean().optional(),
  homeworkReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sessionPrompts: z.boolean().optional(),
  weekSummaryAlerts: z.boolean().optional(),
  timeCapsuleAlerts: z.boolean().optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/notifications', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Handle subscription
    if (body.subscription) {
      const parsed = subscribeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid subscription', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { subscription } = parsed.data;
      const now = new Date().toISOString();

      // Store subscription
      await db.collection('pushSubscriptions').doc(userId).set({
        userId,
        subscription,
        createdAt: now,
        updatedAt: now,
      });

      // Initialize settings if not exists
      const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
      if (!settingsDoc.exists) {
        await db.collection('notificationSettings').doc(userId).set({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          enabled: true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await db.collection('notificationSettings').doc(userId).update({
          enabled: true,
          updatedAt: now,
        });
      }

      log.info('Push subscription saved', { userId });

      return NextResponse.json({
        success: true,
        message: 'Push notifications enabled',
      });
    }

    // Handle settings update
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const settings = parsed.data;
    const now = new Date().toISOString();

    const settingsRef = db.collection('notificationSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (settingsDoc.exists) {
      await settingsRef.update({
        ...settings,
        updatedAt: now,
      });
    } else {
      await settingsRef.set({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...settings,
        createdAt: now,
        updatedAt: now,
      });
    }

    log.info('Notification settings updated', { userId });

    return NextResponse.json({
      success: true,
      settings: { ...settingsDoc.data(), ...settings },
    });
  } catch (error) {
    log.error('Notifications error', {}, error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/notifications', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ settings: DEFAULT_NOTIFICATION_SETTINGS });
    }

    const db = getAdminFirestore();

    const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
    const subscriptionDoc = await db.collection('pushSubscriptions').doc(userId).get();

    return NextResponse.json({
      settings: settingsDoc.exists ? settingsDoc.data() : DEFAULT_NOTIFICATION_SETTINGS,
      hasSubscription: subscriptionDoc.exists,
    });
  } catch (error) {
    log.error('Get notifications error', {}, error);
    return NextResponse.json({ settings: DEFAULT_NOTIFICATION_SETTINGS, hasSubscription: false });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/notifications', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Delete subscription
    await db.collection('pushSubscriptions').doc(userId).delete();

    // Disable notifications in settings
    await db.collection('notificationSettings').doc(userId).update({
      enabled: false,
      updatedAt: new Date().toISOString(),
    });

    log.info('Push subscription deleted', { userId });

    return NextResponse.json({
      success: true,
      message: 'Push notifications disabled',
    });
  } catch (error) {
    log.error('Delete notifications error', {}, error);
    return NextResponse.json({ error: 'Failed to disable notifications' }, { status: 500 });
  }
}
