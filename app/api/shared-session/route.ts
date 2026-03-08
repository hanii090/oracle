import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';

const sharedSessionSchema = z.object({
  action: z.enum(['create', 'join', 'submit', 'status', 'check']),
  sessionId: z.string().max(200).optional(),
  inviteCode: z.string().max(20).optional(),
  answers: z.array(z.string().max(5000)).optional(),
  partnerName: z.string().max(100).optional(),
});

/**
 * Shared Sessions — Feature 15
 * POST /api/shared-session
 *
 * Two people answer the same Sorca questions independently.
 * Neither sees the other's answer until both have responded.
 * Then Sorca surfaces similarities and differences.
 */

const COMPARISON_PROMPT = `You are analysing a shared Sorca session between two people.

Both answered the same deep questions independently, without seeing each other's answers.

Your job: Surface the most meaningful similarities and differences. Not surface-level — deep structural patterns.

Guidelines:
- If they said similar things, note what's striking about the overlap
- If they diverged, note what each person's answer reveals about their perspective
- Be compassionate but unflinching
- End with one observation that neither person could have seen alone
- Maximum 300 words total

Questions and their answers:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/shared-session', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = sharedSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action, sessionId, inviteCode, answers, partnerName } = parsed.data;

    const adminDb = getAdminFirestore();
    const sharedRef = adminDb.collection('sharedSessions');

    if (action === 'create') {
      // Create a new shared session
      const questions = [
        "What is the thing you most want the other person to understand about you?",
        "What are you afraid they already know?",
        "What truth about your relationship have you been avoiding?",
        "If you could change one thing about how you relate to each other, what would it be?",
        "What do you need from them that you've never asked for?",
      ];

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const session = {
        id: crypto.randomUUID(),
        inviteCode: code,
        creatorId: userId,
        creatorName: partnerName || 'Person A',
        partnerId: null,
        partnerName: null,
        questions,
        creatorAnswers: null,
        partnerAnswers: null,
        analysis: null,
        status: 'waiting_for_partner',
        createdAt: new Date().toISOString(),
      };

      await sharedRef.add(session);

      log.info('Shared session created', { userId, code });

      return NextResponse.json({
        session: { id: session.id, inviteCode: code, questions, status: 'waiting_for_partner' },
      });

    } else if (action === 'join') {
      // Join with invite code
      const snap = await sharedRef.where('inviteCode', '==', inviteCode).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
      }

      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data();

      if (data.partnerId) {
        return NextResponse.json({ error: 'This session already has two participants' }, { status: 400 });
      }

      await docRef.update({
        partnerId: userId,
        partnerName: partnerName || 'Person B',
        status: 'in_progress',
      });

      return NextResponse.json({
        session: { id: data.id, questions: data.questions, status: 'in_progress' },
      });

    } else if (action === 'submit') {
      // Submit answers
      if (!sessionId || !answers) {
        return NextResponse.json({ error: 'Session ID and answers required' }, { status: 400 });
      }

      const snap = await sharedRef.where('id', '==', sessionId).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data();

      if (data.creatorId !== userId && data.partnerId !== userId) {
        return NextResponse.json({ error: 'You are not a participant in this session' }, { status: 403 });
      }

      const isCreator = data.creatorId === userId;
      const field = isCreator ? 'creatorAnswers' : 'partnerAnswers';

      await docRef.update({ [field]: answers });

      // Check if both have answered
      const updated = { ...data, [field]: answers };
      if (updated.creatorAnswers && updated.partnerAnswers) {
        // Generate analysis
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            const pairsText = data.questions.map((q: string, i: number) =>
              `Question: "${q}"\n${data.creatorName || 'Person A'}: "${updated.creatorAnswers[i]}"\n${data.partnerName || 'Person B'}: "${updated.partnerAnswers[i]}"`
            ).join('\n\n');

            const ai = new GoogleGenAI({ apiKey });
            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: COMPARISON_PROMPT + pairsText,
            });

            const analysis = result.text || '';
            await docRef.update({ analysis, status: 'complete' });

            return NextResponse.json({
              status: 'complete',
              questions: data.questions,
              creatorAnswers: updated.creatorAnswers,
              partnerAnswers: updated.partnerAnswers,
              analysis,
              creatorName: data.creatorName,
              partnerName: data.partnerName,
            });
          } catch (e) {
            log.warn('Analysis generation failed', {}, e);
          }
        }

        await docRef.update({ status: 'complete' });

        return NextResponse.json({
          status: 'complete',
          questions: data.questions,
          creatorAnswers: updated.creatorAnswers,
          partnerAnswers: updated.partnerAnswers,
          creatorName: data.creatorName,
          partnerName: data.partnerName,
        });
      }

      return NextResponse.json({
        status: 'waiting_for_partner',
        message: 'Your answers have been submitted. Waiting for the other person.',
      });

    } else if (action === 'check') {
      // Check status
      const snap = await sharedRef.where('id', '==', sessionId).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const data = snap.docs[0].data();
      const isCreator = data.creatorId === userId;

      return NextResponse.json({
        status: data.status,
        hasPartner: !!data.partnerId,
        yourAnswersSubmitted: isCreator ? !!data.creatorAnswers : !!data.partnerAnswers,
        partnerAnswersSubmitted: isCreator ? !!data.partnerAnswers : !!data.creatorAnswers,
        analysis: data.analysis,
        questions: data.questions,
        creatorAnswers: data.status === 'complete' ? data.creatorAnswers : null,
        partnerAnswers: data.status === 'complete' ? data.partnerAnswers : null,
        creatorName: data.creatorName,
        partnerName: data.partnerName,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    log.error('Shared session error', {}, error);
    return NextResponse.json({ error: 'Shared session failed' }, { status: 500 });
  }
}
