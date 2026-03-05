import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Session Scheduling API
 * Allows therapists to schedule sessions for their clients
 * 
 * POST /api/therapist/schedule-session
 */

const scheduleSchema = z.object({
  clientId: z.string(),
  nextSessionDate: z.string(),
  sessionDay: z.string().nullable().optional(),
  sessionTime: z.string().optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/schedule-session', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, nextSessionDate, sessionDay, sessionTime } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist has consent for this client
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    // Update or create therapy profile
    const profileRef = db.collection('therapyProfiles').doc(clientId);
    const profileDoc = await profileRef.get();

    const updateData: Record<string, unknown> = {
      nextSessionDate,
      updatedAt: new Date().toISOString(),
    };

    if (sessionDay) {
      updateData.sessionDay = sessionDay;
    }

    if (sessionTime) {
      updateData.sessionTime = sessionTime;
    }

    if (profileDoc.exists) {
      await profileRef.update(updateData);
    } else {
      await profileRef.set({
        ...updateData,
        patientId: clientId,
        therapistId,
        isInTherapy: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Also update the consent record with session info
    const consentRef = consentSnapshot.docs[0].ref;
    await consentRef.update({
      nextSessionDate,
      sessionDay: sessionDay || null,
      updatedAt: new Date().toISOString(),
    });

    log.info('Session scheduled', { therapistId, clientId, nextSessionDate });

    return NextResponse.json({
      success: true,
      nextSessionDate,
      sessionDay,
    });
  } catch (error) {
    log.error('Schedule session error', {}, error);
    return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 });
  }
}
