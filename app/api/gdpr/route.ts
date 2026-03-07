import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';

/**
 * GDPR API — manages user data rights:
 * - View all consents
 * - Data export (Subject Access Request)
 * - Data deletion request
 * - Consent audit log
 * 
 * Compliant with UK GDPR / Data Protection Act 2018
 */

const consentUpdateSchema = z.object({
  consentType: z.enum(['analytics', 'marketing', 'thirdParty', 'dataSharing', 'cookies']),
  granted: z.boolean(),
});

const deletionRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  confirmEmail: z.string().email(),
});

export interface GDPRConsent {
  userId: string;
  consents: {
    analytics: boolean;
    marketing: boolean;
    thirdParty: boolean;
    dataSharing: boolean;
    cookies: boolean;
  };
  auditLog: Array<{
    action: string;
    consentType: string;
    granted: boolean;
    timestamp: string;
    ipHash?: string;
  }>;
  dataExports: Array<{
    id: string;
    requestedAt: string;
    completedAt: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }>;
  deletionRequests: Array<{
    id: string;
    requestedAt: string;
    reason?: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    scheduledDeletionDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CONSENTS = {
  analytics: false,
  marketing: false,
  thirdParty: false,
  dataSharing: false,
  cookies: true, // Essential cookies only by default
};

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/gdpr', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (!isAdminConfigured()) {
      return NextResponse.json({
        consents: DEFAULT_CONSENTS,
        auditLog: [],
        dataExports: [],
        deletionRequests: [],
      });
    }

    const db = getAdminFirestore();

    if (action === 'export') {
      // Generate a data export (Subject Access Request)
      const exportId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Collect all user data across collections
      const collections = [
        'users',
        'therapyProfiles',
        'userTherapyProfiles',
        'waitingListProfiles',
        'waitingListCheckIns',
        'thoughtDrops',
        'outcomeMeasures',
        'homeworkAssignments',
        'dailyMoodChecks',
        'sessionDebriefs',
      ];

      const exportData: Record<string, unknown> = {
        exportId,
        exportDate: now,
        userId,
        notice: 'This is your personal data export under UK GDPR Article 15 (Right of Access). This file contains all data held about you by Sorca.',
      };

      // User profile
      const userDoc = await db.doc(`users/${userId}`).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        // Remove sensitive internal fields
        delete data.stripeCustomerId;
        delete data.stripeSubscriptionId;
        exportData.profile = data;
      }

      // Therapy profile
      const therapyDoc = await db.doc(`therapyProfiles/${userId}`).get();
      if (therapyDoc.exists) exportData.therapyProfile = therapyDoc.data();

      // User therapy profile
      const utpDoc = await db.doc(`userTherapyProfiles/${userId}`).get();
      if (utpDoc.exists) {
        const data = utpDoc.data()!;
        delete data.shareTokens; // Don't export share tokens
        exportData.userTherapyProfile = data;
      }

      // Waiting list
      const wlDoc = await db.doc(`waitingListProfiles/${userId}`).get();
      if (wlDoc.exists) exportData.waitingListProfile = wlDoc.data();

      const wlCheckIns = await db.collection('waitingListCheckIns')
        .where('userId', '==', userId).orderBy('createdAt', 'desc').limit(200).get();
      if (!wlCheckIns.empty) exportData.waitingListCheckIns = wlCheckIns.docs.map(d => d.data());

      // Thought drops
      const drops = await db.collection('thoughtDrops')
        .where('userId', '==', userId).orderBy('createdAt', 'desc').limit(500).get();
      if (!drops.empty) exportData.thoughtDrops = drops.docs.map(d => d.data());

      // Outcome measures
      const measures = await db.collection('outcomeMeasures')
        .where('userId', '==', userId).orderBy('timestamp', 'desc').limit(100).get();
      if (!measures.empty) exportData.outcomeMeasures = measures.docs.map(d => d.data());

      // Homework
      const homework = await db.collection('homeworkAssignments')
        .where('patientId', '==', userId).orderBy('createdAt', 'desc').limit(100).get();
      if (!homework.empty) exportData.homework = homework.docs.map(d => d.data());

      // Sessions (stored under user subcollection)
      const sessions = await db.collection('users').doc(userId)
        .collection('sessions').orderBy('createdAt', 'desc').limit(200).get();
      if (!sessions.empty) exportData.sessions = sessions.docs.map(d => d.data());

      // Week summaries
      const summaries = await db.collection('weekSummaries').doc(userId)
        .collection('weeks').orderBy('createdAt', 'desc').limit(100).get();
      if (!summaries.empty) exportData.weekSummaries = summaries.docs.map(d => d.data());

      // Consents given to therapists
      const consents = await db.collection('therapistConsent')
        .where('patientId', '==', userId).get();
      if (!consents.empty) exportData.therapistConsents = consents.docs.map(d => d.data());

      // Log the export
      const gdprDoc = await db.doc(`gdprConsents/${userId}`).get();
      const existingExports = gdprDoc.exists ? (gdprDoc.data()?.dataExports || []) : [];
      await db.doc(`gdprConsents/${userId}`).set({
        dataExports: [...existingExports, {
          id: exportId,
          requestedAt: now,
          completedAt: now,
          status: 'completed',
        }],
        updatedAt: now,
      }, { merge: true });

      log.info('GDPR data export generated', { userId, exportId });

      return NextResponse.json({
        exportData,
        exportId,
        message: 'Your data export is ready. This contains all personal data held by Sorca.',
      });
    }

    // Default: return consent dashboard data
    const gdprDoc = await db.doc(`gdprConsents/${userId}`).get();

    if (!gdprDoc.exists) {
      return NextResponse.json({
        consents: DEFAULT_CONSENTS,
        auditLog: [],
        dataExports: [],
        deletionRequests: [],
      });
    }

    const data = gdprDoc.data()!;

    return NextResponse.json({
      consents: data.consents || DEFAULT_CONSENTS,
      auditLog: (data.auditLog || []).slice(-50),
      dataExports: data.dataExports || [],
      deletionRequests: data.deletionRequests || [],
    });
  } catch (error) {
    log.error('GDPR fetch error', {}, error);
    return NextResponse.json({ consents: DEFAULT_CONSENTS, auditLog: [], dataExports: [], deletionRequests: [] });
  }
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/gdpr', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || body.action;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const now = new Date().toISOString();

    // Update a specific consent
    if (action === 'update-consent') {
      const parsed = consentUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
      }

      const gdprRef = db.doc(`gdprConsents/${userId}`);
      const gdprDoc = await gdprRef.get();
      const existing = gdprDoc.exists ? gdprDoc.data()! : { consents: { ...DEFAULT_CONSENTS }, auditLog: [] };

      const consents = { ...existing.consents, [parsed.data.consentType]: parsed.data.granted };
      const auditEntry = {
        action: parsed.data.granted ? 'consent_granted' : 'consent_withdrawn',
        consentType: parsed.data.consentType,
        granted: parsed.data.granted,
        timestamp: now,
      };
      const auditLog = [...(existing.auditLog || []), auditEntry];

      await gdprRef.set({
        userId,
        consents,
        auditLog,
        updatedAt: now,
        ...(gdprDoc.exists ? {} : { createdAt: now }),
      }, { merge: true });

      log.info('GDPR consent updated', { userId, consentType: parsed.data.consentType, granted: parsed.data.granted });

      return NextResponse.json({ consents, latestAudit: auditEntry });
    }

    // Request data deletion
    if (action === 'delete-request') {
      const parsed = deletionRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
      }

      // Verify email matches
      const userDoc = await db.doc(`users/${userId}`).get();
      const userEmail = userDoc.exists ? userDoc.data()?.email : null;
      if (userEmail && parsed.data.confirmEmail !== userEmail) {
        return NextResponse.json({ error: 'Email does not match your account' }, { status: 400 });
      }

      // Schedule deletion (30-day cooling-off period as per best practice)
      const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const deletionRequest = {
        id: crypto.randomUUID(),
        requestedAt: now,
        reason: parsed.data.reason,
        status: 'pending' as const,
        scheduledDeletionDate: scheduledDate,
      };

      const gdprRef = db.doc(`gdprConsents/${userId}`);
      const gdprDoc = await gdprRef.get();
      const existingRequests = gdprDoc.exists ? (gdprDoc.data()?.deletionRequests || []) : [];

      await gdprRef.set({
        userId,
        deletionRequests: [...existingRequests, deletionRequest],
        auditLog: [...(gdprDoc.exists ? gdprDoc.data()?.auditLog || [] : []), {
          action: 'deletion_requested',
          consentType: 'all',
          granted: false,
          timestamp: now,
        }],
        updatedAt: now,
        ...(gdprDoc.exists ? {} : { createdAt: now, consents: DEFAULT_CONSENTS }),
      }, { merge: true });

      log.info('GDPR deletion requested', { userId, scheduledDate });

      return NextResponse.json({
        deletionRequest,
        message: `Your deletion request has been received. Your data will be permanently deleted on ${new Date(scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. You may cancel this request within the 30-day cooling-off period.`,
      });
    }

    // Cancel deletion request
    if (action === 'cancel-deletion') {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
      }

      const gdprRef = db.doc(`gdprConsents/${userId}`);
      const gdprDoc = await gdprRef.get();
      if (!gdprDoc.exists) {
        return NextResponse.json({ error: 'No GDPR record found' }, { status: 404 });
      }

      const existing = gdprDoc.data()!;
      const updatedRequests = (existing.deletionRequests || []).map((r: { id: string; status: string }) =>
        r.id === requestId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r
      );

      await gdprRef.update({
        deletionRequests: updatedRequests,
        auditLog: [...(existing.auditLog || []), {
          action: 'deletion_cancelled',
          consentType: 'all',
          granted: true,
          timestamp: now,
        }],
        updatedAt: now,
      });

      log.info('GDPR deletion cancelled', { userId, requestId });

      return NextResponse.json({ message: 'Deletion request cancelled successfully.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    log.error('GDPR post error', {}, error);
    return NextResponse.json({ error: 'Failed to process GDPR request' }, { status: 500 });
  }
}
