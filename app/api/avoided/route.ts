import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Avoided Question Archive — Feature 05
 * POST /api/avoided
 *
 * Analyses recent sessions to detect deflected, skimmed, or too-quickly-answered
 * questions. Archives them and surfaces one avoided question per week:
 * "You've been circling this for 11 days."
 */

const DEFLECTION_PROMPT = `You are a deflection detector for Sorca, a Socratic AI questioning tool.

Analyse this conversation between a user and Sorca. For each question Sorca asked, determine whether the user:
1. **Answered honestly** — engaged deeply, showed vulnerability, gave a real response
2. **Deflected** — changed the subject, gave a surface answer, used humour to avoid, answered too quickly with a dismissive response, or gave a non-answer

For deflected questions, explain HOW they deflected (humour, topic change, vagueness, intellectualising, etc.)

Return JSON:
{
  "deflectedQuestions": [
    {
      "question": "the exact question that was deflected",
      "userResponse": "what the user said in response",
      "deflectionType": "humour|topic_change|vagueness|intellectualising|dismissal|too_quick",
      "confidence": 0.0-1.0,
      "significance": "why this question might matter to the user"
    }
  ],
  "totalQuestions": number,
  "totalDeflected": number,
  "honestDepthReached": number
}

Only include questions with deflection confidence > 0.6.

Conversation:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/avoided', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Avoided question analysis requested', { userId });

    const body = await req.json();
    const { sessionMessages } = body;

    if (!sessionMessages || sessionMessages.length < 4) {
      return NextResponse.json({
        deflectedQuestions: [],
        message: 'Session too short to analyse.',
      });
    }

    // Build conversation text
    const conversationText = sessionMessages
      .map((m: { role: string; content: string; depth?: number }) =>
        `[${m.role}${m.depth ? ` depth:${m.depth}` : ''}]: ${m.content}`
      )
      .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: DEFLECTION_PROMPT + conversationText,
      config: { responseMimeType: 'application/json' },
    });

    let analysis: {
      deflectedQuestions: Array<{
        question: string;
        userResponse: string;
        deflectionType: string;
        confidence: number;
        significance: string;
      }>;
      totalQuestions: number;
      totalDeflected: number;
    } = { deflectedQuestions: [], totalQuestions: 0, totalDeflected: 0 };

    try {
      analysis = JSON.parse(result.text || '{}');
    } catch {
      log.warn('Failed to parse deflection analysis');
    }

    // Store avoided questions in Firestore
    const adminDb = getAdminFirestore();
    if (analysis.deflectedQuestions.length > 0) {
      const avoidedRef = adminDb.collection('users').doc(userId).collection('avoided');
      const now = new Date().toISOString();

      for (const dq of analysis.deflectedQuestions) {
        await avoidedRef.add({
          ...dq,
          detectedAt: now,
          surfaced: false,
          sessionDate: now,
        });
      }

      // Check if we should surface an avoided question this week
      const avoidedSnapshot = await avoidedRef
        .where('surfaced', '==', false)
        .orderBy('detectedAt', 'asc')
        .limit(1)
        .get();

      if (!avoidedSnapshot.empty) {
        const oldest = avoidedSnapshot.docs[0];
        const oldestData = oldest.data();
        const daysSince = Math.floor(
          (Date.now() - new Date(oldestData.detectedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSince >= 3) {
          // Surface it
          await oldest.ref.update({ surfaced: true, surfacedAt: now });

          return NextResponse.json({
            ...analysis,
            weeklyReminder: {
              question: oldestData.question,
              daysSinceAvoided: daysSince,
              message: `You've been circling this for ${daysSince} days.`,
              deflectionType: oldestData.deflectionType,
            },
          });
        }
      }
    }

    log.info('Avoided question analysis complete', {
      userId,
      deflectedCount: analysis.totalDeflected,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    log.error('Avoided question analysis error', {}, error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
