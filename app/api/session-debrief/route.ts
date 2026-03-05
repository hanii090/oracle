import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { getServerEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const requestSchema = z.object({
  message: z.string().min(1).max(5000),
  debriefHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20),
  therapySessionDate: z.string().optional(),
});

const DEBRIEF_SYSTEM_PROMPT = `
You are Sorca in Session Debrief Mode. The user has just returned from a therapy session.

Your ONLY job is to help them anchor the single most important insight before it fades.

Rules:
- Ask ONE question per response. Never more.
- Your first question should always be: "What's the one thing you heard today that you don't want to forget?"
- After they answer, go DEEPER into that ONE thing only
- Do NOT wander to new topics
- Do NOT ask about the whole session — focus on the one thing
- Keep questions short and precise
- Maximum 3-4 exchanges total, then close with: "This is worth holding onto. We'll remember it together."

You are not exploring. You are anchoring.
`;

function buildDebriefPrompt(history: string): string {
  return `${DEBRIEF_SYSTEM_PROMPT}

Conversation so far:
${history}`;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/session-debrief', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Session debrief request', { userId });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, debriefHistory, therapySessionDate } = parsed.data;
    const sanitizedMessage = sanitizeMessage(message);

    const env = getServerEnv();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const historyStr = debriefHistory.length > 0
      ? debriefHistory.map(m => `${m.role}: ${sanitizeMessage(m.content)}`).join('\n')
      : '';

    const fullHistory = historyStr 
      ? `${historyStr}\nuser: ${sanitizedMessage}`
      : `user: ${sanitizedMessage}`;

    const systemPrompt = buildDebriefPrompt(fullHistory);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullHistory,
      config: { 
        systemInstruction: systemPrompt, 
        temperature: 0.6,
        maxOutputTokens: 256,
      },
    });

    const question = response.text?.trim() || "What's the one thing you heard today that you don't want to forget?";

    // Check if this is the closing message
    const isClosing = question.toLowerCase().includes('worth holding onto') || 
                      question.toLowerCase().includes("we'll remember") ||
                      debriefHistory.length >= 6;

    // Save debrief to Firestore
    if (isAdminConfigured() && isClosing) {
      try {
        const db = getAdminFirestore();
        const debriefId = crypto.randomUUID();
        await db.collection('sessionDebriefs').doc(userId).collection('debriefs').doc(debriefId).set({
          id: debriefId,
          therapySessionDate: therapySessionDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          messages: [
            ...debriefHistory,
            { role: 'user', content: sanitizedMessage },
            { role: 'assistant', content: question },
          ],
          keyInsight: debriefHistory.length >= 2 ? debriefHistory[1]?.content : sanitizedMessage,
        });
        log.info('Session debrief saved', { userId, debriefId });
      } catch (e) {
        log.error('Failed to save debrief', {}, e);
      }
    }

    return NextResponse.json({
      question,
      isClosing,
    });
  } catch (error) {
    log.error('Session debrief error', {}, error);
    return NextResponse.json(
      { error: 'Failed to process debrief' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/session-debrief', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ debriefs: [] });
    }

    const db = getAdminFirestore();
    const snapshot = await db.collection('sessionDebriefs')
      .doc(userId)
      .collection('debriefs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const debriefs = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ debriefs });
  } catch (error) {
    log.error('Get debriefs error', {}, error);
    return NextResponse.json({ debriefs: [] });
  }
}
