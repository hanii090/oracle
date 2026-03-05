import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Therapist Notes API — private notes for therapists about their clients
 * These are NOT visible to clients and are for clinical record-keeping
 * 
 * POST /api/therapist/notes - Create/update note
 * GET /api/therapist/notes?clientId=xxx - Get notes for client
 * DELETE /api/therapist/notes - Delete note
 */

const createNoteSchema = z.object({
  clientId: z.string(),
  content: z.string().min(1).max(5000),
  sessionDate: z.string().optional(), // ISO date if related to a specific session
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const updateNoteSchema = z.object({
  noteId: z.string(),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const deleteNoteSchema = z.object({
  noteId: z.string(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Check if this is an update or create
    if (body.noteId) {
      // Update existing note
      const parsed = updateNoteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { noteId, content, tags } = parsed.data;

      const noteRef = db.collection('therapistNotes').doc(noteId);
      const noteDoc = await noteRef.get();

      if (!noteDoc.exists) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      const note = noteDoc.data();
      if (note?.therapistId !== therapistId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const now = new Date().toISOString();
      await noteRef.update({
        content,
        tags: tags || note.tags,
        updatedAt: now,
      });

      log.info('Note updated', { therapistId, noteId });

      return NextResponse.json({
        note: { ...note, content, tags: tags || note.tags, updatedAt: now },
      });
    } else {
      // Create new note
      const parsed = createNoteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { clientId, content, sessionDate, tags } = parsed.data;

      // Verify therapist has consent for this client
      const consentSnapshot = await db.collection('therapistConsent')
        .where('therapistId', '==', therapistId)
        .where('patientId', '==', clientId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (consentSnapshot.empty) {
        return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
      }

      const noteId = crypto.randomUUID();
      const now = new Date().toISOString();

      const note = {
        id: noteId,
        therapistId,
        clientId,
        content,
        sessionDate: sessionDate || null,
        tags: tags || [],
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('therapistNotes').doc(noteId).set(note);

      log.info('Note created', { therapistId, clientId, noteId });

      return NextResponse.json({ note });
    }
  } catch (error) {
    log.error('Notes error', {}, error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ notes: [] });
    }

    const db = getAdminFirestore();

    // Verify therapist has consent for this client
    const consentSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consentSnapshot.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    // Get all notes for this client
    const notesSnapshot = await db.collection('therapistNotes')
      .where('therapistId', '==', therapistId)
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const notes = notesSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ notes });
  } catch (error) {
    log.error('Get notes error', {}, error);
    return NextResponse.json({ notes: [] });
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/therapist/notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = deleteNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { noteId } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    const noteRef = db.collection('therapistNotes').doc(noteId);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = noteDoc.data();
    if (note?.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await noteRef.delete();

    log.info('Note deleted', { therapistId, noteId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Delete note error', {}, error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
