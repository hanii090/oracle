import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Memory Portraits — Pro-only Feature (End of Life)
 * POST /api/memory-portrait
 *
 * Generates a visual "memory portrait" from End of Life session data.
 * Captures legacy themes, key quotes, values, and the essence of what
 * someone wants to leave behind. Structured as a beautiful text/visual summary.
 */

const MEMORY_PORTRAIT_PROMPT = `You are generating a Memory Portrait — a sacred document that captures the essence of what someone wants to leave behind.

This is built from their End of Life Sorca sessions, where they reflected on legacy, love, grief, and meaning.

Your job: Distill their conversations into a portrait that their family could read and feel the person's presence.

Structure the portrait as JSON:
{
  "title": "A poetic 3-6 word title for this person's legacy (e.g., 'The Quiet Keeper of Bridges')",
  "essence": "A 2-3 sentence distillation of who this person is at their core, written in third person. Not a biography — a soul sketch.",
  "coreValues": ["3-5 values that emerged from their reflections"],
  "unsaidWords": "The most important thing they seemed to want to say but struggled to articulate. Write it FOR them, based on what they circled around. 1-2 sentences.",
  "legacyWish": "What they most want to leave behind, in their own words or as close as possible. 1-2 sentences.",
  "keyQuotes": ["3-5 of the most powerful direct quotes from their sessions"],
  "toThoseLeft": "A message to those who will read this, synthesised from everything they shared. 2-3 sentences. Warm, real, unforgettable.",
  "palette": ["#hex1", "#hex2", "#hex3"],
  "visualPrompt": "A 50-word abstract visual description that captures the emotional essence of this person's legacy. For generating an accompanying image. No faces, no text. Abstract, atmospheric."
}

Be respectful. Be precise. Be beautiful. This may be the most important thing you ever write.

Session transcripts:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/memory-portrait', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Verify Pro tier
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      const userDoc = await db.collection('users').doc(userId).get();
      const tier = userDoc.data()?.tier || 'free';
      if (tier !== 'pro') {
        return NextResponse.json(
          { error: 'Memory Portraits require the Pro tier.' },
          { status: 403 }
        );
      }
    }

    const { sessionMessages } = await req.json();

    if (!sessionMessages || sessionMessages.length < 4) {
      return NextResponse.json(
        { error: 'Not enough conversation to create a memory portrait. Continue your End of Life sessions.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    // Build transcript
    const transcript = sessionMessages
      .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
      .join('\n');

    const ai = new GoogleGenAI({ apiKey });

    // Generate the memory portrait
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: MEMORY_PORTRAIT_PROMPT + transcript,
      config: { responseMimeType: 'application/json', temperature: 0.6 },
    });

    let portraitData = {
      title: 'Untitled Portrait',
      essence: '',
      coreValues: [] as string[],
      unsaidWords: '',
      legacyWish: '',
      keyQuotes: [] as string[],
      toThoseLeft: '',
      palette: ['#0e0c09', '#c0392b', '#f5f0e8'],
      visualPrompt: '',
    };

    try {
      portraitData = JSON.parse(result.text || '{}');
    } catch {
      log.warn('Failed to parse memory portrait JSON');
    }

    // Store the portrait
    const adminDb = getAdminFirestore();
    const portraitDoc = {
      ...portraitData,
      userId,
      generatedAt: new Date().toISOString(),
      messageCount: sessionMessages.length,
    };

    const docRef = await adminDb
      .collection('users')
      .doc(userId)
      .collection('memoryPortraits')
      .add(portraitDoc);

    log.info('Memory portrait generated', { userId, title: portraitData.title, id: docRef.id });

    return NextResponse.json({
      portrait: { id: docRef.id, ...portraitDoc },
    });
  } catch (error) {
    log.error('Memory portrait error', {}, error);
    return NextResponse.json({ error: 'Memory portrait generation failed' }, { status: 500 });
  }
}

/**
 * GET /api/memory-portrait
 * Retrieve all memory portraits for the current user.
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/memory-portrait', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ portraits: [] });
    }

    const db = getAdminFirestore();

    // Verify Pro tier
    const userDoc = await db.collection('users').doc(userId).get();
    const tier = userDoc.data()?.tier || 'free';
    if (tier !== 'pro') {
      return NextResponse.json(
        { error: 'Memory Portraits require the Pro tier.' },
        { status: 403 }
      );
    }

    const snap = await db
      .collection('users')
      .doc(userId)
      .collection('memoryPortraits')
      .orderBy('generatedAt', 'desc')
      .limit(20)
      .get();

    const portraits = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ portraits });
  } catch (error) {
    log.error('Memory portrait fetch error', {}, error);
    return NextResponse.json({ error: 'Failed to fetch portraits' }, { status: 500 });
  }
}
