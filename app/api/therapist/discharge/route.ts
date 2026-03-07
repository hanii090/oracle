import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

const dischargeSchema = z.object({
  clientId: z.string(),
  reason: z.enum(['completed', 'terminated', 'transferred', 'other']).default('completed'),
  notes: z.string().max(2000).optional(),
  includeFullHistory: z.boolean().default(true),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/discharge', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = dischargeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, reason, notes, includeFullHistory } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist has active consent for this client
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No active consent found for this client' }, { status: 403 });
    }

    const consentDoc = consentSnapshot.docs[0];
    const consent = consentDoc.data();

    // Get client info
    const clientDoc = await db.collection('users').doc(clientId).get();
    const clientName = clientDoc.exists ? clientDoc.data()?.displayName || 'Client' : 'Client';

    // Build discharge archive
    const archive: Record<string, unknown> = {
      id: crypto.randomUUID(),
      therapistId,
      clientId,
      clientName,
      reason,
      notes: notes || null,
      consentGrantedAt: consent.grantedAt,
      dischargedAt: new Date().toISOString(),
      permissions: consent.permissions,
    };

    if (includeFullHistory) {
      // Get all homework assignments — wrapped in try/catch for index resilience
      try {
        const homeworkSnapshot = await db.collection('homeworkAssignments')
          .where('patientId', '==', clientId)
          .where('therapistId', '==', therapistId)
          .orderBy('createdAt', 'asc')
          .get();

        archive.homeworkHistory = homeworkSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id,
            topic: data.topic,
            assignedAt: data.createdAt,
            completedDays: data.completedDays,
            durationDays: data.durationDays,
            status: data.status,
          };
        });
      } catch (e) {
        log.error('Failed to fetch homework for archive — index may be missing', {}, e);
        archive.homeworkHistory = [];
      }

      // Get all week summaries (if consented)
      if (consent.permissions?.shareWeekSummary) {
        try {
          const summariesSnapshot = await db.collection('weekSummaries')
            .doc(clientId)
            .collection('weeks')
            .orderBy('createdAt', 'asc')
            .get();

          archive.weekSummaries = summariesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              weekOf: data.createdAt,
              themes: data.themes,
              moodTrend: data.moodTrend,
            };
          });
        } catch (e) {
          log.error('Failed to fetch week summaries for archive', {}, e);
          archive.weekSummaries = [];
        }
      }

      // Get pattern alerts
      if (consent.permissions?.sharePatternAlerts) {
        try {
          const alertsSnapshot = await db.collection('patternAlerts')
            .where('clientId', '==', clientId)
            .where('therapistId', '==', therapistId)
            .orderBy('createdAt', 'asc')
            .get();

          archive.patternAlerts = alertsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              type: data.type,
              message: data.message,
              severity: data.severity,
              createdAt: data.createdAt,
              acknowledged: data.acknowledged,
            };
          });
        } catch (e) {
          log.error('Failed to fetch pattern alerts for archive — index may be missing', {}, e);
          archive.patternAlerts = [];
        }
      }

      // Calculate therapy duration
      const startDate = new Date(consent.grantedAt);
      const endDate = new Date();
      const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      archive.therapyDurationDays = durationDays;

      // Calculate homework completion rate
      if (Array.isArray(archive.homeworkHistory) && archive.homeworkHistory.length > 0) {
        const totalDays = (archive.homeworkHistory as Array<{durationDays?: number}>).reduce((sum, h) => sum + (h.durationDays || 7), 0);
        const completedDays = (archive.homeworkHistory as Array<{completedDays?: number}>).reduce((sum, h) => sum + (h.completedDays || 0), 0);
        archive.overallHomeworkCompletionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
      }
    }

    // Save discharge archive
    await db.collection('dischargeArchives').doc(archive.id as string).set(archive);

    // Update consent status to discharged
    await consentDoc.ref.update({
      status: 'discharged',
      dischargedAt: new Date().toISOString(),
      dischargeReason: reason,
    });

    // Log audit event
    await db.collection('auditLog').add({
      action: 'client_discharged',
      therapistId,
      clientId,
      archiveId: archive.id,
      reason,
      timestamp: new Date().toISOString(),
    });

    log.info('Client discharged', { therapistId, clientId, archiveId: archive.id });

    return NextResponse.json({
      success: true,
      archiveId: archive.id,
      message: `${clientName} has been discharged. Archive created.`,
    });
  } catch (error) {
    log.error('Discharge error', {}, error);
    return NextResponse.json({ error: 'Failed to discharge client' }, { status: 500 });
  }
}

// GET: Retrieve discharge archives for therapist
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/discharge', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ archives: [] });
    }

    const db = getAdminFirestore();

    const url = new URL(req.url);
    const archiveId = url.searchParams.get('archiveId');

    if (archiveId) {
      // Get specific archive
      const archiveDoc = await db.collection('dischargeArchives').doc(archiveId).get();
      if (!archiveDoc.exists) {
        return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
      }

      const archive = archiveDoc.data();
      if (archive?.therapistId !== therapistId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ archive });
    }

    // Get all archives for therapist
    const archivesSnapshot = await db.collection('dischargeArchives')
      .where('therapistId', '==', therapistId)
      .orderBy('dischargedAt', 'desc')
      .limit(50)
      .get();

    const archives = archivesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        clientName: data.clientName,
        reason: data.reason,
        dischargedAt: data.dischargedAt,
        therapyDurationDays: data.therapyDurationDays,
      };
    });

    return NextResponse.json({ archives });
  } catch (error) {
    log.error('Get discharge archives error', {}, error);
    return NextResponse.json({ archives: [] });
  }
}
