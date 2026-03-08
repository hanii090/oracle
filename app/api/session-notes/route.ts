import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const createNoteSchema = z.object({
  sessionId: z.string().optional(),
  patientId: z.string(),
  episodeId: z.string().optional(),
  presentation: z.string().max(5000),
  intervention: z.string().max(5000),
  riskLevel: z.enum(['low', 'medium', 'high', 'crisis']),
  riskNotes: z.string().max(2000).optional(),
  plan: z.string().max(2000),
  homework: z.string().max(1000).optional(),
  nextSessionDate: z.string().optional(),
});

const updateNoteSchema = z.object({
  noteId: z.string(),
  presentation: z.string().max(5000).optional(),
  intervention: z.string().max(5000).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'crisis']).optional(),
  riskNotes: z.string().max(2000).optional(),
  plan: z.string().max(2000).optional(),
  homework: z.string().max(1000).optional(),
  nextSessionDate: z.string().optional(),
});

export interface SessionNote {
  id: string;
  sessionId?: string;
  patientId: string;
  therapistId: string;
  episodeId?: string;
  presentation: string;
  intervention: string;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  riskNotes?: string;
  plan: string;
  homework?: string;
  nextSessionDate?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/session-notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { patientId, sessionId, episodeId, presentation, intervention, riskLevel, riskNotes, plan, homework, nextSessionDate } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Verify therapist has consent for this patient
    const consent = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', patientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consent.empty) {
      return NextResponse.json({ error: 'No active consent for this patient' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const note: SessionNote = {
      id: crypto.randomUUID(),
      sessionId: sessionId || undefined,
      patientId,
      therapistId,
      episodeId: episodeId || undefined,
      presentation: sanitizeMessage(presentation),
      intervention: sanitizeMessage(intervention),
      riskLevel,
      riskNotes: riskNotes ? sanitizeMessage(riskNotes) : undefined,
      plan: sanitizeMessage(plan),
      homework: homework ? sanitizeMessage(homework) : undefined,
      nextSessionDate: nextSessionDate || undefined,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await db.collection('sessionNotes').doc(note.id).set(note);

    // Create audit log entry
    await db.collection('sessionNotesAudit').add({
      noteId: note.id,
      action: 'created',
      therapistId,
      patientId,
      timestamp: now,
      version: 1,
    });

    // If high/crisis risk, create pattern alert
    if (riskLevel === 'high' || riskLevel === 'crisis') {
      await db.collection('patternAlerts').add({
        therapistId,
        clientId: patientId,
        clientName: 'Client',
        type: 'distress',
        message: `Session note recorded with ${riskLevel} risk level`,
        severity: riskLevel,
        createdAt: now,
        acknowledged: true, // Auto-acknowledge since therapist created it
      });
    }

    // Update next session date in therapy profile if provided
    if (nextSessionDate) {
      await db.collection('therapyProfiles').doc(patientId).set({
        nextSessionDate,
        updatedAt: now,
      }, { merge: true });
    }

    log.info('Session note created', { therapistId, patientId, noteId: note.id, riskLevel });

    return NextResponse.json({ note });
  } catch (error) {
    log.error('Session note creation error', {}, error);
    return NextResponse.json({ error: 'Failed to create session note' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const log = createLogger({ route: '/api/session-notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { noteId, ...updates } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const noteRef = db.collection('sessionNotes').doc(noteId);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const existingNote = noteDoc.data() as SessionNote;

    if (existingNote.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updateData: Partial<SessionNote> = {
      updatedAt: now,
      version: existingNote.version + 1,
    };

    if (updates.presentation) updateData.presentation = sanitizeMessage(updates.presentation);
    if (updates.intervention) updateData.intervention = sanitizeMessage(updates.intervention);
    if (updates.riskLevel) updateData.riskLevel = updates.riskLevel;
    if (updates.riskNotes) updateData.riskNotes = sanitizeMessage(updates.riskNotes);
    if (updates.plan) updateData.plan = sanitizeMessage(updates.plan);
    if (updates.homework) updateData.homework = sanitizeMessage(updates.homework);
    if (updates.nextSessionDate) updateData.nextSessionDate = updates.nextSessionDate;

    await noteRef.update(updateData);

    // Create audit log entry
    await db.collection('sessionNotesAudit').add({
      noteId,
      action: 'updated',
      therapistId,
      patientId: existingNote.patientId,
      timestamp: now,
      version: updateData.version,
      changedFields: Object.keys(updates),
    });

    log.info('Session note updated', { therapistId, noteId, version: updateData.version });

    return NextResponse.json({ 
      success: true,
      note: { ...existingNote, ...updateData },
    });
  } catch (error) {
    log.error('Session note update error', {}, error);
    return NextResponse.json({ error: 'Failed to update session note' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/session-notes', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const url = new URL(req.url);
    const noteId = url.searchParams.get('noteId');
    const patientId = url.searchParams.get('patientId');
    const episodeId = url.searchParams.get('episodeId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20') || 20, 100);

    if (!isAdminConfigured()) {
      return NextResponse.json({ notes: [] });
    }

    const db = getAdminFirestore();

    // Single note fetch
    if (noteId) {
      const noteDoc = await db.collection('sessionNotes').doc(noteId).get();
      if (!noteDoc.exists) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      const note = noteDoc.data() as SessionNote;
      if (note.therapistId !== therapistId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ note });
    }

    // List notes
    let query = db.collection('sessionNotes')
      .where('therapistId', '==', therapistId)
      .orderBy('createdAt', 'desc');

    if (patientId) {
      // Verify consent
      const consent = await db.collection('therapistConsent')
        .where('therapistId', '==', therapistId)
        .where('patientId', '==', patientId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (consent.empty) {
        return NextResponse.json({ error: 'No consent for this patient' }, { status: 403 });
      }

      if (episodeId) {
        query = db.collection('sessionNotes')
          .where('therapistId', '==', therapistId)
          .where('patientId', '==', patientId)
          .where('episodeId', '==', episodeId)
          .orderBy('createdAt', 'desc');
      } else {
        query = db.collection('sessionNotes')
          .where('therapistId', '==', therapistId)
          .where('patientId', '==', patientId)
          .orderBy('createdAt', 'desc');
      }
    } else if (episodeId) {
      query = db.collection('sessionNotes')
        .where('therapistId', '==', therapistId)
        .where('episodeId', '==', episodeId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(limit).get();
    const notes = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ notes });
  } catch (error) {
    log.error('Session notes fetch error', {}, error);
    return NextResponse.json({ notes: [] });
  }
}
