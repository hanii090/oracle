import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';

/**
 * GET /api/therapist/voice-sessions — Fetch voice sessions for a therapist's client.
 * 
 * Query params: ?clientId=xxx&limit=20
 * Requires: therapist auth + client consent for data sharing
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/voice-sessions', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const limitParam = parseInt(url.searchParams.get('limit') || '20');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // ── Verify therapist-client relationship & consent ──────────
    const consentSnap = await db.collection('consents')
      .where('clientId', '==', clientId)
      .where('therapistId', '==', therapistId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnap.empty) {
      return NextResponse.json(
        { error: 'No active consent found for this client. They must grant data sharing permission.' },
        { status: 403 }
      );
    }

    // ── Fetch client name ──────────────────────────────────────
    const clientDoc = await db.collection('users').doc(clientId).get();
    const clientName = clientDoc.data()?.displayName || 'Client';

    // ── Fetch voice sessions ───────────────────────────────────
    const sessionsSnap = await db.collection('voiceSessions')
      .where('userId', '==', clientId)
      .orderBy('endedAt', 'desc')
      .limit(limitParam)
      .get();

    const sessions = sessionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    log.info('Voice sessions fetched for therapist review', {
      therapistId,
      clientId,
      sessionCount: sessions.length,
    });

    return NextResponse.json({
      sessions,
      clientName,
      total: sessions.length,
    });

  } catch (err: unknown) {
    log.error('Therapist voice sessions error', {}, err);
    return NextResponse.json({ error: 'Failed to fetch voice sessions.' }, { status: 500 });
  }
}
