import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

const requestSchema = z.object({
  clientId: z.string(),
});

const PREP_BRIEF_PROMPT = `
Based on this client's week data, create a brief session prep for their therapist.

Week Summary Themes: {themes}
Mood Trend: {moodTrend}
Homework Completion: {homeworkStatus}
Recent Sorca Session Count: {sessionCount}
Pattern Alerts This Week: {alerts}
Thought Drops This Week: {thoughtDrops}

Create a concise therapist prep brief with:
1. Opening suggestion (one sentence)
2. Key themes to explore (2-3 bullet points)
3. Homework follow-up question if applicable
4. Thought drop highlights if any were shared between sessions
5. Any concerns or positive notes

Keep it under 150 words. Professional but warm tone.
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/session-prep', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist has consent for this client
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No consent found for this client' }, { status: 403 });
    }

    const consent = consentSnapshot.docs[0].data();

    // Gather client data for the prep brief
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get week summary (if consented)
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

    // Get homework status (if consented)
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
        const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        homeworkStatus = `${rate}% completion (${assignments.length} active)`;
      }
    }

    // Get pattern alerts (if consented)
    let alertCount = 0;
    let alertTypes: string[] = [];
    if (consent.permissions?.sharePatternAlerts) {
      const alertsSnapshot = await db.collection('patternAlerts')
        .where('clientId', '==', clientId)
        .where('therapistId', '==', therapistId)
        .where('createdAt', '>=', oneWeekAgo)
        .get();
      
      alertCount = alertsSnapshot.size;
      alertTypes = [...new Set(alertsSnapshot.docs.map(doc => doc.data().type))];
    }

    // Get recent session count
    const sessionsSnapshot = await db.collection('sessions')
      .where('userId', '==', clientId)
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    const sessionCount = sessionsSnapshot.size;

    // Get thought drops from this week (if consented to share reflections)
    let thoughtDrops: Array<{ content: string; createdAt: string }> = [];
    if (consent.permissions?.shareWeekSummary) {
      try {
        const dropsSnapshot = await db.collection('thoughtDrops')
          .where('userId', '==', clientId)
          .where('createdAt', '>=', oneWeekAgo)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
        thoughtDrops = dropsSnapshot.docs.map(d => ({
          content: d.data().content,
          createdAt: d.data().createdAt,
        }));
      } catch {
        // Thought drops collection may not exist yet
      }
    }

    // Generate AI prep brief
    const themes = weekSummary?.themes?.join(', ') || 'No week summary available';
    const moodTrend = weekSummary?.moodTrend || 'Not tracked';

    const apiKey = process.env.GEMINI_API_KEY;
    let prepBrief = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = PREP_BRIEF_PROMPT
          .replace('{themes}', themes)
          .replace('{moodTrend}', moodTrend)
          .replace('{homeworkStatus}', homeworkStatus)
          .replace('{sessionCount}', String(sessionCount))
          .replace('{alerts}', alertCount > 0 ? `${alertCount} (${alertTypes.join(', ')})` : 'None')
          .replace('{thoughtDrops}', thoughtDrops.length > 0 
            ? thoughtDrops.map(d => `"${d.content.slice(0, 100)}"`).join('; ') 
            : 'None this week');

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        prepBrief = response.text || '';
      } catch (e) {
        log.error('AI generation failed', {}, e);
        prepBrief = 'Unable to generate AI brief. Review the data below manually.';
      }
    } else {
      prepBrief = 'AI brief unavailable. Review the data below.';
    }

    // Get client name
    const clientDoc = await db.collection('users').doc(clientId).get();
    const clientName = clientDoc.exists ? clientDoc.data()?.displayName || 'Client' : 'Client';

    // Get next session date
    const therapyProfileDoc = await db.collection('therapyProfiles').doc(clientId).get();
    const nextSession = therapyProfileDoc.exists ? therapyProfileDoc.data()?.nextSessionDate : null;

    log.info('Session prep generated', { therapistId, clientId });

    return NextResponse.json({
      clientId,
      clientName,
      nextSession,
      prepBrief,
      data: {
        weekThemes: weekSummary?.themes || [],
        moodTrend,
        homeworkStatus,
        sessionCount,
        alertCount,
        alertTypes,
        thoughtDrops,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Session prep error', {}, error);
    return NextResponse.json({ error: 'Failed to generate session prep' }, { status: 500 });
  }
}
