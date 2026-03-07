import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';

const createShareSchema = z.object({
  label: z.string().max(100).optional(),
  expiresInDays: z.number().min(1).max(90).default(30),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapy-profile/share', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = createShareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify profile exists
    const profileDoc = await db.collection('userTherapyProfiles').doc(userId).get();
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'No therapy profile found. Create one first.' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (parsed.data.expiresInDays || 30) * 24 * 60 * 60 * 1000);
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const shareToken = {
      token,
      userId,
      label: parsed.data.label || 'New therapist',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessCount: 0,
    };

    // Store share token
    await db.collection('therapyProfileShares').doc(token).set(shareToken);

    // Also add to profile's shareTokens array
    const profile = profileDoc.data();
    const existingTokens = profile?.shareTokens || [];
    await db.collection('userTherapyProfiles').doc(userId).update({
      shareTokens: [...existingTokens, {
        token,
        createdAt: shareToken.createdAt,
        expiresAt: shareToken.expiresAt,
        label: shareToken.label,
      }],
      updatedAt: now.toISOString(),
    });

    log.info('Therapy profile share token created', { userId, token });

    return NextResponse.json({
      shareUrl: `/profile/${token}`,
      token,
      expiresAt: shareToken.expiresAt,
    });
  } catch (error) {
    log.error('Share token creation error', {}, error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

// GET: Fetch a shared profile by token (public endpoint, no auth required)
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapy-profile/share', correlationId: crypto.randomUUID() });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Find the share token
    const shareDoc = await db.collection('therapyProfileShares').doc(token).get();
    if (!shareDoc.exists) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    const shareData = shareDoc.data()!;

    // Check expiry
    if (new Date(shareData.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 });
    }

    // Fetch the profile
    const profileDoc = await db.collection('userTherapyProfiles').doc(shareData.userId).get();
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profileDoc.data()!;

    // Increment access count
    await db.collection('therapyProfileShares').doc(token).update({
      accessCount: (shareData.accessCount || 0) + 1,
      lastAccessedAt: new Date().toISOString(),
    });

    // Return sanitized profile (no share tokens, no userId)
    const sharedProfile = {
      goals: profile.goals || [],
      modality: profile.modality || 'unsure',
      modalityOther: profile.modalityOther,
      recurringThemes: profile.recurringThemes || [],
      breakthroughMoments: profile.breakthroughMoments || [],
      preferredApproach: profile.preferredApproach,
      triggerWarnings: profile.triggerWarnings || [],
      communicationPreferences: profile.communicationPreferences,
    };

    return NextResponse.json({ profile: sharedProfile, expiresAt: shareData.expiresAt });
  } catch (error) {
    log.error('Shared profile fetch error', {}, error);
    return NextResponse.json({ error: 'Failed to load shared profile' }, { status: 500 });
  }
}
