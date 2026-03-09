import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';

/**
 * POST /api/voice-session — Save voice session data (transcript, duration, mood).
 * Called when a voice session ends to persist transcript and update usage.
 */
export async function POST(req: Request) {
  const log = createLogger({ route: '/api/voice-session', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await req.json();
    const {
      sessionId,
      transcript,
      durationMs,
      therapyMode,
      moodBefore,
      moodAfter,
      startedAt,
    } = body;

    if (!sessionId || !transcript || !durationMs) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const durationMinutes = Math.ceil(durationMs / 60000);

    // ── Save voice session ─────────────────────────────────────
    await db.collection('voiceSessions').doc(sessionId).set({
      userId,
      sessionId,
      transcript,
      durationMs,
      durationMinutes,
      therapyMode: therapyMode || 'socratic',
      moodBefore: moodBefore ?? null,
      moodAfter: moodAfter ?? null,
      startedAt: startedAt || Date.now(),
      endedAt: Date.now(),
      createdAt: new Date().toISOString(),
      messageCount: transcript.length,
      // Extract key themes for therapist review
      hasRiskContent: transcript.some((t: { content: string }) => 
        /\b(suicide|self[- ]?harm|kill|die|end it|hopeless)\b/i.test(t.content)
      ),
    });

    // ── Update monthly voice usage ─────────────────────────────
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = db.collection('voiceUsage').doc(`${userId}_${monthKey}`);
    const usageDoc = await usageRef.get();

    if (usageDoc.exists) {
      const current = usageDoc.data()?.minutesUsed || 0;
      await usageRef.update({
        minutesUsed: current + durationMinutes,
        lastSessionAt: new Date().toISOString(),
        sessionCount: (usageDoc.data()?.sessionCount || 0) + 1,
      });
    } else {
      await usageRef.set({
        userId,
        month: monthKey,
        minutesUsed: durationMinutes,
        lastSessionAt: new Date().toISOString(),
        sessionCount: 1,
      });
    }

    // ── Also save as a regular session for unified dashboard ───
    await db.collection('sessions').doc(sessionId).set({
      userId,
      type: 'voice',
      sessionId,
      messageCount: transcript.length,
      durationMs,
      therapyMode: therapyMode || 'socratic',
      moodBefore: moodBefore ?? null,
      moodAfter: moodAfter ?? null,
      createdAt: new Date().toISOString(),
      preview: transcript[0]?.content?.slice(0, 100) || 'Voice session',
    });

    log.info('Voice session saved', {
      userId,
      sessionId,
      durationMinutes,
      messageCount: transcript.length,
    });

    return NextResponse.json({ 
      success: true,
      minutesUsed: (usageDoc.exists ? (usageDoc.data()?.minutesUsed || 0) : 0) + durationMinutes,
    });

  } catch (err: unknown) {
    log.error('Voice session save error', {}, err);
    return NextResponse.json({ error: 'Failed to save voice session.' }, { status: 500 });
  }
}

/**
 * GET /api/voice-session — Fetch voice sessions for current user.
 * Query params: ?limit=10&offset=0
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/voice-session', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '10');
    const offsetParam = parseInt(url.searchParams.get('offset') || '0');

    const db = getAdminFirestore();

    // Query voice sessions — the compound query (userId + orderBy endedAt)
    // requires a Firestore composite index. If it doesn't exist yet, fall
    // back to a simpler query so the UI still works while the index builds.
    let sessions: Record<string, unknown>[] = [];
    let total = 0;

    try {
      const snapshot = await db.collection('voiceSessions')
        .where('userId', '==', userId)
        .orderBy('endedAt', 'desc')
        .limit(limitParam)
        .offset(offsetParam)
        .get();

      sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Don't send full transcripts in list view
        transcript: doc.data().transcript?.map((t: any) => ({
          role: t.role,
          content: t.content.slice(0, 150) + (t.content.length > 150 ? '...' : ''),
          timestamp: t.timestamp,
        })),
      }));
      total = snapshot.size;
    } catch (queryErr: unknown) {
      // Missing composite index — fall back to unordered query
      log.warn('voiceSessions query failed (likely missing index), falling back', {}, queryErr);
      try {
        const fallback = await db.collection('voiceSessions')
          .where('userId', '==', userId)
          .limit(limitParam)
          .get();

        sessions = fallback.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          transcript: doc.data().transcript?.map((t: any) => ({
            role: t.role,
            content: t.content.slice(0, 150) + (t.content.length > 150 ? '...' : ''),
            timestamp: t.timestamp,
          })),
        }));
        total = fallback.size;
      } catch {
        // Even the fallback failed — return empty
        log.error('voiceSessions fallback query also failed', {});
      }
    }

    // Get monthly usage
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageDoc = await db.collection('voiceUsage').doc(`${userId}_${monthKey}`).get();
    const usage = usageDoc.exists ? usageDoc.data() : { minutesUsed: 0, sessionCount: 0 };

    return NextResponse.json({
      sessions,
      usage,
      total,
    });

  } catch (err: unknown) {
    log.error('Voice session fetch error', {}, err);
    return NextResponse.json({ error: 'Failed to fetch voice sessions.' }, { status: 500 });
  }
}
