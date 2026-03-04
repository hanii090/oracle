import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Silence Score — Feature 10
 * POST /api/silence-score
 *
 * Records and analyses silence patterns from voice sessions.
 * Calculates the ratio of speech to silence, tracking comfort with hard questions over time.
 */

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/silence-score', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const { sessionId, totalSpeechMs, totalSilenceMs, pauses } = await req.json();

    if (!sessionId || totalSpeechMs === undefined || totalSilenceMs === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalMs = totalSpeechMs + totalSilenceMs;
    const silenceRatio = totalMs > 0 ? totalSilenceMs / totalMs : 0;
    const silenceScore = Math.round(silenceRatio * 100);

    // Classify the silence quality
    let quality: 'surface' | 'thinking' | 'deep' | 'profound';
    if (silenceScore < 20) quality = 'surface';
    else if (silenceScore < 40) quality = 'thinking';
    else if (silenceScore < 60) quality = 'deep';
    else quality = 'profound';

    const adminDb = getAdminFirestore();
    const scoresRef = adminDb.collection('users').doc(userId).collection('silenceScores');

    const entry = {
      sessionId,
      silenceScore,
      silenceRatio: Math.round(silenceRatio * 1000) / 1000,
      totalSpeechMs,
      totalSilenceMs,
      quality,
      pauseCount: pauses?.length || 0,
      longestPauseMs: pauses?.length ? Math.max(...pauses.map((p: { durationMs: number }) => p.durationMs)) : 0,
      recordedAt: new Date().toISOString(),
    };

    await scoresRef.add(entry);

    // Calculate trend
    const allScoresSnap = await scoresRef.orderBy('recordedAt', 'desc').limit(20).get();
    const scores = allScoresSnap.docs.map(d => d.data());

    const trend = scores.length >= 3 ? (() => {
      const recent = scores.slice(0, Math.ceil(scores.length / 2));
      const older = scores.slice(Math.ceil(scores.length / 2));
      const recentAvg = recent.reduce((sum, s) => sum + (s.silenceScore as number), 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + (s.silenceScore as number), 0) / older.length;
      if (recentAvg > olderAvg + 5) return 'deepening';
      if (recentAvg < olderAvg - 5) return 'retreating';
      return 'steady';
    })() : 'insufficient_data';

    // Store aggregate in user profile
    const avgScore = scores.reduce((sum, s) => sum + (s.silenceScore as number), 0) / scores.length;
    await adminDb.collection('users').doc(userId).set(
      {
        silenceScore: {
          current: silenceScore,
          average: Math.round(avgScore),
          trend,
          quality,
          sessionsTracked: scores.length,
          lastUpdated: new Date().toISOString(),
        },
      },
      { merge: true }
    );

    log.info('Silence score recorded', { userId, silenceScore, quality, trend });

    return NextResponse.json({
      silenceScore,
      quality,
      trend,
      history: scores.slice(0, 10).map(s => ({
        score: s.silenceScore,
        quality: s.quality,
        date: s.recordedAt,
      })),
    });
  } catch (error) {
    log.error('Silence score error', {}, error);
    return NextResponse.json({ error: 'Silence score recording failed' }, { status: 500 });
  }
}
