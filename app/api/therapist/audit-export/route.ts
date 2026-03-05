import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Audit Export API — generates compliance reports for therapists
 * Includes consent history, session counts, alerts, and safe mode changes
 * 
 * GET /api/therapist/audit-export?clientId=xxx&format=json|csv
 */

const querySchema = z.object({
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

interface AuditEntry {
  timestamp: string;
  type: string;
  action: string;
  details: Record<string, unknown>;
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/audit-export', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const url = new URL(req.url);
    const params = {
      clientId: url.searchParams.get('clientId') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      format: url.searchParams.get('format') || 'json',
    };

    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, startDate, endDate, format } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist role
    const therapistDoc = await db.collection('users').doc(therapistId).get();
    if (!therapistDoc.exists || therapistDoc.data()?.role !== 'therapist') {
      return NextResponse.json({ error: 'Therapist access required' }, { status: 403 });
    }

    // Get all consented clients or specific client
    let clientIds: string[] = [];
    
    if (clientId) {
      // Verify consent for specific client
      const consentSnapshot = await db.collection('therapistConsent')
        .where('therapistId', '==', therapistId)
        .where('patientId', '==', clientId)
        .limit(1)
        .get();

      if (consentSnapshot.empty) {
        return NextResponse.json({ error: 'No consent for this client' }, { status: 403 });
      }
      clientIds = [clientId];
    } else {
      // Get all consented clients
      const consentSnapshot = await db.collection('therapistConsent')
        .where('therapistId', '==', therapistId)
        .get();
      
      clientIds = consentSnapshot.docs.map(doc => doc.data().patientId);
    }

    if (clientIds.length === 0) {
      return NextResponse.json({ 
        auditLog: [],
        summary: { totalClients: 0, totalEntries: 0 },
        generatedAt: new Date().toISOString(),
      });
    }

    const auditEntries: AuditEntry[] = [];
    const dateFilter = (timestamp: string) => {
      if (startDate && timestamp < startDate) return false;
      if (endDate && timestamp > endDate) return false;
      return true;
    };

    // Gather audit data for each client
    for (const cId of clientIds) {
      // 1. Consent audit log
      const consentAuditSnapshot = await db.collection('consentAuditLog')
        .where('patientId', '==', cId)
        .where('therapistId', '==', therapistId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      for (const doc of consentAuditSnapshot.docs) {
        const data = doc.data();
        if (dateFilter(data.timestamp)) {
          auditEntries.push({
            timestamp: data.timestamp,
            type: 'consent',
            action: data.action,
            details: {
              clientId: cId,
              permissions: data.permissions || data.newPermissions,
              oldPermissions: data.oldPermissions,
            },
          });
        }
      }

      // 2. Safe mode audit log
      const safeModeSnapshot = await db.collection('safeModeAuditLog')
        .where('clientId', '==', cId)
        .where('therapistId', '==', therapistId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      for (const doc of safeModeSnapshot.docs) {
        const data = doc.data();
        if (dateFilter(data.timestamp)) {
          auditEntries.push({
            timestamp: data.timestamp,
            type: 'safeMode',
            action: data.action,
            details: {
              clientId: cId,
              reason: data.reason,
            },
          });
        }
      }

      // 3. Pattern alerts (crisis notifications)
      const alertsSnapshot = await db.collection('patternAlerts')
        .where('clientId', '==', cId)
        .where('therapistId', '==', therapistId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      for (const doc of alertsSnapshot.docs) {
        const data = doc.data();
        if (dateFilter(data.createdAt)) {
          auditEntries.push({
            timestamp: data.createdAt,
            type: 'alert',
            action: data.type,
            details: {
              clientId: cId,
              clientName: data.clientName,
              severity: data.severity,
              message: data.message,
              acknowledged: data.acknowledged,
              acknowledgedAt: data.acknowledgedAt,
            },
          });
        }
      }

      // 4. Homework assignments
      const homeworkSnapshot = await db.collection('homeworkAssignments')
        .where('patientId', '==', cId)
        .where('therapistId', '==', therapistId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      for (const doc of homeworkSnapshot.docs) {
        const data = doc.data();
        if (dateFilter(data.createdAt)) {
          auditEntries.push({
            timestamp: data.createdAt,
            type: 'homework',
            action: 'assigned',
            details: {
              clientId: cId,
              topic: data.topic,
              durationDays: data.durationDays,
              status: data.status,
              completedDays: data.completedDays,
            },
          });
        }
      }
    }

    // Sort by timestamp descending
    auditEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const summary = {
      totalClients: clientIds.length,
      totalEntries: auditEntries.length,
      consentEvents: auditEntries.filter(e => e.type === 'consent').length,
      safeModeEvents: auditEntries.filter(e => e.type === 'safeMode').length,
      alertEvents: auditEntries.filter(e => e.type === 'alert').length,
      homeworkEvents: auditEntries.filter(e => e.type === 'homework').length,
      dateRange: {
        start: startDate || 'all',
        end: endDate || 'all',
      },
    };

    log.info('Audit export generated', { therapistId, clientCount: clientIds.length, entryCount: auditEntries.length });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Timestamp', 'Type', 'Action', 'Client ID', 'Details'];
      const rows = auditEntries.map(entry => [
        entry.timestamp,
        entry.type,
        entry.action,
        (entry.details.clientId as string) || '',
        JSON.stringify(entry.details),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sorca-audit-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      auditLog: auditEntries,
      summary,
      generatedAt: new Date().toISOString(),
      therapistId,
      disclaimer: 'This audit log is generated for compliance purposes. Data is accurate as of the generation timestamp.',
    });
  } catch (error) {
    log.error('Audit export error', {}, error);
    return NextResponse.json({ error: 'Failed to generate audit export' }, { status: 500 });
  }
}
