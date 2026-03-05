import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const assignHomeworkSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
  durationDays: z.number().int().min(1).max(14).default(7),
  customQuestions: z.array(z.string().max(500)).max(7).optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/assign-homework', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = assignHomeworkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, topic, description, durationDays, customQuestions } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify user is a therapist
    const userDoc = await db.collection('users').doc(therapistId).get();
    const userData = userDoc.data();
    if (!userData || (userData.role !== 'therapist' && userData.tier !== 'practice')) {
      return NextResponse.json({ error: 'Unauthorized - therapist role required' }, { status: 403 });
    }

    // Verify therapist has consent to assign homework to this client
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json(
        { error: 'No active consent found for this client' },
        { status: 403 }
      );
    }

    const consent = consentSnapshot.docs[0].data();
    if (!consent.permissions?.shareHomeworkProgress) {
      return NextResponse.json(
        { error: 'Client has not consented to homework sharing' },
        { status: 403 }
      );
    }

    // Create homework assignment
    const assignment = {
      id: crypto.randomUUID(),
      patientId: clientId,
      therapistId,
      topic: sanitizeMessage(topic),
      description: description ? sanitizeMessage(description) : null,
      durationDays,
      customQuestions: customQuestions?.map(q => sanitizeMessage(q)) || null,
      assignedBy: 'therapist',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      checkIns: [],
      completedDays: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await db.collection('homeworkAssignments').doc(assignment.id).set(assignment);

    log.info('Homework assigned by therapist', { therapistId, clientId, assignmentId: assignment.id });

    return NextResponse.json({ assignment });
  } catch (error) {
    log.error('Assign homework error', {}, error);
    return NextResponse.json({ error: 'Failed to assign homework' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/assign-homework', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!isAdminConfigured()) {
      return NextResponse.json({ assignments: [] });
    }

    const db = getAdminFirestore();

    let query = db.collection('homeworkAssignments')
      .where('therapistId', '==', therapistId)
      .orderBy('createdAt', 'desc');

    if (clientId) {
      query = db.collection('homeworkAssignments')
        .where('therapistId', '==', therapistId)
        .where('patientId', '==', clientId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(50).get();
    const assignments = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ assignments });
  } catch (error) {
    log.error('Get therapist homework error', {}, error);
    return NextResponse.json({ assignments: [] });
  }
}
