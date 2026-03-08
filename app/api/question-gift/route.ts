import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';

const giftSchema = z.object({
  action: z.enum(['create', 'open', 'answer', 'list']),
  recipientName: z.string().max(100).optional(),
  giftId: z.string().max(200).optional(),
  answer: z.string().max(5000).optional(),
});

/**
 * Question Gift — Feature 16
 * POST /api/question-gift
 *
 * Send someone a Sorca question as a beautiful gift.
 * They receive it as an image with the question embedded.
 */

const DEPTH_QUESTIONS = [
  "What truth have you been decorating instead of confronting?",
  "Who would you be if you stopped performing the version of yourself everyone expects?",
  "What is the thing you pretend doesn't bother you?",
  "If you knew nobody would judge you, what would you admit you want?",
  "What story about yourself have you told so many times that you've forgotten it's a story?",
  "What would you do with your life if love wasn't a factor?",
  "What are you loyal to that no longer serves you?",
  "Who did you stop becoming, and when did you stop?",
  "What is the kindest lie you tell yourself?",
  "If the person who knows you best wrote one sentence about you, what would you be afraid it would say?",
  "What permission are you waiting for that nobody else can give you?",
  "What would your life look like if you trusted yourself completely?",
];

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/question-gift', correlationId: crypto.randomUUID() });

  try {
    const body = await req.json();
    const parsed = giftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action, recipientName, giftId, answer } = parsed.data;

    // Actions that don't require authentication (for gift recipients)
    if (action === 'open' || action === 'answer') {
      const adminDb = getAdminFirestore();
      const giftsRef = adminDb.collection('questionGifts');

      if (action === 'open') {
        if (!giftId) {
          return NextResponse.json({ error: 'Gift ID required' }, { status: 400 });
        }

        const snap = await giftsRef.where('id', '==', giftId).limit(1).get();
        if (snap.empty) {
          return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
        }

        const data = snap.docs[0].data();
        await snap.docs[0].ref.update({ opened: true, openedAt: new Date().toISOString() });

        return NextResponse.json({
          gift: {
            id: data.id,
            question: data.question,
            recipientName: data.recipientName,
            opened: true,
          },
        });
      }

      if (action === 'answer') {
        if (!giftId || !answer) {
          return NextResponse.json({ error: 'Gift ID and answer required' }, { status: 400 });
        }

        const snap = await giftsRef.where('id', '==', giftId).limit(1).get();
        if (snap.empty) {
          return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
        }

        await snap.docs[0].ref.update({ answer, answeredAt: new Date().toISOString() });

        return NextResponse.json({
          message: 'Your answer has been saved. The person who sent this will be notified.',
        });
      }
    }

    // Actions that require authentication (for gift senders)
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const adminDb = getAdminFirestore();
    const giftsRef = adminDb.collection('questionGifts');

    if (action === 'create') {
      // Pick a random depth-5 question
      const question = DEPTH_QUESTIONS[Math.floor(Math.random() * DEPTH_QUESTIONS.length)];

      const gift = {
        id: crypto.randomUUID(),
        question,
        senderId: userId,
        recipientName: recipientName || 'Someone special',
        answer: null,
        createdAt: new Date().toISOString(),
        opened: false,
        openedAt: null,
      };

      await giftsRef.add(gift);

      // Generate a visual for the gift
      let visual: string | null = null;
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const visualRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a JSON description for an abstract gift card visual. The question is: "${question}". Return JSON: { "colors": ["#hex1", "#hex2"], "mood": "...", "description": "brief abstract visual description" }`,
            config: { responseMimeType: 'application/json' },
          });
          try {
            const visualData = JSON.parse(visualRes.text || '{}');
            visual = visualData.description;
          } catch {
            // Use default
          }
        } catch {
          // Silent fail
        }
      }

      log.info('Question Gift created', { userId, giftId: gift.id });

      return NextResponse.json({
        gift: {
          id: gift.id,
          question,
          recipientName: gift.recipientName,
          shareUrl: `/gift/${gift.id}`,
          visual,
        },
      });

    } else if (action === 'list') {
      // List gifts sent by this user
      const sentSnap = await giftsRef.where('senderId', '==', userId).orderBy('createdAt', 'desc').limit(20).get();
      const gifts = sentSnap.docs.map(d => {
        const data = d.data();
        return {
          id: data.id,
          question: data.question,
          recipientName: data.recipientName,
          opened: data.opened,
          answered: !!data.answer,
          createdAt: data.createdAt,
        };
      });

      return NextResponse.json({ gifts });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    log.error('Question Gift error', {}, error);
    return NextResponse.json({ error: 'Question Gift failed' }, { status: 500 });
  }
}
