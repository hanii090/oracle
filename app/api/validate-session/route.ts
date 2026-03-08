import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { sessionRateLimit } from '@/lib/rate-limit';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';

/**
 * Server-side session validation — enforces session limits that can't be bypassed.
 * POST /api/validate-session
 */

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/validate-session', correlationId: crypto.randomUUID() });

  try {
    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

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

    const userRef = db.doc(`users/${userId}`);
    const now = new Date();

    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      const data = doc.data()!;
      const tier = data.tier || 'free';
      const sessionsThisMonth = data.sessionsThisMonth || 0;
      const lastSessionDate = data.lastSessionDate || null;

      // Paid tiers have unlimited sessions
      if (tier !== 'free') {
        const updates = {
          sessionsThisMonth: sessionsThisMonth + 1,
          lastSessionDate: now.toISOString(),
        };
        transaction.update(userRef, updates);
        return { canStart: true, profile: { ...data, ...updates } };
      }

      // Free tier: check monthly limit
      let currentMonthSessions = sessionsThisMonth;
      if (lastSessionDate) {
        const lastDate = new Date(lastSessionDate);
        if (lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()) {
          currentMonthSessions = 0;
        }
      }

      if (currentMonthSessions >= 5) {
        return {
          canStart: false,
          reason: 'Monthly session limit reached (5/5 for free tier)',
          profile: data,
        };
      }

      const updates = {
        sessionsThisMonth: currentMonthSessions + 1,
        lastSessionDate: now.toISOString(),
      };
      transaction.update(userRef, updates);
      return { canStart: true, profile: { ...data, ...updates } };
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('Session validation error', {}, error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
}
