import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Pattern Engine API — Feature 01
 * POST /api/patterns
 *
 * Analyses the user's full thread history to identify recurring patterns:
 * emotional avoidance, belief structures, contradictions, and behavioural loops.
 * Returns a "Pattern of the Week" and stores all detected patterns.
 */

interface Pattern {
  id: string;
  type: 'avoidance' | 'contradiction' | 'recurring_belief' | 'behavioural_loop' | 'emotional_trigger';
  summary: string;
  evidence: string[];
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  confronted: boolean;
}

const PATTERN_PROMPT = `You are a pattern analysis engine for Sorca, a Socratic AI questioning tool.

Analyse the following conversation thread from a user's sessions. Identify recurring patterns across ALL their conversations — not just surface topics, but structural patterns in how they think, avoid, deflect, and contradict themselves.

Categories of patterns to detect:
1. **Avoidance** — Topics they consistently steer away from, questions they deflect
2. **Contradiction** — Beliefs they hold that directly conflict with each other across sessions
3. **Recurring Belief** — Core beliefs that appear repeatedly, especially ones they haven't examined
4. **Behavioural Loop** — Repeated cycles of behaviour described across sessions (e.g., "I always start strong then quit")
5. **Emotional Trigger** — Specific topics or question types that consistently provoke strong emotional responses

For each pattern, provide:
- type: one of the 5 categories above
- summary: one devastating sentence that would make the user stop (e.g., "You always go quiet when the topic turns to ambition.")
- evidence: 2-3 direct quotes from their thread that demonstrate this pattern
- significance: why this pattern matters for their self-understanding

Return JSON array of patterns. Maximum 5 patterns, ranked by significance.
Also include a "patternOfTheWeek" field — the single most important pattern to surface this week, as one sentence.

Thread data:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/patterns', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Pattern analysis requested', { userId });

    // Load the user's full thread from Firestore
    const adminDb = getAdminFirestore();

    const threadDoc = await adminDb.collection('threads').doc(userId).get();
    if (!threadDoc.exists) {
      return NextResponse.json({
        patterns: [],
        patternOfTheWeek: null,
        message: 'Not enough data yet. Keep having sessions.',
      });
    }

    const threadData = threadDoc.data();
    const messages = threadData?.messages || [];

    if (messages.length < 10) {
      return NextResponse.json({
        patterns: [],
        patternOfTheWeek: null,
        message: 'Sorca needs at least 5 sessions to detect patterns. Keep going.',
      });
    }

    // Build thread text for analysis
    const threadText = messages
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
      contents: PATTERN_PROMPT + threadText,
      config: { responseMimeType: 'application/json' },
    });

    let analysisData: { patterns: Pattern[]; patternOfTheWeek: string } = {
      patterns: [],
      patternOfTheWeek: '',
    };

    try {
      analysisData = JSON.parse(result.text || '{}');
    } catch {
      log.warn('Failed to parse pattern analysis');
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }

    // Store patterns in Firestore
    const patternsRef = adminDb.collection('users').doc(userId).collection('patterns');
    const now = new Date().toISOString();

    for (const pattern of analysisData.patterns || []) {
      const patternDoc = {
        ...pattern,
        id: crypto.randomUUID(),
        firstSeen: now,
        lastSeen: now,
        occurrences: 1,
        confronted: false,
        detectedAt: now,
      };
      await patternsRef.add(patternDoc);
    }

    // Store Pattern of the Week
    if (analysisData.patternOfTheWeek) {
      await adminDb.collection('users').doc(userId).set(
        {
          patternOfTheWeek: analysisData.patternOfTheWeek,
          patternOfTheWeekDate: now,
        },
        { merge: true }
      );
    }

    log.info('Pattern analysis complete', {
      userId,
      patternCount: analysisData.patterns?.length || 0,
    });

    return NextResponse.json({
      patterns: analysisData.patterns || [],
      patternOfTheWeek: analysisData.patternOfTheWeek || null,
    });
  } catch (error) {
    log.error('Pattern analysis error', {}, error);
    return NextResponse.json(
      { error: 'Pattern analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
