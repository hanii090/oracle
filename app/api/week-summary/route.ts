import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const SUMMARY_SYSTEM_PROMPT = `
You are generating a weekly reflection summary for therapy support. Based on the user's Sorca sessions this week, create a brief, warm summary.

Format your response as JSON with these fields:
{
  "themes": ["theme1", "theme2", "theme3"], // 2-4 key themes
  "moodTrend": "improving" | "stable" | "declining" | "fluctuating",
  "keyInsight": "One sentence capturing the week's most significant realization",
  "openQuestions": ["question1", "question2"], // 1-2 unresolved questions worth exploring
  "suggestedFocus": "A brief suggestion for what might be worth discussing in therapy"
}

Keep language accessible, not clinical. Be honest but compassionate.
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/week-summary', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Tier gating: Week summaries is a Plus+ feature (philosopher, pro, practice)
    const userDoc = await db.doc(`users/${userId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Week summaries require Patient Plus or higher subscription' },
        { status: 403 }
      );
    }

    // Get this week's sessions
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sessionsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .where('createdAt', '>=', oneWeekAgo)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (sessionsSnapshot.empty) {
      return NextResponse.json({ 
        error: 'No sessions this week to summarize',
        summary: null 
      });
    }

    const sessions = sessionsSnapshot.docs.map(doc => doc.data());

    // Get homework check-ins this week
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

    // Get session debriefs this week
    const debriefsSnapshot = await db.collection('sessionDebriefs')
      .doc(userId)
      .collection('debriefs')
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    
    const debriefInsights = debriefsSnapshot.docs.map(doc => doc.data().keyInsight).filter(Boolean);

    // Build context for AI
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

    // Generate summary with AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
        themes: ['reflection', 'self-awareness'],
        moodTrend: 'stable',
        keyInsight: 'A week of continued self-exploration.',
        openQuestions: [],
        suggestedFocus: 'Continue the current path of reflection.',
      };
    }

    // Save summary
    const weekId = new Date().toISOString().split('T')[0];
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

    log.info('Week summary generated', { userId, weekId });

    return NextResponse.json({ summary: summaryDoc });
  } catch (error) {
    log.error('Week summary generation error', {}, error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/week-summary', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const weekId = url.searchParams.get('weekId');
    const asTherapist = url.searchParams.get('asTherapist') === 'true';
    const clientId = url.searchParams.get('clientId');

    if (!isAdminConfigured()) {
      return NextResponse.json({ summaries: [] });
    }

    const db = getAdminFirestore();

    // Tier gating for patient requests (therapist requests have their own consent checks)
    if (!asTherapist) {
      const userDoc = await db.doc(`users/${userId}`).get();
      const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
      
      if (tier === 'free') {
        return NextResponse.json(
          { error: 'Week summaries require Patient Plus or higher subscription', summaries: [] },
          { status: 403 }
        );
      }
    }

    // If therapist requesting client data
    if (asTherapist && clientId) {
      // Verify consent
      const consentSnapshot = await db.collection('therapistConsent')
        .where('therapistId', '==', userId)
        .where('patientId', '==', clientId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (consentSnapshot.empty) {
        return NextResponse.json({ error: 'No consent' }, { status: 403 });
      }

      const consent = consentSnapshot.docs[0].data();
      if (!consent.permissions?.shareWeekSummary) {
        return NextResponse.json({ error: 'Summary not consented' }, { status: 403 });
      }

      const snapshot = await db.collection('weekSummaries')
        .doc(clientId)
        .collection('weeks')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      return NextResponse.json({ summaries: snapshot.docs.map(d => d.data()) });
    }

    // User requesting their own summaries
    if (weekId) {
      const doc = await db.collection('weekSummaries')
        .doc(userId)
        .collection('weeks')
        .doc(weekId)
        .get();

      if (!doc.exists) {
        return NextResponse.json({ summary: null });
      }

      return NextResponse.json({ summary: doc.data() });
    }

    const snapshot = await db.collection('weekSummaries')
      .doc(userId)
      .collection('weeks')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return NextResponse.json({ summaries: snapshot.docs.map(d => d.data()) });
  } catch (error) {
    log.error('Get week summaries error', {}, error);
    return NextResponse.json({ summaries: [] });
  }
}
