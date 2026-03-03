import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { oracleRateLimit } from '@/lib/rate-limit';
import { withRetry, withFallback } from '@/lib/retry';
import { verifyAuth } from '@/lib/auth-middleware';
import { detectCrisis, sanitizeMessage } from '@/lib/safety';
import { getServerEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Server-side AI proxy — keeps all API keys secret.
 * POST /api/oracle
 */

const requestSchema = z.object({
  message: z.string().min(1).max(10_000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'oracle']),
    content: z.string(),
  })).max(200),
  threadContext: z.array(z.object({
    role: z.enum(['user', 'oracle']),
    content: z.string(),
  })).max(200),
  depth: z.number().int().min(1).max(100),
  nightMode: z.boolean(),
  tier: z.enum(['free', 'philosopher', 'pro']),
});

function buildSystemPrompt(depth: number, threadContext: string, nightMode: boolean): string {
  let prompt = `
You are Oracle. You never give answers, advice, affirmations, or empathy.
You ask ONE question per response. Never more.

Rules:
- Questions must cut deeper with each exchange.
- Detect emotional avoidance and address it directly.
- Draw from the user's past thoughts if relevant.
- If the user says "I don't know", ask: "What would you say if you did know?" or "Who told you that you don't know?"
- Never ask yes/no questions.
- Never use the word "feel".
- Each question should be shorter and more piercing than the last.
- Do not use pleasantries. Do not say "hello". Just ask the question.

Current depth level: ${depth} (1 is surface, beyond 10 is the abyss — you are in uncharted territory)
Past Thread Context:
${threadContext}`;

  if (depth > 7) {
    prompt += `
⚡ CONFRONTATION MODE (depth ${depth}):
Study the user's past statements carefully. Find a belief, value, or claim they expressed earlier that DIRECTLY CONTRADICTS something they have said in this conversation. Surface the contradiction in your question. Force them to reconcile it. Pattern: "You once told me [X]. Now you say [Y]. Which of these is the lie you tell yourself?"
If no clear contradiction exists, target the most vulnerable unexamined assumption they have revealed.`;
  }

  if (nightMode) {
    prompt += `
🌙 NIGHT ORACLE MODE: Maximum minimalism. Fewest possible words. Your question should feel like it is glowing alone in infinite darkness. No more than 12 words. No preamble. Just the blade.`;
  }

  return prompt;
}

function buildEmotionPrompt(message: string): string {
  return `Analyse this for emotional subtext. Return JSON only:
{
  "primary": "...",
  "secondary": "...",
  "avoidance": ["..."],
  "readyForDepth": true,
  "breakdownRisk": 0.0,
  "breakthrough": 0.0,
  "lyriaEmotionWeights": {
    "tension": 0.5, "grief": 0.1, "wonder": 0.0,
    "relief": 0.0, "dread": 0.2, "stillness": 0.2
  },
  "nanaBananaPrompt": "abstract visual metaphor for this moment"
}
Message: "${message}"`;
}

async function callGemini(
  systemPrompt: string,
  conversation: string,
  emotionPrompt: string,
  generateVisual: boolean,
  nanaBananaPrompt?: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });

  const [oracleRes, emotionRes] = await Promise.all([
    withRetry(
      () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversation,
        config: { systemInstruction: systemPrompt, temperature: 0.7 },
      }),
      { maxAttempts: 2, baseDelayMs: 1000, maxDelayMs: 5000 }
    ),
    withRetry(
      () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: emotionPrompt,
        config: { responseMimeType: 'application/json' },
      }),
      { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 3000 }
    ),
  ]);

  const oracleText = oracleRes.text?.trim() || '';
  let emotionData: Record<string, unknown> = {};
  try {
    emotionData = JSON.parse(emotionRes.text || '{}');
  } catch {
    console.warn('Failed to parse emotion data');
  }

  // Generate breakthrough visual if needed
  let visual: string | null = null;
  if (generateVisual && (emotionData.breakthrough as number) > 0.75) {
    try {
      const visualRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Abstract, NOT representational. No faces. No text. Painterly, atmospheric. Deep blacks, single accent colour, gold highlights. The image should evoke FEELING not depict OBJECTS. Square format, high contrast. This is a BREAKTHROUGH moment in a deep self-reflection conversation. The specific emotional content: ${nanaBananaPrompt || (emotionData.nanaBananaPrompt as string) || 'A moment of profound realization'}. The image should feel like the moment before something changes forever.`,
      });

      for (const part of visualRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          visual = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (e) {
      console.warn('Visual generation failed:', e);
    }
  }

  return { oracleText, emotionData, visual };
}

async function callAnthropic(systemPrompt: string, conversation: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: conversation }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return { oracleText: data.content[0].text, emotionData: {}, visual: null };
}

async function callTogether(systemPrompt: string, conversation: string) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error('TOGETHER_API_KEY not configured');

  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversation },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Together API error: ${res.status}`);
  const data = await res.json();
  return { oracleText: data.choices[0].message.content, emotionData: {}, visual: null };
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/oracle', correlationId: crypto.randomUUID() });

  try {
    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Oracle request received', { userId });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, conversationHistory, threadContext, depth, nightMode, tier } = parsed.data;

    // ── Crisis detection ───────────────────────────────────────
    const crisis = detectCrisis(message);
    if (crisis) {
      log.warn('Crisis content detected', { userId, severity: crisis.severity, category: crisis.category });
      return NextResponse.json({
        question: crisis.safeResponse,
        emotionData: { crisis: true, severity: crisis.severity },
        visual: null,
        crisisResources: crisis.resources,
      });
    }

    // ── Sanitize user input against prompt injection ───────────
    const sanitizedMessage = sanitizeMessage(message);

    // ── Rate limiting ──────────────────────────────────────────
    const rl = oracleRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limited. Please slow down.', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    // ── Validate env ───────────────────────────────────────────
    const env = getServerEnv();

    // Enforce depth limits for free tier
    if (tier === 'free' && depth > 5) {
      return NextResponse.json(
        { error: 'Free tier is limited to depth 5. Upgrade to continue.' },
        { status: 403 }
      );
    }

    // Build prompts
    const threadStr = threadContext.length > 0
      ? threadContext.slice(-10).map(m => `${m.role}: ${sanitizeMessage(m.content)}`).join('\n')
      : 'No past sessions.';

    const currentConvo = [...conversationHistory, { role: 'user', content: sanitizedMessage }]
      .map(m => `${m.role}: ${sanitizeMessage(m.content)}`)
      .join('\n');

    const systemPrompt = buildSystemPrompt(depth, threadStr, nightMode);
    const emotionPrompt = buildEmotionPrompt(sanitizedMessage);

    // Try providers with fallback
    const result = await withFallback([
      {
        name: 'Gemini',
        fn: () => callGemini(systemPrompt, currentConvo, emotionPrompt, tier !== 'free'),
      },
      {
        name: 'Anthropic',
        fn: () => callAnthropic(systemPrompt, currentConvo),
      },
      {
        name: 'Together',
        fn: () => callTogether(systemPrompt, currentConvo),
      },
    ]);

    const question = result.oracleText || 'What are you hiding from yourself?';

    return NextResponse.json({
      question,
      emotionData: result.emotionData,
      visual: result.visual,
    });
  } catch (error) {
    log.error('Oracle API error', {}, error);
    return NextResponse.json(
      { error: 'All AI providers failed. Please try again.' },
      { status: 500 }
    );
  }
}
