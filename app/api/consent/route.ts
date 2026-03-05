import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const grantConsentSchema = z.object({
  therapistId: z.string(),
  therapistEmail: z.string().email().optional(),
  permissions: z.object({
    shareWeekSummary: z.boolean().default(false),
    shareHomeworkProgress: z.boolean().default(false),
    sharePatternAlerts: z.boolean().default(false),
    shareMoodData: z.boolean().default(false),
  }),
});

const updateConsentSchema = z.object({
  consentId: z.string(),
  permissions: z.object({
    shareWeekSummary: z.boolean().optional(),
    shareHomeworkProgress: z.boolean().optional(),
    sharePatternAlerts: z.boolean().optional(),
    shareMoodData: z.boolean().optional(),
  }),
});

const revokeConsentSchema = z.object({
  consentId: z.string(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/consent', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();

    // Determine request type
    if (body.therapistId) {
      // Grant new consent
      const parsed = grantConsentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { therapistId, therapistEmail, permissions } = parsed.data;

      if (!isAdminConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
      }

      const db = getAdminFirestore();

      // Check therapist's current client count for tier limits
      const therapistDoc = await db.collection('users').doc(therapistId).get();
      const therapistData = therapistDoc.exists ? therapistDoc.data() : null;
      const therapistTier = therapistData?.tier || 'free';

      // Practice tier has 10 client limit
      if (therapistTier === 'practice') {
        const existingConsents = await db.collection('therapistConsent')
          .where('therapistId', '==', therapistId)
          .where('status', '==', 'active')
          .get();

        const CLIENT_LIMIT = 10;
        if (existingConsents.size >= CLIENT_LIMIT) {
          return NextResponse.json(
            { error: `Practice tier is limited to ${CLIENT_LIMIT} clients. Please upgrade or discharge a client.` },
            { status: 403 }
          );
        }
      }

      const consentId = crypto.randomUUID();
      const now = new Date().toISOString();

      const consent = {
        id: consentId,
        patientId: userId,
        therapistId,
        therapistEmail: therapistEmail || null,
        permissions,
        status: 'active',
        grantedAt: now,
        updatedAt: now,
        revokedAt: null,
      };

      await db.collection('therapistConsent').doc(consentId).set(consent);

      // Log audit entry
      await db.collection('consentAuditLog').add({
        consentId,
        patientId: userId,
        therapistId,
        action: 'granted',
        permissions,
        timestamp: now,
      });

      log.info('Consent granted', { userId, therapistId, consentId });

      return NextResponse.json({ consent });
    } else if (body.consentId && body.permissions) {
      // Update consent permissions
      const parsed = updateConsentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { consentId, permissions } = parsed.data;

      if (!isAdminConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
      }

      const db = getAdminFirestore();
      const consentRef = db.collection('therapistConsent').doc(consentId);
      const consentDoc = await consentRef.get();

      if (!consentDoc.exists) {
        return NextResponse.json({ error: 'Consent not found' }, { status: 404 });
      }

      const consent = consentDoc.data();
      if (consent?.patientId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const now = new Date().toISOString();
      const updatedPermissions = { ...consent.permissions, ...permissions };

      await consentRef.update({
        permissions: updatedPermissions,
        updatedAt: now,
      });

      // Log audit entry
      await db.collection('consentAuditLog').add({
        consentId,
        patientId: userId,
        therapistId: consent.therapistId,
        action: 'updated',
        oldPermissions: consent.permissions,
        newPermissions: updatedPermissions,
        timestamp: now,
      });

      log.info('Consent updated', { userId, consentId });

      return NextResponse.json({ 
        consent: { ...consent, permissions: updatedPermissions, updatedAt: now }
      });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    log.error('Consent error', {}, error);
    return NextResponse.json({ error: 'Failed to process consent' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/consent', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = revokeConsentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { consentId } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const consentRef = db.collection('therapistConsent').doc(consentId);
    const consentDoc = await consentRef.get();

    if (!consentDoc.exists) {
      return NextResponse.json({ error: 'Consent not found' }, { status: 404 });
    }

    const consent = consentDoc.data();
    if (consent?.patientId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();

    await consentRef.update({
      status: 'revoked',
      revokedAt: now,
      updatedAt: now,
    });

    // Log audit entry
    await db.collection('consentAuditLog').add({
      consentId,
      patientId: userId,
      therapistId: consent.therapistId,
      action: 'revoked',
      timestamp: now,
    });

    log.info('Consent revoked', { userId, consentId });

    return NextResponse.json({ 
      success: true,
      message: 'Consent has been revoked. Your therapist can no longer access your data.'
    });
  } catch (error) {
    log.error('Revoke consent error', {}, error);
    return NextResponse.json({ error: 'Failed to revoke consent' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/consent', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ consents: [] });
    }

    const db = getAdminFirestore();
    const url = new URL(req.url);
    const asTherapist = url.searchParams.get('asTherapist') === 'true';

    let snapshot;
    if (asTherapist) {
      // Get consents where user is the therapist
      snapshot = await db.collection('therapistConsent')
        .where('therapistId', '==', userId)
        .where('status', '==', 'active')
        .get();
    } else {
      // Get consents where user is the patient
      snapshot = await db.collection('therapistConsent')
        .where('patientId', '==', userId)
        .get();
    }

    const consents = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ consents });
  } catch (error) {
    log.error('Get consents error', {}, error);
    return NextResponse.json({ consents: [] });
  }
}
