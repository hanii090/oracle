import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Weekly Summary Cron Job
 * Runs every Sunday at 9am to generate and deliver weekly summaries
 * 
 * Vercel Cron: 0 9 * * 0
 */

export const runtime = 'nodejs';
export const maxDuration = 300;

const SUMMARY_SYSTEM_PROMPT = `
You are generating a weekly reflection summary for therapy support. Based on the user's Sorca sessions this week, create a brief, warm summary.

Format your response as JSON with these fields:
{
  "themes": ["theme1", "theme2", "theme3"],
  "moodTrend": "improving" | "stable" | "declining" | "fluctuating",
  "keyInsight": "One sentence capturing the week's most significant realization",
  "openQuestions": ["question1", "question2"],
  "suggestedFocus": "A brief suggestion for what might be worth discussing in therapy",
  "therapistNotes": "Brief clinical observations for the therapist (more technical)"
}

Keep language accessible, not clinical. Be honest but compassionate.
`;

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/cron/weekly-summary', correlationId: crypto.randomUUID() });

  // Verify cron secret
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
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  const db = getAdminFirestore();
  const ai = new GoogleGenAI({ apiKey });
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekId = new Date().toISOString().split('T')[0];

  let processed = 0;
  let errors = 0;

  try {
    // Get users with paid tiers who would have week summaries
    const usersSnapshot = await db.collection('users')
      .where('tier', 'in', ['philosopher', 'pro', 'practice'])
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // Check if user has sessions this week
        const sessionsSnapshot = await db.collection('users')
          .doc(userId)
          .collection('sessions')
          .where('createdAt', '>=', oneWeekAgo)
          .limit(1)
          .get();

        if (sessionsSnapshot.empty) continue;

        // Get all sessions this week
        const allSessionsSnapshot = await db.collection('users')
          .doc(userId)
          .collection('sessions')
          .where('createdAt', '>=', oneWeekAgo)
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        const sessions = allSessionsSnapshot.docs.map(doc => doc.data());

        // Get homework check-ins
        const homeworkSnapshot = await db.collection('homeworkAssignments')
          .where('patientId', '==', userId)
          .get();

        const homeworkResponses = homeworkSnapshot.docs
          .flatMap(doc => {
            const data = doc.data();
            return (data.checkIns || [])
              .filter((c: { timestamp: string }) => c.timestamp >= oneWeekAgo)
              .map((c: { response: string }) => c.response);
          });

        // Get session debriefs
        const debriefsSnapshot = await db.collection('sessionDebriefs')
          .doc(userId)
          .collection('debriefs')
          .where('createdAt', '>=', oneWeekAgo)
          .get();

        const debriefInsights = debriefsSnapshot.docs.map(doc => doc.data().keyInsight).filter(Boolean);

        // Build context
        const sessionMessages = sessions
          .flatMap(s => s.messages || [])
          .slice(0, 50)
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join('\n');

        const context = `
SORCA SESSIONS THIS WEEK:
${sessionMessages}

HOMEWORK CHECK-IN RESPONSES:
${homeworkResponses.join('\n') || 'None'}

THERAPY SESSION DEBRIEFS:
${debriefInsights.join('\n') || 'None'}
`;

        // Generate summary
        const result = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: context,
          config: {
            systemInstruction: SUMMARY_SYSTEM_PROMPT,
            temperature: 0.6,
            maxOutputTokens: 500,
          },
        });

        let summary;
        try {
          const text = result.text || '{}';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          summary = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
          summary = {
            themes: ['reflection'],
            moodTrend: 'stable',
            keyInsight: 'A week of continued self-exploration.',
            openQuestions: [],
            suggestedFocus: 'Continue reflecting.',
            therapistNotes: '',
          };
        }

        // Save summary
        const summaryDoc = {
          id: weekId,
          ...summary,
          sessionCount: sessions.length,
          homeworkCheckIns: homeworkResponses.length,
          debriefCount: debriefInsights.length,
          generatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        await db.collection('weekSummaries')
          .doc(userId)
          .collection('weeks')
          .doc(weekId)
          .set(summaryDoc);

        // Send push notification to user
        const pushSubSnapshot = await db.collection('pushSubscriptions')
          .where('userId', '==', userId)
          .limit(1)
          .get();

        if (!pushSubSnapshot.empty) {
          // Queue notification (would integrate with web-push here)
          await db.collection('notificationQueue').add({
            userId,
            type: 'weekly_summary',
            title: 'Your Weekly Summary is Ready',
            body: `${summary.keyInsight || 'See what themes emerged this week.'}`,
            url: `/summary/${weekId}`,
            createdAt: new Date().toISOString(),
          });
        }

        // Notify therapists with consent
        const consentsSnapshot = await db.collection('therapistConsent')
          .where('patientId', '==', userId)
          .where('status', '==', 'active')
          .get();

        for (const consentDoc of consentsSnapshot.docs) {
          const consent = consentDoc.data();
          if (consent.permissions?.shareWeekSummary) {
            await db.collection('notificationQueue').add({
              userId: consent.therapistId,
              type: 'client_weekly_summary',
              title: `Weekly Summary: ${userDoc.data()?.displayName || 'Client'}`,
              body: `Mood: ${summary.moodTrend}. Themes: ${summary.themes?.slice(0, 2).join(', ')}`,
              url: `/dashboard`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        processed++;
        log.info('Weekly summary generated', { userId, weekId });
      } catch (userError) {
        errors++;
        log.error('Failed to generate summary for user', { userId }, userError);
      }
    }

    log.info('Weekly summary cron completed', { processed, errors });

    return NextResponse.json({
      success: true,
      processed,
      errors,
      weekId,
    });
  } catch (error) {
    log.error('Weekly summary cron error', {}, error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
