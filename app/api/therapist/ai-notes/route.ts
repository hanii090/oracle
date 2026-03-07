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

    // Gather client data for the draft
    const context: string[] = [];

    // Recent sessions
    const sessionsSnap = await db.collection('sessions')
      .where('userId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

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

    // Recent mood check-ins
    const moodSnap = await db.collection('dailyMoodChecks')
      .doc(clientId)
      .collection('checks')
      .orderBy('timestamp', 'desc')
      .limit(7)
      .get();

    if (!moodSnap.empty) {
      const scores = moodSnap.docs.map(d => d.data().score);
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      context.push(`\nMood check-ins (last 7 days): scores ${scores.join(', ')}, average ${avg.toFixed(1)}/10`);
    }

    // Recent outcome measures
    const outcomesSnap = await db.collection('outcomeMeasures')
      .where('userId', '==', clientId)
      .orderBy('timestamp', 'desc')
      .limit(4)
      .get();

    if (!outcomesSnap.empty) {
      for (const doc of outcomesSnap.docs) {
        const m = doc.data();
        context.push(`${m.type} score: ${m.total} (${m.severity}) on ${m.timestamp}`);
      }
    }

    // Recent pattern alerts
    const alertsSnap = await db.collection('patternAlerts')
      .where('therapistId', '==', therapistId)
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (!alertsSnap.empty) {
      context.push('\nRecent alerts:');
      for (const doc of alertsSnap.docs) {
        const a = doc.data();
        context.push(`- [${a.severity}] ${a.message} (${a.createdAt})`);
      }
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
    return NextResponse.json({ error: 'Failed to generate notes draft' }, { status: 500 });
  }
}
