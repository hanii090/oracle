import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Time Capsule — Feature 12
 * POST /api/time-capsule
 *
 * Create a sealed message to future self with 3 guided Sorca questions.
 * Opens in 6 months, showing how the Thread has changed.
 * GET /api/time-capsule — list user's capsules and check for opened ones.
 */

const CAPSULE_QUESTIONS = [
  "Who are you right now — in one sentence that would make a stranger understand?",
  "What do you hope will be different about you in six months?",
  "What are you afraid won't have changed?",
];

const CAPSULE_REFLECTION_PROMPT = `You are writing a Time Capsule reflection for a Sorca user.

Six months ago, they sealed a Time Capsule. Now it's opening.

Their answers from 6 months ago:
{answers}

Their current Thread patterns:
{currentPatterns}

Write a brief, compassionate reflection (100-200 words) comparing who they were then to who they appear to be now. Note what changed, what didn't, and what surprised you. End with a single question.

Be honest but warm. This is a ritual moment.`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/time-capsule', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const { action, answers, capsuleId } = await req.json();

    const adminDb = getAdminFirestore();
    const capsulesRef = adminDb.collection('users').doc(userId).collection('timeCapsules');

    if (action === 'create') {
      // Create a new time capsule
      if (!answers || answers.length !== 3) {
        return NextResponse.json({ error: 'Three answers required' }, { status: 400 });
      }

      const now = new Date();
      const opensAt = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // ~6 months

      const capsule = {
        id: crypto.randomUUID(),
        answers: CAPSULE_QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] })),
        sealedAt: now.toISOString(),
        opensAt: opensAt.toISOString(),
        opened: false,
        reflection: null,
      };

      await capsulesRef.add(capsule);

      log.info('Time Capsule sealed', { userId, opensAt: capsule.opensAt });

      return NextResponse.json({
        capsule: {
          id: capsule.id,
          sealedAt: capsule.sealedAt,
          opensAt: capsule.opensAt,
          questions: CAPSULE_QUESTIONS,
        },
        message: 'Your Time Capsule has been sealed. It will open in 6 months.',
      });

    } else if (action === 'open') {
      // Open a capsule
      if (!capsuleId) {
        return NextResponse.json({ error: 'Capsule ID required' }, { status: 400 });
      }

      const capsuleSnap = await capsulesRef.where('id', '==', capsuleId).limit(1).get();
      if (capsuleSnap.empty) {
        return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      }

      const capsuleDoc = capsuleSnap.docs[0];
      const capsuleData = capsuleDoc.data();

      // Check if it's time to open
      const opensAt = new Date(capsuleData.opensAt);
      const now = new Date();

      if (now < opensAt && !capsuleData.opened) {
        const daysRemaining = Math.ceil((opensAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return NextResponse.json({
          sealed: true,
          daysRemaining,
          opensAt: capsuleData.opensAt,
          message: `This capsule opens in ${daysRemaining} days. Be patient with yourself.`,
        });
      }

      // Generate reflection if not already done
      if (!capsuleData.reflection) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            // Get current patterns
            const patternsRef = adminDb.collection('users').doc(userId).collection('patterns');
            const patternsSnap = await patternsRef.orderBy('detectedAt', 'desc').limit(10).get();
            const currentPatterns = patternsSnap.docs
              .map(d => d.data().summary || d.data().label)
              .join('\n');

            const answersText = capsuleData.answers
              .map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`)
              .join('\n\n');

            const prompt = CAPSULE_REFLECTION_PROMPT
              .replace('{answers}', answersText)
              .replace('{currentPatterns}', currentPatterns || 'No patterns detected yet.');

            const ai = new GoogleGenAI({ apiKey });
            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            const reflection = result.text || '';
            await capsuleDoc.ref.update({ opened: true, reflection, openedAt: now.toISOString() });

            return NextResponse.json({
              capsule: { ...capsuleData, reflection, opened: true, openedAt: now.toISOString() },
            });
          } catch (e) {
            log.warn('Reflection generation failed', {}, e);
          }
        }

        await capsuleDoc.ref.update({ opened: true, openedAt: now.toISOString() });
      }

      return NextResponse.json({
        capsule: { ...capsuleData, opened: true },
      });

    } else if (action === 'list') {
      const allCapsules = await capsulesRef.orderBy('sealedAt', 'desc').get();
      const capsules = allCapsules.docs.map(d => {
        const data = d.data();
        const opensAt = new Date(data.opensAt);
        const isReady = new Date() >= opensAt;
        return {
          id: data.id,
          sealedAt: data.sealedAt,
          opensAt: data.opensAt,
          opened: data.opened,
          isReady,
          daysRemaining: isReady ? 0 : Math.ceil((opensAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        };
      });

      return NextResponse.json({ capsules, questions: CAPSULE_QUESTIONS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    log.error('Time Capsule error', {}, error);
    return NextResponse.json({ error: 'Time Capsule failed' }, { status: 500 });
  }
}
