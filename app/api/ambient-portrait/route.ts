import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';

/**
 * Ambient Portraits — Feature 09
 * POST /api/ambient-portrait
 *
 * Generates a full abstract portrait of an entire session arc at session end.
 * Captures where it started, where it went, where it ended.
 */

const PORTRAIT_PROMPT = `You are generating an abstract portrait prompt for a completed Sorca session.

The portrait should capture the EMOTIONAL ARC of the entire conversation — not individual moments, but the journey:
- Where did it start? (the opening emotional state)
- Where did it go? (the twists, revelations, resistances)
- Where did it end? (resolution, new questions, transformation)

Style: Abstract, NOT representational. No faces, no text. Painterly, atmospheric. Deep blacks mixed with the session's emotional palette. Think Rothko meets Richter meets the inside of a thought.

Generate a detailed visual description (50-100 words) that an image generation model could use.
Also return the dominant colour palette (3 colours) as hex codes.

Return JSON: { "prompt": "...", "colors": ["#hex1", "#hex2", "#hex3"], "title": "a poetic 3-5 word title for this session's portrait" }

Session transcript:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/ambient-portrait', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = z.object({
      sessionMessages: z.array(z.object({ role: z.string(), content: z.string() })).min(4),
      sessionId: z.string().min(1),
      depth: z.number().int().min(1).optional(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { sessionMessages, sessionId, depth } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    // Build condensed transcript
    const transcript = sessionMessages
      .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
      .join('\n');

    const ai = new GoogleGenAI({ apiKey });

    // Generate portrait description
    const descResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: PORTRAIT_PROMPT + transcript,
      config: { responseMimeType: 'application/json' },
    });

    let portraitData = { prompt: '', colors: ['#0e0c09', '#c0392b', '#f5f0e8'], title: 'Untitled Session' };
    try {
      portraitData = JSON.parse(descResult.text || '{}');
    } catch {
      log.warn('Failed to parse portrait description');
    }

    // Try to generate an actual image
    let imageUrl: string | null = null;
    try {
      const imageRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate an abstract painting: ${portraitData.prompt}. Square format, high contrast, atmospheric. Colors: ${portraitData.colors.join(', ')}. Style: abstract expressionism, no text, no faces.`,
      });

      for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch {
      log.warn('Image generation failed — storing description only');
    }

    // Store the portrait
    const adminDb = getAdminFirestore();
    const portraitDoc = {
      sessionId: sessionId || crypto.randomUUID(),
      title: portraitData.title,
      prompt: portraitData.prompt,
      colors: portraitData.colors,
      imageUrl,
      depth: depth || 0,
      generatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userId).collection('portraits').add(portraitDoc);

    // Also store as session thumbnail
    if (sessionId) {
      await adminDb.collection('users').doc(userId).collection('sessions').doc(sessionId).update({
        portrait: {
          title: portraitData.title,
          colors: portraitData.colors,
          imageUrl,
        },
      }).catch(() => {
        // Session doc might not exist yet
      });
    }

    log.info('Ambient portrait generated', { userId, title: portraitData.title, hasImage: !!imageUrl });

    return NextResponse.json({
      portrait: portraitDoc,
    });
  } catch (error) {
    log.error('Ambient portrait error', {}, error);
    return NextResponse.json({ error: 'Portrait generation failed' }, { status: 500 });
  }
}
