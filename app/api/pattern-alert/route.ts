import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const alertTypes = ['distress', 'pattern', 'milestone', 'mood_shift'] as const;
const severityLevels = ['low', 'medium', 'high'] as const;

const createAlertSchema = z.object({
  clientId: z.string(),
  type: z.enum(alertTypes),
  message: z.string().max(500),
  severity: z.enum(severityLevels).default('medium'),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateAlertSchema = z.object({
  alertId: z.string(),
  acknowledged: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/pattern-alert', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();

    // Check if this is an internal alert creation (from AI analysis)
    if (body.clientId) {
      const parsed = createAlertSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { clientId, type, message, severity, metadata } = parsed.data;

      if (!isAdminConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
      }

      const db = getAdminFirestore();

      // Verify therapist has consent with pattern alerts permission
      const consentSnapshot = await db.collection('therapistConsent')
        .where('patientId', '==', clientId)
        .where('status', '==', 'active')
        .get();

      if (consentSnapshot.empty) {
        return NextResponse.json({ error: 'No active consent' }, { status: 403 });
      }

      // Find therapists with pattern alert consent
      const therapistsToAlert = consentSnapshot.docs
        .map(doc => doc.data())
        .filter(consent => consent.permissions?.sharePatternAlerts)
        .map(consent => consent.therapistId);

      if (therapistsToAlert.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No therapists have pattern alert consent' 
        });
      }

      // Get client display name
      const userDoc = await db.collection('users').doc(clientId).get();
      const clientName = userDoc.exists ? userDoc.data()?.displayName || 'Client' : 'Client';

      // Create alerts for each consented therapist
      const alerts = await Promise.all(
        therapistsToAlert.map(async (therapistId) => {
          const alert = {
            id: crypto.randomUUID(),
            clientId,
            clientName,
            therapistId,
            type,
            message,
            severity,
            metadata: metadata || {},
            acknowledged: false,
            acknowledgedAt: null,
            notes: null,
            createdAt: new Date().toISOString(),
          };

          await db.collection('patternAlerts').doc(alert.id).set(alert);
          return alert;
        })
      );

      log.info('Pattern alerts created', { clientId, type, alertCount: alerts.length });

      return NextResponse.json({ alerts });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    log.error('Create pattern alert error', {}, error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const log = createLogger({ route: '/api/pattern-alert', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = updateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { alertId, acknowledged, notes } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const alertRef = db.collection('patternAlerts').doc(alertId);
    const alertDoc = await alertRef.get();

    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = alertDoc.data();
    if (alert?.therapistId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (acknowledged !== undefined) {
      updates.acknowledged = acknowledged;
      updates.acknowledgedAt = acknowledged ? new Date().toISOString() : null;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    await alertRef.update(updates);

    log.info('Pattern alert updated', { alertId, updates });

    return NextResponse.json({ alert: { ...alert, ...updates } });
  } catch (error) {
    log.error('Update pattern alert error', {}, error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/pattern-alert', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ alerts: [], unreadCount: 0 });
    }

    const db = getAdminFirestore();
    const url = new URL(req.url);
    const onlyUnread = url.searchParams.get('unread') === 'true';
    const clientId = url.searchParams.get('clientId');

    let query = db.collection('patternAlerts')
      .where('therapistId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (onlyUnread) {
      query = db.collection('patternAlerts')
        .where('therapistId', '==', userId)
        .where('acknowledged', '==', false)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(50).get();
    let alerts = snapshot.docs.map(doc => doc.data());

    if (clientId) {
      alerts = alerts.filter(a => a.clientId === clientId);
    }

    const unreadCount = alerts.filter(a => !a.acknowledged).length;

    return NextResponse.json({ alerts, unreadCount });
  } catch (error) {
    log.error('Get pattern alerts error', {}, error);
    return NextResponse.json({ alerts: [], unreadCount: 0 });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/pattern-alert', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'Missing alertId' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const alertRef = db.collection('patternAlerts').doc(alertId);
    const alertDoc = await alertRef.get();

    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = alertDoc.data();
    if (alert?.therapistId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await alertRef.delete();

    log.info('Pattern alert deleted', { alertId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Delete pattern alert error', {}, error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
