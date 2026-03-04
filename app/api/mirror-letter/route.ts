import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Mirror Letter — Feature 13
 * POST /api/mirror-letter
 *
 * Once per month, Sorca writes a first-person letter in the user's voice —
 * a compassionate reflection of their patterns, breakthroughs, and blind spots.
 * "Dear me, I've been avoiding the obvious…"
 */

const MIRROR_LETTER_PROMPT = `You are writing a Mirror Letter for a Sorca user.

A Mirror Letter is a first-person letter written as if the user is writing to themselves, 
based on patterns observed across their conversations with Sorca (a Socratic questioning AI).

The letter should:
- Be written in first person ("Dear me," or "Dear [first name]," if known)
- Reflect what the user has been exploring, avoiding, and circling around
- Name recurring themes with compassion, not judgement
- Acknowledge breakthroughs and moments of honest depth
- Gently point toward what the user may still be avoiding
- End with a single powerful question they haven't yet asked themselves
- Be 200-400 words
- Use the user's own vocabulary and phrasing where possible
- Feel warm, intimate, honest — like a letter from a wiser version of themselves

Tone: compassionate, perceptive, slightly poetic. Never clinical. Never preachy.

Based on this month's conversations and detected patterns, write the Mirror Letter.

Patterns detected:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/mirror-letter', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Mirror Letter generation requested', { userId });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    const adminDb = getAdminFirestore();

    // Check if a letter was already generated this month
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lettersRef = adminDb.collection('users').doc(userId).collection('letters');
    const existingLetter = await lettersRef
      .where('monthKey', '==', monthKey)
      .limit(1)
      .get();

    if (!existingLetter.empty) {
      const letterData = existingLetter.docs[0].data();
      return NextResponse.json({
        letter: letterData.content,
        monthKey,
        generatedAt: letterData.generatedAt,
        cached: true,
      });
    }

    // Gather this month's patterns
    const patternsRef = adminDb.collection('users').doc(userId).collection('patterns');
    const patternsSnap = await patternsRef
      .orderBy('detectedAt', 'desc')
      .limit(20)
      .get();

    // Gather avoided questions
    const avoidedRef = adminDb.collection('users').doc(userId).collection('avoided');
    const avoidedSnap = await avoidedRef
      .orderBy('detectedAt', 'desc')
      .limit(10)
      .get();

    // Gather recent sessions (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const threadsRef = adminDb.collection('users').doc(userId).collection('threads');
    const threadsSnap = await threadsRef
      .where('updatedAt', '>=', thirtyDaysAgo)
      .orderBy('updatedAt', 'desc')
      .limit(10)
      .get();

    // Build context for the AI
    let context = '';

    if (!patternsSnap.empty) {
      context += '\n## Detected Patterns:\n';
      for (const doc of patternsSnap.docs) {
        const p = doc.data();
        context += `- [${p.type}] "${p.label}" (significance: ${p.significance}/10): ${p.explanation}\n`;
        if (p.evidence?.length) {
          context += `  Evidence: ${p.evidence.slice(0, 2).map((e: string) => `"${e}"`).join(', ')}\n`;
        }
      }
    }

    if (!avoidedSnap.empty) {
      context += '\n## Questions They Avoided:\n';
      for (const doc of avoidedSnap.docs) {
        const a = doc.data();
        context += `- "${a.question}" (deflected via ${a.deflectionType}): ${a.significance}\n`;
      }
    }

    if (!threadsSnap.empty) {
      context += '\n## Recent Session Themes:\n';
      for (const doc of threadsSnap.docs) {
        const t = doc.data();
        if (t.messages?.length) {
          const depthReached = Math.max(...t.messages.map((m: { depth?: number }) => m.depth || 0));
          const topics = t.messages
            .filter((m: { role: string }) => m.role === 'user')
            .slice(0, 3)
            .map((m: { content: string }) => m.content.substring(0, 100));
          context += `- Session (depth ${depthReached}): ${topics.join(' | ')}\n`;
        }
      }
    }

    if (!context.trim()) {
      return NextResponse.json({
        error: 'Not enough history to generate your Mirror Letter yet. Keep exploring.',
        monthKey,
      }, { status: 400 });
    }

    // Generate the letter
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: MIRROR_LETTER_PROMPT + context,
    });

    const letterContent = result.text || '';

    if (!letterContent) {
      return NextResponse.json({ error: 'Letter generation failed' }, { status: 500 });
    }

    // Store the letter
    await lettersRef.add({
      monthKey,
      content: letterContent,
      generatedAt: now.toISOString(),
      patternCount: patternsSnap.size,
      avoidedCount: avoidedSnap.size,
      sessionCount: threadsSnap.size,
    });

    log.info('Mirror Letter generated', { userId, monthKey });

    return NextResponse.json({
      letter: letterContent,
      monthKey,
      generatedAt: now.toISOString(),
      cached: false,
    });
  } catch (error) {
    log.error('Mirror Letter generation error', {}, error);
    return NextResponse.json(
      { error: 'Could not generate your Mirror Letter. Try again later.' },
      { status: 500 }
    );
  }
}
