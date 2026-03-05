import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { sanitizeMessage } from '@/lib/safety';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

const anchorSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['breathing', 'grounding', 'reframe', 'movement', 'other']),
  steps: z.array(z.string().max(500)).min(1).max(10),
  description: z.string().max(500).optional(),
  taughtBy: z.string().max(100).optional(),
});

const ANCHOR_TYPE_PROMPTS: Record<string, string> = {
  breathing: "Let's breathe together. Follow these steps your therapist taught you:",
  grounding: "Let's ground yourself. Your therapist gave you this technique:",
  reframe: "Let's shift perspective. Here's the reframe your therapist shared:",
  movement: "Let's move through this. Your therapist suggested:",
  other: "Here's what your therapist taught you:",
};

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/coping-anchor', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = anchorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, type, steps, description, taughtBy } = parsed.data;

    const anchor = {
      id: crypto.randomUUID(),
      userId,
      name: sanitizeMessage(name),
      type,
      steps: steps.map(s => sanitizeMessage(s)),
      description: description ? sanitizeMessage(description) : null,
      taughtBy: taughtBy ? sanitizeMessage(taughtBy) : null,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };

    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      await db.collection('copingAnchors').doc(userId).set({
        anchors: {
          [anchor.id]: anchor,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    log.info('Coping anchor created', { userId, anchorId: anchor.id });

    return NextResponse.json({ anchor });
  } catch (error) {
    log.error('Create anchor error', {}, error);
    return NextResponse.json({ error: 'Failed to create anchor' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/coping-anchor', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const anchorId = url.searchParams.get('id');
    const useAnchor = url.searchParams.get('use') === 'true';

    if (!isAdminConfigured()) {
      return NextResponse.json({ anchors: [] });
    }

    const db = getAdminFirestore();
    const doc = await db.collection('copingAnchors').doc(userId).get();

    if (!doc.exists) {
      return NextResponse.json({ anchors: [] });
    }

    const data = doc.data();
    const anchorsMap = data?.anchors || {};
    const anchors = Object.values(anchorsMap);

    if (anchorId) {
      const anchor = anchorsMap[anchorId];
      if (!anchor) {
        return NextResponse.json({ error: 'Anchor not found' }, { status: 404 });
      }

      // Update usage stats if using the anchor
      if (useAnchor) {
        await db.collection('copingAnchors').doc(userId).set({
          anchors: {
            [anchorId]: {
              ...anchor,
              usageCount: (anchor.usageCount || 0) + 1,
              lastUsedAt: new Date().toISOString(),
            },
          },
        }, { merge: true });
      }

      const introPrompt = ANCHOR_TYPE_PROMPTS[anchor.type] || ANCHOR_TYPE_PROMPTS.other;

      return NextResponse.json({ 
        anchor,
        introPrompt,
      });
    }

    return NextResponse.json({ anchors });
  } catch (error) {
    log.error('Get anchors error', {}, error);
    return NextResponse.json({ anchors: [] });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/coping-anchor', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const anchorId = url.searchParams.get('id');

    if (!anchorId) {
      return NextResponse.json({ error: 'Anchor ID required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const doc = await db.collection('copingAnchors').doc(userId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Anchor not found' }, { status: 404 });
    }

    const data = doc.data();
    const anchors = { ...data?.anchors };
    delete anchors[anchorId];

    await db.collection('copingAnchors').doc(userId).set({
      anchors,
      updatedAt: new Date().toISOString(),
    });

    log.info('Coping anchor deleted', { userId, anchorId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Delete anchor error', {}, error);
    return NextResponse.json({ error: 'Failed to delete anchor' }, { status: 500 });
  }
}
