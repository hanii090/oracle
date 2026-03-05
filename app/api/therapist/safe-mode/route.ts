import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Safe Mode API — allows therapists to toggle safe mode for high-risk clients
 * When enabled, Sorca limits depth, shows grounding prompts, and avoids escalation
 * 
 * POST /api/therapist/safe-mode
 */

const toggleSafeModeSchema = z.object({
  clientId: z.string(),
  enabled: z.boolean(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/safe-mode', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = toggleSafeModeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, enabled, reason } = parsed.data;

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
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    const consentDoc = consentSnapshot.docs[0];
    const now = new Date().toISOString();

    // Update consent record with safe mode setting
    await consentDoc.ref.update({
      safeMode: enabled,
      safeModeUpdatedAt: now,
      safeModeReason: reason || null,
    });

    // Also update the client's therapy profile if it exists
    const therapyProfileRef = db.collection('therapyProfiles').doc(clientId);
    const therapyProfileDoc = await therapyProfileRef.get();
    
    if (therapyProfileDoc.exists) {
      await therapyProfileRef.update({
        safeMode: enabled,
        updatedAt: now,
      });
    }

    // Log the change for audit
    await db.collection('safeModeAuditLog').add({
      therapistId,
      clientId,
      action: enabled ? 'enabled' : 'disabled',
      reason: reason || null,
      timestamp: now,
    });

    log.info('Safe mode toggled', { therapistId, clientId, enabled });

    return NextResponse.json({
      success: true,
      safeMode: enabled,
      message: enabled 
        ? 'Safe mode enabled. Client sessions will be limited to grounding and support.'
        : 'Safe mode disabled. Client can access full session depth.',
    });
  } catch (error) {
    log.error('Safe mode toggle error', {}, error);
    return NextResponse.json({ error: 'Failed to update safe mode' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/safe-mode', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ safeMode: false });
    }

    const db = getAdminFirestore();

    // Check if user is the client themselves or a therapist with consent
    const therapyProfileDoc = await db.collection('therapyProfiles').doc(clientId).get();
    
    if (clientId === userId) {
      // User checking their own safe mode status
      const safeMode = therapyProfileDoc.exists ? therapyProfileDoc.data()?.safeMode || false : false;
      return NextResponse.json({ safeMode });
    }

    // Therapist checking client's safe mode
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', userId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No consent for this client' }, { status: 403 });
    }

    const consent = consentSnapshot.docs[0].data();
    return NextResponse.json({ 
      safeMode: consent.safeMode || false,
      safeModeReason: consent.safeModeReason || null,
      safeModeUpdatedAt: consent.safeModeUpdatedAt || null,
    });
  } catch (error) {
    log.error('Get safe mode error', {}, error);
    return NextResponse.json({ safeMode: false });
  }
}
