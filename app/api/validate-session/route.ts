import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { sessionRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

/**
 * Server-side session validation — enforces session limits that can't be bypassed.
 * POST /api/validate-session
 */

const requestSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { userId } = parsed.data;

    // Rate limit
    const rl = sessionRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    let db;
    try {
      db = getAdminFirestore();
    } catch (adminError) {
      // Firebase Admin not configured — allow the session and let
      // the client-side profile (from client SDK) govern limits.
      console.warn('Firebase Admin not configured, skipping server validation:', adminError);
      return NextResponse.json({ canStart: true, reason: 'admin-unavailable' });
    }
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      // Create new user profile
      const profile = { tier: 'free', sessionsThisMonth: 0, lastSessionDate: null };
      await db.doc(`users/${userId}`).set(profile);
      return NextResponse.json({ canStart: true, profile });
    }

    const data = userDoc.data()!;
    const tier = data.tier || 'free';
    const sessionsThisMonth = data.sessionsThisMonth || 0;
    const lastSessionDate = data.lastSessionDate || null;

    // Paid tiers have unlimited sessions
    if (tier !== 'free') {
      const newProfile = {
        ...data,
        sessionsThisMonth: sessionsThisMonth + 1,
        lastSessionDate: new Date().toISOString(),
      };
      await db.doc(`users/${userId}`).set(newProfile, { merge: true });
      return NextResponse.json({ canStart: true, profile: newProfile });
    }

    // Free tier: check monthly limit
    const now = new Date();
    let currentMonthSessions = sessionsThisMonth;

    if (lastSessionDate) {
      const lastDate = new Date(lastSessionDate);
      if (lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()) {
        // New month — reset counter
        currentMonthSessions = 0;
      }
    }

    if (currentMonthSessions >= 5) {
      return NextResponse.json({
        canStart: false,
        reason: 'Monthly session limit reached (5/5 for free tier)',
        profile: data,
      });
    }

    // Allow session and increment
    const newProfile = {
      ...data,
      sessionsThisMonth: currentMonthSessions + 1,
      lastSessionDate: now.toISOString(),
    };
    await db.doc(`users/${userId}`).set(newProfile, { merge: true });

    return NextResponse.json({ canStart: true, profile: newProfile });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
}
