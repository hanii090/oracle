import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const createHomeworkSchema = z.object({
  topic: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
  durationDays: z.number().int().min(1).max(14).default(7),
  assignedBy: z.enum(['self', 'therapist']).default('self'),
  therapistId: z.string().optional(),
});

const checkInSchema = z.object({
  assignmentId: z.string(),
  response: z.string().min(1).max(2000),
  dayNumber: z.number().int().min(1).max(14),
});

const HOMEWORK_QUESTION_PROMPT = `
You are Sorca helping with therapy homework. The user is tracking a specific pattern or behavior their therapist asked them to notice.

Topic they're tracking: "{topic}"
Day {day} of {totalDays}

Generate ONE gentle, conversational check-in question for today. It should:
- Be warm but not saccharine
- Reference the specific topic naturally
- Be answerable in a sentence or two
- Not feel like a clinical assessment
- Vary from previous days' questions

Examples of good check-in questions:
- "Did that thing you've been watching for show up today?"
- "Any moments today where you noticed the pattern?"
- "How did today compare to yesterday with [topic]?"

Return ONLY the question, no preamble.
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/homework', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    
    // Determine if this is a create or check-in request
    if (body.topic) {
      // Create new homework assignment
      const parsed = createHomeworkSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { topic, description, durationDays, assignedBy, therapistId } = parsed.data;

      const assignment = {
        id: crypto.randomUUID(),
        patientId: userId,
        therapistId: therapistId || null,
        topic: sanitizeMessage(topic),
        description: description ? sanitizeMessage(description) : null,
        durationDays,
        assignedBy,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        checkIns: [],
        completedDays: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      if (isAdminConfigured()) {
        const db = getAdminFirestore();
        await db.collection('homeworkAssignments').doc(assignment.id).set(assignment);
      }

      log.info('Homework assignment created', { userId, assignmentId: assignment.id });

      return NextResponse.json({ assignment });
    } else if (body.assignmentId) {
      // Check-in response
      const parsed = checkInSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { assignmentId, response, dayNumber } = parsed.data;

      if (!isAdminConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
      }

      const db = getAdminFirestore();
      const assignmentRef = db.collection('homeworkAssignments').doc(assignmentId);
      const assignmentDoc = await assignmentRef.get();

      if (!assignmentDoc.exists) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      const assignment = assignmentDoc.data();
      if (assignment?.patientId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const checkIn = {
        dayNumber,
        response: sanitizeMessage(response),
        timestamp: new Date().toISOString(),
      };

      await assignmentRef.update({
        checkIns: [...(assignment.checkIns || []), checkIn],
        completedDays: (assignment.completedDays || 0) + 1,
        status: dayNumber >= assignment.durationDays ? 'completed' : 'active',
      });

      log.info('Homework check-in recorded', { userId, assignmentId, dayNumber });

      return NextResponse.json({ success: true, checkIn });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    log.error('Homework API error', {}, error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/homework', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const assignmentId = url.searchParams.get('id');
    const generateQuestion = url.searchParams.get('question') === 'true';

    if (!isAdminConfigured()) {
      return NextResponse.json({ assignments: [] });
    }

    const db = getAdminFirestore();

    if (assignmentId) {
      // Get specific assignment
      const doc = await db.collection('homeworkAssignments').doc(assignmentId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      const assignment = doc.data();
      if (assignment?.patientId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Generate today's check-in question if requested
      if (generateQuestion) {
        const dayNumber = (assignment.completedDays || 0) + 1;
        
        if (dayNumber > assignment.durationDays) {
          return NextResponse.json({ 
            assignment, 
            question: null, 
            completed: true 
          });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ 
            assignment, 
            question: "Did you notice the pattern today?" 
          });
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = HOMEWORK_QUESTION_PROMPT
          .replace('{topic}', assignment.topic)
          .replace('{day}', String(dayNumber))
          .replace('{totalDays}', String(assignment.durationDays));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.8, maxOutputTokens: 100 },
        });

        const question = response.text?.trim() || "Did you notice the pattern today?";

        return NextResponse.json({ assignment, question, dayNumber });
      }

      return NextResponse.json({ assignment });
    }

    // Get all active assignments for user
    const snapshot = await db.collection('homeworkAssignments')
      .where('patientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const assignments = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ assignments });
  } catch (error) {
    log.error('Get homework error', {}, error);
    return NextResponse.json({ assignments: [] });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/homework', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const assignmentId = url.searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const doc = await db.collection('homeworkAssignments').doc(assignmentId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = doc.data();
    if (assignment?.patientId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.collection('homeworkAssignments').doc(assignmentId).delete();

    log.info('Homework assignment deleted', { userId, assignmentId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Delete homework error', {}, error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
