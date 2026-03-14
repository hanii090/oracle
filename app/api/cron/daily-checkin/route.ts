import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isAdminConfigured, getAdminError } from '@/lib/firebase-admin';
import { getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';

/**
 * GET /api/cron/daily-checkin — Sends daily check-in push notifications.
 * 
 * Scheduled via Vercel Cron at 9:00 AM UTC daily.
 * 
 * For each user with push notifications enabled:
 * 1. Check if they've already checked in today
 * 2. Send a personalized push notification
 * 3. Log the notification for analytics
 * 
 * Security: Protected by CRON_SECRET header (Vercel adds this automatically).
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/cron/daily-checkin', correlationId: crypto.randomUUID() });

  try {
    // ── Verify cron secret ─────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    let isAuthorized = false;
    if (cronSecret && authHeader) {
      const expectedAuth = `Bearer ${cronSecret}`;
      const authBuffer = Buffer.from(authHeader);
      const expectedBuffer = Buffer.from(expectedAuth);
      if (authBuffer.byteLength === expectedBuffer.byteLength) {
        isAuthorized = crypto.timingSafeEqual(authBuffer, expectedBuffer);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminConfigured()) {
      log.error('Firebase Admin not configured', { error: getAdminError() });
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const today = new Date().toISOString().split('T')[0];

    // ── Get all users with push subscriptions ──────────────────
    const subscriptionsSnap = await db.collection('pushSubscriptions').get();

    if (subscriptionsSnap.empty) {
      log.info('No push subscriptions found');
      return NextResponse.json({ sent: 0, message: 'No subscribers' });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:hello@sorca.life';

    if (!vapidPublicKey || !vapidPrivateKey) {
      log.warn('VAPID keys not configured — skipping push notifications');
      return NextResponse.json({ sent: 0, message: 'VAPID not configured' });
    }

    // ── Personalized check-in messages ─────────────────────────
    const checkInMessages = [
      { title: '🌅 Good morning', body: 'How are you feeling today? A quick check-in takes just a moment.' },
      { title: '✦ Sorca Check-In', body: 'Take a breath. How\'s your inner weather today?' },
      { title: '🌿 Daily Reflection', body: 'A moment of awareness can change your whole day. How are you?' },
      { title: '💭 Check In With Yourself', body: 'No judgement, just curiosity — how are you feeling right now?' },
      { title: '🌤️ Morning Check-In', body: 'Your wellbeing matters. Take 30 seconds to notice how you feel.' },
      { title: '🔔 Time to Check In', body: 'Small moments of self-awareness add up. How\'s today going?' },
      { title: '✨ Daily Moment', body: 'Pause. Breathe. What\'s your mood right now? Tap to log it.' },
    ];

    let sentCount = 0;
    let failedCount = 0;

    // Process each subscription
    for (const subDoc of subscriptionsSnap.docs) {
      try {
        const subData = subDoc.data();
        const userId = subData.userId;
        
        if (!userId || !subData.subscription) continue;

        // Check notification settings
        const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
        const settings = settingsDoc.data();
        
        if (settings && (!settings.enabled || settings.sessionPrompts === false)) {
          continue; // User disabled notifications
        }

        // Check if already checked in today
        const checkinSnap = await db.collection('moodCheckins')
          .where('userId', '==', userId)
          .where('date', '==', today)
          .limit(1)
          .get();

        if (!checkinSnap.empty) {
          continue; // Already checked in today
        }

        // Pick a random message
        const message = checkInMessages[Math.floor(Math.random() * checkInMessages.length)];

        // Build push payload
        const payload = JSON.stringify({
          title: message.title,
          body: message.body,
          icon: '/icon-192.png',
          badge: '/icon-72.png',
          tag: 'daily-checkin',
          data: {
            type: 'daily_checkin',
            url: '/user-dashboard?tab=mood',
            timestamp: Date.now(),
          },
          actions: [
            { action: 'checkin', title: '✦ Check In Now' },
            { action: 'voice', title: '🎙️ Voice Check-In' },
          ],
        });

        // Send push notification using Web Push protocol
        // Using fetch to the push endpoint directly (no webpush library dependency)
        const subscription = subData.subscription;
        
        try {
          const pushRes = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: payload,
          });

          if (pushRes.ok || pushRes.status === 201) {
            sentCount++;
          } else if (pushRes.status === 410) {
            // Subscription expired — clean up
            await subDoc.ref.delete();
            log.info('Removed expired subscription', { userId });
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }

        // Log the notification
        await db.collection('notificationLog').add({
          userId,
          type: 'daily_checkin',
          title: message.title,
          sentAt: new Date().toISOString(),
          date: today,
        });

      } catch (err) {
        failedCount++;
        log.error('Failed to process subscription', { docId: subDoc.id }, err);
      }
    }

    log.info('Daily check-in notifications sent', { sentCount, failedCount });

    return NextResponse.json({
      sent: sentCount,
      failed: failedCount,
      date: today,
    });

  } catch (err: unknown) {
    log.error('Daily check-in cron error', {}, err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
