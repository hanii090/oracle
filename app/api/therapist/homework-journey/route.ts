import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Homework Journey Generator API
 * Creates a 7-day conversational journey from a topic
 * 
 * POST /api/therapist/homework-journey - Generate journey plan
 * POST /api/therapist/homework-journey (with assign: true) - Generate and assign
 */

const generateJourneySchema = z.object({
  topic: z.string().min(1).max(500),
  clientId: z.string().optional(),
  durationDays: z.number().int().min(3).max(14).default(7),
  clientContext: z.string().max(1000).optional(),
  templateId: z.string().optional(),
  assign: z.boolean().default(false),
});

const JOURNEY_PROMPT = `You are creating a 7-day conversational homework journey for therapy. The therapist has assigned this topic for their client to explore.

Topic: {topic}
Duration: {days} days
Client Context: {context}

Create a warm, conversational journey that feels like a supportive friend checking in, not a clinical assessment. Each day should build on the previous.

Return JSON with this exact structure:
{
  "journeyPlan": {
    "day1": {
      "theme": "Brief theme for the day",
      "question": "The main check-in question (warm, conversational)",
      "followUp": "A follow-up prompt if they share something significant",
      "grounding": "A brief grounding exercise if they're struggling (optional)"
    },
    "day2": { ... },
    ...
  },
  "openingMessage": "A warm message to start the journey (1-2 sentences)",
  "closingMessage": "A reflective closing message for the final day"
}

Guidelines:
- Day 1: Gentle introduction, notice without judgment
- Days 2-4: Deepen awareness, explore patterns
- Days 5-6: Reflect on insights, try small experiments
- Day 7: Celebrate progress, look forward

Keep questions conversational, not clinical. Vary the tone. Be warm but not saccharine.`;

interface JourneyDay {
  theme: string;
  question: string;
  followUp: string;
  grounding?: string;
}

interface JourneyPlan {
  journeyPlan: Record<string, JourneyDay>;
  openingMessage: string;
  closingMessage: string;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/homework-journey', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = generateJourneySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { topic, clientId, durationDays, clientContext, templateId, assign } = parsed.data;

    // Generate the journey using AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = JOURNEY_PROMPT
      .replace('{topic}', topic)
      .replace('{days}', String(durationDays))
      .replace('{context}', clientContext || 'No specific context provided');

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    let journeyPlan: JourneyPlan;
    try {
      const responseText = result.text || '';
      journeyPlan = JSON.parse(responseText);
    } catch {
      log.error('Failed to parse journey plan', { responseText: result.text });
      return NextResponse.json({ error: 'Failed to generate journey plan' }, { status: 500 });
    }

    // If not assigning, just return the preview
    if (!assign || !clientId) {
      return NextResponse.json({
        preview: true,
        topic,
        durationDays,
        journeyPlan: journeyPlan.journeyPlan,
        openingMessage: journeyPlan.openingMessage,
        closingMessage: journeyPlan.closingMessage,
      });
    }

    // Verify therapist has consent for this client
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    const consent = consentSnapshot.docs[0].data();
    if (!consent.permissions?.shareHomeworkProgress) {
      return NextResponse.json({ error: 'Client has not consented to homework sharing' }, { status: 403 });
    }

    // Create the homework assignment with journey plan
    const assignmentId = crypto.randomUUID();
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const assignment = {
      id: assignmentId,
      patientId: clientId,
      therapistId,
      topic: sanitizeMessage(topic),
      description: journeyPlan.openingMessage,
      durationDays,
      assignedBy: 'therapist',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      journeyPlan: journeyPlan.journeyPlan,
      openingMessage: journeyPlan.openingMessage,
      closingMessage: journeyPlan.closingMessage,
      checkIns: [],
      completedDays: 0,
      status: 'active',
      templateId: templateId || null,
      createdAt: now.toISOString(),
    };

    await db.collection('homeworkAssignments').doc(assignmentId).set(assignment);

    log.info('Homework journey assigned', { therapistId, clientId, assignmentId, durationDays });

    return NextResponse.json({
      assigned: true,
      assignment: {
        id: assignmentId,
        topic: assignment.topic,
        durationDays,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      },
      journeyPlan: journeyPlan.journeyPlan,
      openingMessage: journeyPlan.openingMessage,
    });
  } catch (error) {
    log.error('Homework journey error', {}, error);
    return NextResponse.json({ error: 'Failed to generate homework journey' }, { status: 500 });
  }
}
