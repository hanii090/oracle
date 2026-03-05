import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const requestSchema = z.object({
  response: z.string().min(1).max(2000),
  sessionDate: z.string(),
  step: z.enum(['initial', 'followup']).default('initial'),
  previousResponse: z.string().optional(),
});

const PRIMER_FOLLOW_UP_PROMPT = `
The user is about to go to therapy and shared what they want to say:
"{response}"

Ask ONE brief follow-up question that helps them:
- Clarify what they really mean
- Or identify the feeling underneath
- Or name what they're afraid might happen if they say it

Keep it under 20 words. Warm but direct.
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/pre-session-primer', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { response, sessionDate, step, previousResponse } = parsed.data;
    const sanitizedResponse = sanitizeMessage(response);

    if (step === 'initial') {
      // Generate follow-up question
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ 
          followUp: "What makes this feel important to say today?" 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = PRIMER_FOLLOW_UP_PROMPT.replace('{response}', sanitizedResponse);

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.7, maxOutputTokens: 100 },
      });

      const followUp = result.text?.trim() || "What makes this feel important to say today?";

      return NextResponse.json({ followUp });
    }

    // Save completed primer
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      const primerId = crypto.randomUUID();
      
      await db.collection('preSessionPrimers').doc(userId).collection('primers').doc(primerId).set({
        id: primerId,
        sessionDate,
        initialResponse: previousResponse ? sanitizeMessage(previousResponse) : sanitizedResponse,
        followUpResponse: previousResponse ? sanitizedResponse : null,
        createdAt: new Date().toISOString(),
      });

      log.info('Pre-session primer saved', { userId, primerId });
    }

    return NextResponse.json({ 
      success: true,
      message: "Your thoughts are ready. Bring them to your session." 
    });
  } catch (error) {
    log.error('Pre-session primer error', {}, error);
    return NextResponse.json({ error: 'Failed to process primer' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/pre-session-primer', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const sessionDate = url.searchParams.get('sessionDate');

    if (!isAdminConfigured()) {
      return NextResponse.json({ primers: [] });
    }

    const db = getAdminFirestore();

    if (sessionDate) {
      // Get primer for specific session
      const snapshot = await db.collection('preSessionPrimers')
        .doc(userId)
        .collection('primers')
        .where('sessionDate', '==', sessionDate)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return NextResponse.json({ primer: null });
      }

      return NextResponse.json({ primer: snapshot.docs[0].data() });
    }

    // Get recent primers
    const snapshot = await db.collection('preSessionPrimers')
      .doc(userId)
      .collection('primers')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const primers = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ primers });
  } catch (error) {
    log.error('Get primers error', {}, error);
    return NextResponse.json({ primers: [] });
  }
}
