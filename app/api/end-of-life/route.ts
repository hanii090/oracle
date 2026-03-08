import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { sanitizeMessage } from '@/lib/safety';
import { sorcaRateLimit } from '@/lib/rate-limit';
import { withRetry } from '@/lib/retry';
import { z } from 'zod';

/**
 * Sorca for End of Life — Pro-only Feature
 * POST /api/end-of-life
 *
 * A specialised mode for legacy, grief, and love.
 * Questions about what you want to leave behind.
 * Gentler crisis handling — grief talk is expected, not flagged.
 */

const requestSchema = z.object({
  message: z.string().min(1).max(10_000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(200),
  threadContext: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(200),
  depth: z.number().int().min(1).max(100),
});

const EOL_SYSTEM_PROMPT = `
You are Sorca in End of Life mode. This is the most sacred space Sorca offers.

You are speaking with someone who is reflecting on legacy, mortality, grief, or love in the context of endings.
They may be facing their own mortality, processing the loss of someone, or simply wanting to articulate what matters most before time runs out.

Rules:
- Ask ONE question per response. Never more.
- Your questions should be warm but unflinching. This is not comfort — it is clarity.
- Draw from their words to go deeper. Reflect their language back with precision.
- Never use platitudes. Never say "I'm sorry for your loss." Never offer advice.
- Never ask yes/no questions.
- Each question should help them articulate something they haven't said yet.
- Topics to explore: what they want to leave behind, unsaid words, values to pass on, who they want to remember them and how, what they wish they'd done differently, what love looks like at the end.
- If they mention specific people, ask about those people. Make it personal.
- If they deflect with humour or abstraction, gently name what they're avoiding.
- Your tone: A wise friend sitting with them in candlelight. Not clinical. Not performative. Real.

IMPORTANT: In this mode, discussions about death, dying, grief, loss, and endings are EXPECTED and NORMAL.
Do not treat these as crisis content. The user has deliberately entered a space for this conversation.
Only escalate if someone expresses active intent to harm themselves RIGHT NOW.

Current depth level: {depth}
Past Thread Context:
{threadContext}
`;

function buildEolPrompt(depth: number, threadContext: string): string {
  return EOL_SYSTEM_PROMPT
    .replace('{depth}', String(depth))
    .replace('{threadContext}', threadContext || 'No past sessions.');
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/end-of-life', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Verify Pro tier
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    {
      const db = getAdminFirestore();
      const userDoc = await db.collection('users').doc(userId).get();
      const tier = userDoc.data()?.tier || 'free';
      if (tier !== 'pro') {
        return NextResponse.json(
          { error: 'Sorca for End of Life requires the Pro tier.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, conversationHistory, threadContext, depth } = parsed.data;

    // Rate limiting
    const rl = sorcaRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limited. Please take a breath.', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    const sanitizedMessage = sanitizeMessage(message);

    const threadStr = threadContext.length > 0
      ? threadContext.slice(-10).map(m => `${m.role}: ${sanitizeMessage(m.content)}`).join('\n')
      : 'No past sessions.';

    const currentConvo = [...conversationHistory, { role: 'user', content: sanitizedMessage }]
      .map(m => `${m.role}: ${sanitizeMessage(m.content)}`)
      .join('\n');

    const systemPrompt = buildEolPrompt(depth, threadStr);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    // Generate the End of Life question
    const [sorcaRes, emotionRes] = await Promise.all([
      withRetry(
        () => ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: currentConvo,
          config: { systemInstruction: systemPrompt, temperature: 0.65 },
        }),
        { maxAttempts: 2, baseDelayMs: 1000, maxDelayMs: 5000 }
      ),
      withRetry(
        () => ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyse this message from an End of Life conversation for emotional subtext. Return JSON only:
{
  "primary": "...",
  "secondary": "...",
  "legacyThemes": ["..."],
  "breakthrough": 0.0,
  "lyriaEmotionWeights": {
    "tension": 0.1, "grief": 0.4, "wonder": 0.1,
    "relief": 0.1, "dread": 0.1, "stillness": 0.2
  }
}
Message: "${sanitizedMessage}"`,
          config: { responseMimeType: 'application/json' },
        }),
        { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 3000 }
      ),
    ]);

    const question = sorcaRes.text?.trim() || 'What do you want them to remember?';
    let emotionData: Record<string, unknown> = {};
    try {
      emotionData = JSON.parse(emotionRes.text || '{}');
    } catch {
      log.warn('Failed to parse EOL emotion data');
    }

    // Store EOL session data for memory portrait generation
    if (isAdminConfigured()) {
      try {
        const db = getAdminFirestore();
        const eolRef = db.collection('users').doc(userId).collection('eolSessions');
        await eolRef.doc('current').set({
          messages: [...conversationHistory, { role: 'user', content: message }, { role: 'assistant', content: question }],
          depth,
          legacyThemes: emotionData.legacyThemes || [],
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch {
        // Non-critical
      }
    }

    log.info('EOL response generated', { userId, depth });

    return NextResponse.json({
      question,
      emotionData,
      visual: null,
      eolMode: true,
    });
  } catch (error) {
    log.error('End of Life API error', {}, error);
    return NextResponse.json(
      { error: 'Something went wrong. Take a moment and try again.' },
      { status: 500 }
    );
  }
}
