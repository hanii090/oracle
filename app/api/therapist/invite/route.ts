import { NextResponse } from 'next/server';
import { verifyAuth, verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Client Invite API — allows therapists to invite clients via email
 * Creates a pending invite that the client can accept to grant consent
 * 
 * POST /api/therapist/invite - Create invite
 * GET /api/therapist/invite - List pending invites
 * DELETE /api/therapist/invite - Cancel invite
 */

const createInviteSchema = z.object({
  clientEmail: z.string().email(),
  clientName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  defaultPermissions: z.object({
    shareWeekSummary: z.boolean().default(true),
    shareHomeworkProgress: z.boolean().default(true),
    sharePatternAlerts: z.boolean().default(true),
    shareMoodData: z.boolean().default(false),
  }).optional(),
});

const cancelInviteSchema = z.object({
  inviteId: z.string(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/invite', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = createInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientEmail, clientName, message, defaultPermissions } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Get therapist data for invite
    const therapistDoc = await db.collection('users').doc(therapistId).get();
    const therapistData = therapistDoc.data();

    // Check client limit (10 for practice tier)
    const existingConsents = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('status', '==', 'active')
      .get();

    const pendingInvites = await db.collection('clientInvites')
      .where('therapistId', '==', therapistId)
      .where('status', '==', 'pending')
      .get();

    const totalClients = existingConsents.size + pendingInvites.size;
    const CLIENT_LIMIT = 10;

    if (totalClients >= CLIENT_LIMIT) {
      return NextResponse.json({
        error: `Practice tier is limited to ${CLIENT_LIMIT} clients. You have ${existingConsents.size} active and ${pendingInvites.size} pending.`,
      }, { status: 403 });
    }

    // Check if invite already exists for this email
    const existingInvite = await db.collection('clientInvites')
      .where('therapistId', '==', therapistId)
      .where('clientEmail', '==', clientEmail.toLowerCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingInvite.empty) {
      return NextResponse.json({
        error: 'An invite is already pending for this email address',
      }, { status: 409 });
    }

    // Create the invite
    const inviteId = crypto.randomUUID();
    const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase(); // Short code for easy sharing
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const invite = {
      id: inviteId,
      inviteCode,
      therapistId,
      therapistName: therapistData?.displayName || 'Your Therapist',
      therapistEmail: therapistData?.email || null,
      clientEmail: clientEmail.toLowerCase(),
      clientName: clientName || null,
      message: message || null,
      defaultPermissions: defaultPermissions || {
        shareWeekSummary: true,
        shareHomeworkProgress: true,
        sharePatternAlerts: true,
        shareMoodData: false,
      },
      status: 'pending',
      createdAt: now,
      expiresAt,
      acceptedAt: null,
      acceptedBy: null,
    };

    await db.collection('clientInvites').doc(inviteId).set(invite);

    log.info('Client invite created', { therapistId, clientEmail, inviteId });

    // Generate invite link
    const origin = req.headers.get('origin') || 'https://sorca.life';
    const inviteLink = `${origin}/consent?invite=${inviteCode}`;

    return NextResponse.json({
      invite: {
        id: inviteId,
        inviteCode,
        clientEmail: clientEmail.toLowerCase(),
        clientName,
        expiresAt,
        inviteLink,
      },
      message: `Invite created. Share this link with your client: ${inviteLink}`,
    });
  } catch (error) {
    log.error('Create invite error', {}, error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/invite', correlationId: crypto.randomUUID() });

  try {
    const url = new URL(req.url);
    const inviteCode = url.searchParams.get('code');

    if (!isAdminConfigured()) {
      return NextResponse.json({ invites: [] });
    }

    const db = getAdminFirestore();

    // If invite code is provided, fetch that specific invite (no auth required - for clients)
    if (inviteCode) {
      const inviteSnapshot = await db.collection('clientInvites')
        .where('inviteCode', '==', inviteCode.toUpperCase())
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (inviteSnapshot.empty) {
        return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
      }

      const data = inviteSnapshot.docs[0].data();
      
      // Check if expired
      if (new Date(data.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
      }

      return NextResponse.json({
        invite: {
          id: data.id,
          therapistName: data.therapistName,
          therapistEmail: data.therapistEmail,
          message: data.message,
          defaultPermissions: data.defaultPermissions,
          expiresAt: data.expiresAt,
        },
      });
    }

    // Otherwise, require therapist auth and list therapist's invites
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    // Get all invites for this therapist
    const invitesSnapshot = await db.collection('clientInvites')
      .where('therapistId', '==', therapistId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const invites = invitesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        inviteCode: data.inviteCode,
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        status: data.status,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      };
    });

    // Separate by status
    const pending = invites.filter(i => i.status === 'pending');
    const accepted = invites.filter(i => i.status === 'accepted');
    const expired = invites.filter(i => i.status === 'expired' || (i.status === 'pending' && new Date(i.expiresAt) < new Date()));

    return NextResponse.json({
      invites,
      summary: {
        pending: pending.length,
        accepted: accepted.length,
        expired: expired.length,
      },
    });
  } catch (error) {
    log.error('Get invites error', {}, error);
    return NextResponse.json({ invites: [] });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/therapist/invite', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = cancelInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { inviteId } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Get and verify invite ownership
    const inviteRef = db.collection('clientInvites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const invite = inviteDoc.data();
    if (invite?.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (invite?.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending invites' }, { status: 400 });
    }

    // Cancel the invite
    await inviteRef.update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    log.info('Invite cancelled', { therapistId, inviteId });

    return NextResponse.json({
      success: true,
      message: 'Invite cancelled successfully',
    });
  } catch (error) {
    log.error('Cancel invite error', {}, error);
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
  }
}
