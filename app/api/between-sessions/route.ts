import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';
import { PSYCHOEDUCATION_CONTENT, GROUNDING_EXERCISES } from '@/lib/psychoeducation-content';

// Accept both shapes:
// MoodCheckIn component sends: { score, notes?, activities? }
// DailyCheckin component sends: { type?, mood, note?, activities? }
const moodCheckInSchema = z.union([
  z.object({
    score: z.number().min(1).max(10),
    notes: z.string().max(500).optional(),
    activities: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.string().optional(),
    mood: z.number().min(1).max(10),
    note: z.string().max(500).optional(),
    activities: z.array(z.string()).optional(),
  }),
]);

/** Normalise either shape → { score, notes?, activities? } */
function normaliseMoodData(data: z.infer<typeof moodCheckInSchema>) {
  if ('mood' in data) {
    return {
      score: data.mood,
      notes: data.note,
      activities: data.activities,
    };
  }
  return { score: data.score, notes: data.notes, activities: data.activities };
}

export interface MoodCheckIn {
  id: string;
  userId: string;
  date: string;
  score: number;
  notes?: string;
  activities?: string[];
  timestamp: string;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/between-sessions', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = moodCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { score, notes, activities } = normaliseMoodData(parsed.data);

    if (!isAdminConfigured()) {
      // Graceful fallback — return mock success so the UI doesn't break
      const fallbackCheckIn: MoodCheckIn = {
        id: 'offline',
        userId,
        date: new Date().toISOString().split('T')[0],
        score,
        notes: notes ? sanitizeMessage(notes) : undefined,
        activities,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json({
        checkIn: fallbackCheckIn,
        alert: null,
        suggestedContent: score <= 4 ? PSYCHOEDUCATION_CONTENT.grounding_techniques : null,
        exercises: GROUNDING_EXERCISES,
        offline: true,
      });
    }

    const db = getAdminFirestore();
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    const checkIn: MoodCheckIn = {
      id: crypto.randomUUID(),
      userId,
      date: dateKey,
      score,
      notes: notes ? sanitizeMessage(notes) : undefined,
      activities,
      timestamp: now.toISOString(),
    };

    // Store in subcollection for efficient querying
    await db.collection('dailyMoodChecks').doc(userId).collection('checks').doc(dateKey).set(checkIn);

    // Check for concerning patterns
    let alert = null;
    if (score <= 3) {
      // Get last 3 days of check-ins
      const recentChecks = await db.collection('dailyMoodChecks')
        .doc(userId)
        .collection('checks')
        .orderBy('timestamp', 'desc')
        .limit(3)
        .get();

      const recentScores = recentChecks.docs.map(d => d.data().score);
      const allLow = recentScores.length >= 3 && recentScores.every(s => s <= 3);

      if (allLow) {
        // Create pattern alert for therapist
        const consents = await db.collection('therapistConsent')
          .where('patientId', '==', userId)
          .where('status', '==', 'active')
          .get();

        for (const consent of consents.docs) {
          const consentData = consent.data();
          if (consentData.permissions?.shareMoodData) {
            await db.collection('patternAlerts').add({
              therapistId: consentData.therapistId,
              clientId: userId,
              clientName: 'Client',
              type: 'pattern',
              message: 'Low mood scores for 3+ consecutive days',
              severity: 'medium',
              createdAt: now.toISOString(),
              acknowledged: false,
            });
          }
        }

        alert = {
          type: 'low_mood_pattern',
          message: 'We noticed your mood has been low for a few days. Would you like to try a grounding exercise?',
          suggestedExercise: GROUNDING_EXERCISES[0],
        };
      }
    }

    // Suggest content based on score
    let suggestedContent = null;
    if (score <= 4) {
      suggestedContent = PSYCHOEDUCATION_CONTENT.grounding_techniques;
    } else if (score <= 6) {
      suggestedContent = PSYCHOEDUCATION_CONTENT.cbt_basics;
    }

    log.info('Mood check-in recorded', { userId, score, date: dateKey });

    return NextResponse.json({
      checkIn,
      alert,
      suggestedContent,
      exercises: GROUNDING_EXERCISES,
    });
  } catch (error) {
    log.error('Mood check-in error', {}, error);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/between-sessions', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'mood';
    const days = parseInt(url.searchParams.get('days') || '7');
    const contentId = url.searchParams.get('contentId');

    // Psychoeducation content requires Plus+ tier (philosopher, pro, practice)
    // Grounding exercises remain free for all users
    if (type === 'content') {
      // Check tier for psychoeducation content
      if (!isAdminConfigured()) {
        // If no DB, only return grounding exercises (free feature)
        return NextResponse.json({
          content: [],
          exercises: GROUNDING_EXERCISES,
          tierRequired: true,
        });
      }

      const db = getAdminFirestore();
      const userDoc = await db.doc(`users/${userId}`).get();
      const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';

      // Free tier only gets grounding exercises
      if (tier === 'free') {
        if (contentId) {
          return NextResponse.json(
            { error: 'Psychoeducation library requires Patient Plus or higher subscription', exercises: GROUNDING_EXERCISES },
            { status: 403 }
          );
        }
        return NextResponse.json({
          content: [],
          exercises: GROUNDING_EXERCISES,
          tierRequired: true,
          message: 'Upgrade to Patient Plus to access the full psychoeducation library',
        });
      }

      // Paid tiers get full content
      if (contentId) {
        const content = PSYCHOEDUCATION_CONTENT[contentId as keyof typeof PSYCHOEDUCATION_CONTENT];
        if (!content) {
          return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }
        return NextResponse.json({ content });
      }

      return NextResponse.json({
        content: Object.values(PSYCHOEDUCATION_CONTENT),
        exercises: GROUNDING_EXERCISES,
      });
    }

    // Return mood history
    if (!isAdminConfigured()) {
      return NextResponse.json({ checkIns: [], trend: null });
    }

    const db = getAdminFirestore();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await db.collection('dailyMoodChecks')
      .doc(userId)
      .collection('checks')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'desc')
      .get();

    const checkIns = snapshot.docs.map(doc => doc.data());

    // Calculate trend
    let trend = null;
    if (checkIns.length >= 3) {
      const scores = checkIns.map(c => c.score);
      const firstHalf = scores.slice(Math.floor(scores.length / 2));
      const secondHalf = scores.slice(0, Math.floor(scores.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const diff = secondAvg - firstAvg;
      trend = {
        direction: diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable',
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        checkInCount: checkIns.length,
      };
    }

    return NextResponse.json({ checkIns, trend });
  } catch (error) {
    log.error('Between-sessions fetch error', {}, error);
    return NextResponse.json({ checkIns: [], trend: null });
  }
}
