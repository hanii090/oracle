import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';

const archiveSchema = z.object({
  action: z.enum(['create', 'share', 'list', 'revoke']),
  archiveId: z.string().max(200).optional(),
  recipientName: z.string().max(100).optional(),
  personalNote: z.string().max(2000).optional(),
});

/**
 * Thread Archive — Pro-only Feature (End of Life)
 * POST /api/thread-archive  — Create a permanent shareable archive
 * GET  /api/thread-archive?token=xxx — Public access (no auth) for family members
 *
 * Packages the user's full session history into a permanent, shareable archive
 * accessible by family via a unique token link. No authentication required to view.
 */

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/thread-archive', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify Pro tier
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tier = userData?.tier || 'free';
    if (tier !== 'pro') {
      return NextResponse.json(
        { error: 'Thread Archive requires the Pro tier.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = archiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action, archiveId, recipientName, personalNote } = parsed.data;

    if (action === 'create') {
      // Gather all sessions
      const sessionsSnap = await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .orderBy('createdAt', 'asc')
        .get();

      if (sessionsSnap.empty) {
        return NextResponse.json(
          { error: 'No sessions to archive. Start some Sorca sessions first.' },
          { status: 400 }
        );
      }

      const sessions = sessionsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));

      // Gather memory portraits if any
      const portraitsSnap = await db
        .collection('users')
        .doc(userId)
        .collection('memoryPortraits')
        .orderBy('generatedAt', 'desc')
        .limit(10)
        .get();

      const portraits = portraitsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));

      // Gather EOL session data if any
      let eolData = null;
      try {
        const eolDoc = await db
          .collection('users')
          .doc(userId)
          .collection('eolSessions')
          .doc('current')
          .get();
        if (eolDoc.exists) {
          eolData = eolDoc.data();
        }
      } catch {
        // Non-critical
      }

      // Generate a unique share token (URL-safe, high-entropy)
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);

      const archive = {
        userId,
        token,
        recipientName: recipientName || 'My loved ones',
        personalNote: personalNote || '',
        sessions: sessions.map(s => ({
          id: s.id,
          messages: (s as Record<string, unknown>).messages || [],
          maxDepth: (s as Record<string, unknown>).maxDepth || 0,
          createdAt: (s as Record<string, unknown>).createdAt || '',
          portrait: (s as Record<string, unknown>).portrait || null,
        })),
        memoryPortraits: portraits,
        eolData,
        totalSessions: sessions.length,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const docRef = await db.collection('threadArchives').add(archive);

      log.info('Thread archive created', { userId, archiveId: docRef.id, sessionCount: sessions.length });

      return NextResponse.json({
        archive: {
          id: docRef.id,
          token,
          recipientName: archive.recipientName,
          totalSessions: archive.totalSessions,
          createdAt: archive.createdAt,
          shareUrl: `/archive/${token}`,
        },
      });

    } else if (action === 'revoke') {
      // Revoke an archive (deactivate the share link)
      if (!archiveId) {
        return NextResponse.json({ error: 'Archive ID required' }, { status: 400 });
      }

      const archiveDoc = await db.collection('threadArchives').doc(archiveId).get();
      if (!archiveDoc.exists || archiveDoc.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
      }

      await db.collection('threadArchives').doc(archiveId).update({ isActive: false });

      log.info('Thread archive revoked', { userId, archiveId });

      return NextResponse.json({ revoked: true });

    } else if (action === 'list') {
      // List all archives for this user
      const snap = await db
        .collection('threadArchives')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const archives = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          token: data.token,
          recipientName: data.recipientName,
          totalSessions: data.totalSessions,
          createdAt: data.createdAt,
          isActive: data.isActive,
          shareUrl: `/archive/${data.token}`,
        };
      });

      return NextResponse.json({ archives });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    log.error('Thread archive error', {}, error);
    return NextResponse.json({ error: 'Thread archive operation failed' }, { status: 500 });
  }
}

/**
 * GET /api/thread-archive?token=xxx
 * Public endpoint — no authentication required.
 * Family members access the archive via this link.
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/thread-archive', correlationId: crypto.randomUUID() });

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Archive token required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const snap = await db
      .collection('threadArchives')
      .where('token', '==', token)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: 'This archive has been revoked or does not exist.' },
        { status: 404 }
      );
    }

    const archive = snap.docs[0].data();

    // Return the archive data (no userId or sensitive info)
    return NextResponse.json({
      archive: {
        recipientName: archive.recipientName,
        personalNote: archive.personalNote,
        sessions: archive.sessions,
        memoryPortraits: archive.memoryPortraits,
        eolData: archive.eolData,
        totalSessions: archive.totalSessions,
        createdAt: archive.createdAt,
      },
    });
  } catch (error) {
    log.error('Thread archive fetch error', {}, error);
    return NextResponse.json({ error: 'Failed to retrieve archive' }, { status: 500 });
  }
}
