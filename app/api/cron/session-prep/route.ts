import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Session Prep Automation Cron Job
 * Runs every 15 minutes to auto-generate session prep briefs
 * for sessions starting in the next 15-30 minutes
 * 
 * Vercel Cron schedule: every 15 minutes
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const PREP_BRIEF_PROMPT = `
Based on this client's week data, create a brief session prep for their therapist.

Week Summary Themes: {themes}
Mood Trend: {moodTrend}
Homework Completion: {homeworkStatus}
Recent Sorca Session Count: {sessionCount}
Pattern Alerts This Week: {alerts}
Open Questions: {openQuestions}

Create a concise therapist prep brief with:
1. Suggested opening line (warm, specific to their week)
2. Key themes to explore (2-3 bullet points)
3. Homework follow-up question if applicable
4. Any concerns or positive notes
5. Unresolved questions worth exploring

Keep it under 200 words. Professional but warm tone.
`;

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/cron/session-prep', correlationId: crypto.randomUUID() });

  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
  const now = new Date();
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let processed = 0;
  let errors = 0;

  try {
    // Find therapy profiles with sessions in the next 15-30 minutes
    const profilesSnapshot = await db.collection('therapyProfiles')
      .where('nextSessionDate', '>=', in15Min.toISOString())
      .where('nextSessionDate', '<=', in30Min.toISOString())
      .get();

    for (const profileDoc of profilesSnapshot.docs) {
      const clientId = profileDoc.id;
      const profile = profileDoc.data();

      try {
        // Get active consent for this client
        const consentSnapshot = await db.collection('therapistConsent')
          .where('patientId', '==', clientId)
          .where('status', '==', 'active')
          .get();

        if (consentSnapshot.empty) continue;

        for (const consentDoc of consentSnapshot.docs) {
          const consent = consentDoc.data();
          const therapistId = consent.therapistId;

          // Check if prep already generated today
          const existingPrepSnapshot = await db.collection('sessionPreps')
            .where('clientId', '==', clientId)
            .where('therapistId', '==', therapistId)
            .where('sessionDate', '==', profile.nextSessionDate)
            .limit(1)
            .get();

          if (!existingPrepSnapshot.empty) continue;

          // Gather client data
          let weekSummary = null;
          if (consent.permissions?.shareWeekSummary) {
            const summarySnapshot = await db.collection('weekSummaries')
              .doc(clientId)
              .collection('weeks')
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();
            if (!summarySnapshot.empty) {
              weekSummary = summarySnapshot.docs[0].data();
            }
          }

          // Get homework status
          let homeworkStatus = 'Not shared';
          if (consent.permissions?.shareHomeworkProgress) {
            const homeworkSnapshot = await db.collection('homeworkAssignments')
              .where('patientId', '==', clientId)
              .where('therapistId', '==', therapistId)
              .where('status', '==', 'active')
              .limit(5)
              .get();

            if (homeworkSnapshot.empty) {
              homeworkStatus = 'No active homework';
            } else {
              const assignments = homeworkSnapshot.docs.map(doc => doc.data());
              const totalDays = assignments.reduce((sum, a) => sum + (a.durationDays || 7), 0);
              const completedDays = assignments.reduce((sum, a) => sum + (a.completedDays || 0), 0);
              const rate = Math.round((completedDays / totalDays) * 100);
              homeworkStatus = `${rate}% completion (${assignments.length} active)`;
            }
          }

          // Get session count
          let sessionCount = 0;
          const sessionsSnapshot = await db.collection('users')
            .doc(clientId)
            .collection('sessions')
            .where('createdAt', '>=', oneWeekAgo)
            .count()
            .get();
          sessionCount = sessionsSnapshot.data().count;

          // Get alerts
          let alertCount = 0;
          if (consent.permissions?.sharePatternAlerts) {
            const alertsSnapshot = await db.collection('patternAlerts')
              .where('clientId', '==', clientId)
              .where('therapistId', '==', therapistId)
              .where('createdAt', '>=', oneWeekAgo)
              .count()
              .get();
            alertCount = alertsSnapshot.data().count;
          }

          // Generate prep brief
          const prompt = PREP_BRIEF_PROMPT
            .replace('{themes}', weekSummary?.themes?.join(', ') || 'Not available')
            .replace('{moodTrend}', weekSummary?.moodTrend || 'Unknown')
            .replace('{homeworkStatus}', homeworkStatus)
            .replace('{sessionCount}', String(sessionCount))
            .replace('{alerts}', String(alertCount))
            .replace('{openQuestions}', weekSummary?.openQuestions?.join('; ') || 'None');

          const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
              temperature: 0.7,
              maxOutputTokens: 400,
            },
          });

          const prepBrief = result.text || 'Unable to generate prep brief.';

          // Get client name
          const clientDoc = await db.collection('users').doc(clientId).get();
          const clientName = clientDoc.exists ? clientDoc.data()?.displayName || 'Client' : 'Client';

          // Save prep
          const prepId = crypto.randomUUID();
          await db.collection('sessionPreps').doc(prepId).set({
            id: prepId,
            clientId,
            therapistId,
            clientName,
            sessionDate: profile.nextSessionDate,
            prepBrief,
            data: {
              sessionCount,
              alertCount,
              homeworkStatus,
              moodTrend: weekSummary?.moodTrend,
              themes: weekSummary?.themes,
              openQuestions: weekSummary?.openQuestions,
            },
            createdAt: now.toISOString(),
          });

          // Send push notification to therapist
          await db.collection('notificationQueue').add({
            userId: therapistId,
            type: 'session_prep_ready',
            title: `Session Prep: ${clientName}`,
            body: `Your session starts in ~15 minutes. Prep brief is ready.`,
            url: '/dashboard',
            createdAt: now.toISOString(),
          });

          processed++;
          log.info('Session prep generated', { clientId, therapistId });
        }
      } catch (clientError) {
        errors++;
        log.error('Failed to generate prep for client', { clientId }, clientError);
      }
    }

    log.info('Session prep cron completed', { processed, errors });

    return NextResponse.json({
      success: true,
      processed,
      errors,
    });
  } catch (error) {
    log.error('Session prep cron error', {}, error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
