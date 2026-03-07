import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';

/**
 * Question DNA — Feature 02
 * POST /api/question-dna
 *
 * Classifies every Sorca question by type and tracks which types
 * the user responds to most honestly over time.
 */

export type QuestionType = 'excavation' | 'confrontation' | 'permission' | 'reframe' | 'projection' | 'silence';

interface QuestionDNAEntry {
  questionText: string;
  type: QuestionType;
  honestyScore: number;
  depth: number;
  sessionId: string;
  timestamp: string;
}

const QUESTION_DNA_PROMPT = `You are a question classification engine for Sorca, a Socratic AI.

Classify each question-response pair by question TYPE and measure the user's HONESTY in their response.

Question Types:
1. **excavation** — Digging deeper into something already said. "What's underneath that?"
2. **confrontation** — Surfacing a contradiction or uncomfortable truth. "You said X, but now you say Y."
3. **permission** — Giving the user permission to feel/think/want something forbidden. "What if that's okay?"
4. **reframe** — Offering a new lens on something familiar. "What if the obstacle IS the path?"
5. **projection** — Asking the user to project into hypotheticals or other perspectives. "What would you tell your younger self?"
6. **silence** — Questions designed to create space, not fill it. Minimal, waiting. "And then what?"

Honesty scoring (0-1):
- 1.0: Raw, vulnerable, specific, uses "I" statements, admits difficulty
- 0.7: Honest but still somewhat guarded, some abstraction
- 0.4: Deflecting — uses humour, generalises, intellectualises
- 0.1: Complete avoidance — changes subject, gives platitudes, shuts down

Analyse these question-response pairs and return a JSON array:
[{ "questionText": "...", "type": "excavation|confrontation|permission|reframe|projection|silence", "honestyScore": 0.0-1.0, "honestyExplanation": "brief reason" }]

Pairs to analyse:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/question-dna', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = z.object({
      sessionMessages: z.array(z.object({ role: z.string(), content: z.string() })),
      sessionId: z.string().min(1).optional(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { sessionMessages, sessionId } = parsed.data;

    if (sessionMessages.length < 2) {
      return NextResponse.json({ classifications: [], profile: null });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    // Build question-response pairs
    const pairs: string[] = [];
    for (let i = 0; i < sessionMessages.length - 1; i++) {
      if (sessionMessages[i].role === 'assistant' && sessionMessages[i + 1]?.role === 'user') {
        pairs.push(`Q: "${sessionMessages[i].content}"\nA: "${sessionMessages[i + 1].content}"`);
      }
    }

    if (pairs.length === 0) {
      return NextResponse.json({ classifications: [], profile: null });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: QUESTION_DNA_PROMPT + pairs.join('\n\n'),
      config: { responseMimeType: 'application/json' },
    });

    let classifications: QuestionDNAEntry[] = [];
    try {
      classifications = JSON.parse(result.text || '[]');
    } catch {
      log.warn('Failed to parse question DNA');
      return NextResponse.json({ classifications: [], profile: null });
    }

    // Store classifications in Firestore
    const adminDb = getAdminFirestore();
    const dnaRef = adminDb.collection('users').doc(userId).collection('questionDNA');
    const now = new Date().toISOString();

    for (const entry of classifications) {
      await dnaRef.add({
        ...entry,
        sessionId: sessionId || 'unknown',
        timestamp: now,
      });
    }

    // Calculate DNA profile — which question types get the most honest responses
    const allDnaSnap = await dnaRef.orderBy('timestamp', 'desc').limit(200).get();
    const typeStats: Record<QuestionType, { totalHonesty: number; count: number }> = {
      excavation: { totalHonesty: 0, count: 0 },
      confrontation: { totalHonesty: 0, count: 0 },
      permission: { totalHonesty: 0, count: 0 },
      reframe: { totalHonesty: 0, count: 0 },
      projection: { totalHonesty: 0, count: 0 },
      silence: { totalHonesty: 0, count: 0 },
    };

    for (const doc of allDnaSnap.docs) {
      const data = doc.data();
      const type = data.type as QuestionType;
      if (typeStats[type]) {
        typeStats[type].totalHonesty += data.honestyScore || 0;
        typeStats[type].count += 1;
      }
    }

    const profile = Object.entries(typeStats).map(([type, stats]) => ({
      type,
      avgHonesty: stats.count > 0 ? Math.round((stats.totalHonesty / stats.count) * 100) / 100 : 0,
      count: stats.count,
    })).sort((a, b) => b.avgHonesty - a.avgHonesty);

    // Store the profile for future session weighting
    await adminDb.collection('users').doc(userId).set(
      { questionDNAProfile: profile, questionDNAUpdated: now },
      { merge: true }
    );

    log.info('Question DNA analysis complete', { userId, classificationCount: classifications.length });

    return NextResponse.json({ classifications, profile });
  } catch (error) {
    log.error('Question DNA error', {}, error);
    return NextResponse.json({ error: 'Question DNA analysis failed' }, { status: 500 });
  }
}
