import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';

/**
 * AI Session Notes Draft — T1
 * POST /api/therapist/ai-notes
 *
 * Generates a one-click draft of session notes from client session data.
 * Supports SOAP, DAP, and GIRP note formats (UK therapy standards).
 */

const requestSchema = z.object({
  clientId: z.string(),
  format: z.enum(['soap', 'dap', 'girp', 'free']).default('soap'),
  sessionDate: z.string().optional(),
});

const NOTE_PROMPTS: Record<string, string> = {
  soap: `Generate clinical session notes in SOAP format:

**S (Subjective):** What the client reported — their words, feelings, concerns.
**O (Objective):** Observable data — mood presentation, behaviour, engagement level, outcome measure scores if available.
**A (Assessment):** Clinical assessment — patterns observed, progress toward goals, risk factors, formulation notes.
**P (Plan):** Next steps — homework assigned, topics for next session, referrals, safety planning if needed.

Keep language clinical but compassionate. Use UK English spelling. Do not fabricate details — only use what is present in the data.`,

  dap: `Generate clinical session notes in DAP format:

**D (Data):** Objective and subjective information from the session — what was discussed, client presentation, scores.
**A (Assessment):** Clinical interpretation — patterns, progress, risk assessment, therapeutic relationship observations.
**P (Plan):** Next steps — interventions planned, homework, referrals, session frequency.

Keep language clinical but compassionate. Use UK English spelling.`,

  girp: `Generate clinical session notes in GIRP format:

**G (Goals):** Session goals and treatment goals addressed.
**I (Interventions):** Therapeutic interventions used — techniques, modalities, exercises.
**R (Response):** Client's response to interventions — engagement, resistance, breakthroughs, emotional reactions.
**P (Plan):** Next steps — homework, topics for next session, adjustments to treatment plan.

Keep language clinical but compassionate. Use UK English spelling.`,

  free: `Generate concise clinical session notes covering:
- Key themes discussed
- Client presentation and mood
- Progress observations
- Risk assessment (if relevant)
- Plan for next session

Keep language clinical but compassionate. Use UK English spelling.`,
};

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/ai-notes', correlationId: crypto.randomUUID() });

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

    const { clientId, format } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist has consent
    const consentSnap = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnap.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    // Gather client data for the draft — each query is independently wrapped
    // so a single missing index doesn't fail the entire route
    const context: string[] = [];

    // Recent sessions
    try {
      let sessionsSnap;
      try {
        sessionsSnap = await db.collection('sessions')
          .where('userId', '==', clientId)
          .orderBy('createdAt', 'desc')
          .limit(3)
          .get();
      } catch {
        sessionsSnap = await db.collection('sessions')
          .where('userId', '==', clientId)
          .limit(3)
          .get();
      }

      if (!sessionsSnap.empty) {
        const latestSession = sessionsSnap.docs[0].data();
        context.push(`Latest session (${latestSession.createdAt}):`);
        if (latestSession.messages) {
          const msgs = latestSession.messages.slice(-10);
          for (const m of msgs) {
            context.push(`[${m.role}]: ${m.content}`);
          }
        }
        context.push(`Max depth reached: ${latestSession.maxDepth}`);
      }
    } catch (e) {
      log.warn('Failed to fetch sessions for AI notes', { clientId }, e);
    }

    // Recent mood check-ins
    try {
      let moodSnap;
      try {
        moodSnap = await db.collection('dailyMoodChecks')
          .doc(clientId)
          .collection('checks')
          .orderBy('timestamp', 'desc')
          .limit(7)
          .get();
      } catch {
        moodSnap = await db.collection('dailyMoodChecks')
          .doc(clientId)
          .collection('checks')
          .limit(7)
          .get();
      }

      if (!moodSnap.empty) {
        const scores = moodSnap.docs.map(d => d.data().score);
        const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        context.push(`\nMood check-ins (last 7 days): scores ${scores.join(', ')}, average ${avg.toFixed(1)}/10`);
      }
    } catch (e) {
      log.warn('Failed to fetch mood check-ins for AI notes', { clientId }, e);
    }

    // Recent outcome measures
    try {
      let outcomesSnap;
      try {
        outcomesSnap = await db.collection('outcomeMeasures')
          .where('userId', '==', clientId)
          .orderBy('timestamp', 'desc')
          .limit(4)
          .get();
      } catch {
        outcomesSnap = await db.collection('outcomeMeasures')
          .where('userId', '==', clientId)
          .limit(4)
          .get();
      }

      if (!outcomesSnap.empty) {
        for (const d of outcomesSnap.docs) {
          const m = d.data();
          context.push(`${m.type} score: ${m.total} (${m.severity}) on ${m.timestamp}`);
        }
      }
    } catch (e) {
      log.warn('Failed to fetch outcome measures for AI notes', { clientId }, e);
    }

    // Recent pattern alerts
    try {
      let alertsSnap;
      try {
        alertsSnap = await db.collection('patternAlerts')
          .where('therapistId', '==', therapistId)
          .where('clientId', '==', clientId)
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
      } catch {
        alertsSnap = await db.collection('patternAlerts')
          .where('therapistId', '==', therapistId)
          .where('clientId', '==', clientId)
          .limit(5)
          .get();
      }

      if (!alertsSnap.empty) {
        context.push('\nRecent alerts:');
        for (const d of alertsSnap.docs) {
          const a = d.data();
          context.push(`- [${a.severity}] ${a.message} (${a.createdAt})`);
        }
      }
    } catch (e) {
      log.warn('Failed to fetch pattern alerts for AI notes', { clientId }, e);
    }

    if (context.length === 0) {
      return NextResponse.json({
        draft: 'No session data available for this client. Please ensure the client has completed at least one session.',
        format,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `${NOTE_PROMPTS[format]}\n\nClient session data:\n${context.join('\n')}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3 },
    });

    const draft = result.text?.trim() || 'Unable to generate draft. Please try again.';

    log.info('AI notes draft generated', { therapistId, clientId, format });

    return NextResponse.json({ draft, format });
  } catch (error) {
    log.error('AI notes draft error', {}, error);

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('PERMISSION_DENIED') || message.includes('not authorized')) {
      return NextResponse.json({ error: 'Access denied. Please check your permissions.' }, { status: 403 });
    }
    if (message.includes('API key') || message.includes('GEMINI')) {
      return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to generate notes draft. Please try again.' }, { status: 500 });
  }
}
