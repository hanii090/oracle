import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const updateProfileSchema = z.object({
  goals: z.array(z.string().max(500)).max(10).optional(),
  modality: z.enum(['cbt', 'act', 'schema', 'ifs', 'psychodynamic', 'humanistic', 'integrative', 'person-centred', 'dbt', 'emdr', 'other', 'unsure']).optional(),
  modalityOther: z.string().max(200).optional(),
  recurringThemes: z.array(z.string().max(300)).max(20).optional(),
  breakthroughMoments: z.array(z.object({
    id: z.string(),
    title: z.string().max(200),
    description: z.string().max(1000),
    date: z.string(),
  })).max(50).optional(),
  preferredApproach: z.string().max(500).optional(),
  triggerWarnings: z.array(z.string().max(200)).max(10).optional(),
  communicationPreferences: z.string().max(500).optional(),
});

export interface UserTherapyProfile {
  userId: string;
  goals: string[];
  modality: string;
  modalityOther?: string;
  recurringThemes: string[];
  breakthroughMoments: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
  }>;
  preferredApproach: string | null;
  triggerWarnings: string[];
  communicationPreferences: string | null;
  shareTokens: Array<{ token: string; createdAt: string; expiresAt: string; label: string }>;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PROFILE: Omit<UserTherapyProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
  goals: [],
  modality: 'unsure',
  recurringThemes: [],
  breakthroughMoments: [],
  preferredApproach: null,
  triggerWarnings: [],
  communicationPreferences: null,
  shareTokens: [],
};

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapy-profile', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

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
    const profileRef = db.collection('userTherapyProfiles').doc(userId);
    const existingDoc = await profileRef.get();
    const now = new Date().toISOString();
    const data = parsed.data;

    const updates: Record<string, unknown> = { updatedAt: now };
    if (data.goals !== undefined) updates.goals = data.goals.map(g => sanitizeMessage(g));
    if (data.modality !== undefined) updates.modality = data.modality;
    if (data.modalityOther !== undefined) updates.modalityOther = sanitizeMessage(data.modalityOther);
    if (data.recurringThemes !== undefined) updates.recurringThemes = data.recurringThemes.map(t => sanitizeMessage(t));
    if (data.breakthroughMoments !== undefined) {
      updates.breakthroughMoments = data.breakthroughMoments.map(b => ({
        id: b.id,
        title: sanitizeMessage(b.title),
        description: sanitizeMessage(b.description),
        date: b.date,
      }));
    }
    if (data.preferredApproach !== undefined) updates.preferredApproach = sanitizeMessage(data.preferredApproach);
    if (data.triggerWarnings !== undefined) updates.triggerWarnings = data.triggerWarnings.map(t => sanitizeMessage(t));
    if (data.communicationPreferences !== undefined) updates.communicationPreferences = sanitizeMessage(data.communicationPreferences);

    if (existingDoc.exists) {
      await profileRef.update(updates);
    } else {
      const profile: UserTherapyProfile = {
        userId,
        ...DEFAULT_PROFILE,
        ...updates,
        createdAt: now,
        updatedAt: now,
      };
      await profileRef.set(profile);
    }

    const updatedDoc = await profileRef.get();
    log.info('Therapy profile updated', { userId });

    return NextResponse.json({ profile: updatedDoc.data() });
  } catch (error) {
    log.error('Therapy profile error', {}, error);
    return NextResponse.json({ error: 'Failed to update therapy profile' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapy-profile', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ profile: null });
    }

    const db = getAdminFirestore();
    const profileDoc = await db.collection('userTherapyProfiles').doc(userId).get();

    if (!profileDoc.exists) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: profileDoc.data() });
  } catch (error) {
    log.error('Therapy profile fetch error', {}, error);
    return NextResponse.json({ profile: null });
  }
}
