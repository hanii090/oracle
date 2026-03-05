import { NextResponse } from 'next/server';
import { verifyTherapist, verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { STEPPED_CARE_MODEL, recommendStepChange, generateDischargeSummary, type TreatmentEpisode } from '@/lib/stepped-care';

const createEpisodeSchema = z.object({
  patientId: z.string(),
  step: z.number().min(1).max(3),
  referralSource: z.string(),
  presentingProblem: z.string(),
  initialPHQ9: z.number().optional(),
  initialGAD7: z.number().optional(),
});

const updateEpisodeSchema = z.object({
  episodeId: z.string(),
  status: z.enum(['active', 'completed', 'stepped_up', 'stepped_down', 'discharged', 'dropped_out']).optional(),
  step: z.number().min(1).max(3).optional(),
  finalPHQ9: z.number().optional(),
  finalGAD7: z.number().optional(),
  dischargeReason: z.string().optional(),
  dischargeSummary: z.string().optional(),
  sessionCount: z.number().optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/treatment-episode', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = createEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { patientId, step, referralSource, presentingProblem, initialPHQ9, initialGAD7 } = parsed.data;

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

    // Check for existing active episode
    const existingEpisode = await db.collection('treatmentEpisodes')
      .where('patientId', '==', patientId)
      .where('therapistId', '==', therapistId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingEpisode.empty) {
      return NextResponse.json(
        { error: 'Patient already has an active treatment episode' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const episode: TreatmentEpisode = {
      id: crypto.randomUUID(),
      patientId,
      therapistId,
      step: step as 1 | 2 | 3,
      status: 'active',
      startDate: now,
      referralSource,
      presentingProblem,
      initialPHQ9,
      initialGAD7,
      sessionCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('treatmentEpisodes').doc(episode.id).set(episode);

    log.info('Treatment episode created', { therapistId, patientId, episodeId: episode.id, step });

    return NextResponse.json({ 
      episode,
      stepInfo: STEPPED_CARE_MODEL[step as 1 | 2 | 3],
    });
  } catch (error) {
    log.error('Treatment episode creation error', {}, error);
    return NextResponse.json({ error: 'Failed to create treatment episode' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const log = createLogger({ route: '/api/treatment-episode', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = updateEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { episodeId, ...updates } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const episodeRef = db.collection('treatmentEpisodes').doc(episodeId);
    const episodeDoc = await episodeRef.get();

    if (!episodeDoc.exists) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const episode = episodeDoc.data() as TreatmentEpisode;

    if (episode.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Partial<TreatmentEpisode> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.step) updateData.step = updates.step as 1 | 2 | 3;
    if (updates.finalPHQ9 !== undefined) updateData.finalPHQ9 = updates.finalPHQ9;
    if (updates.finalGAD7 !== undefined) updateData.finalGAD7 = updates.finalGAD7;
    if (updates.dischargeReason) updateData.dischargeReason = updates.dischargeReason;
    if (updates.dischargeSummary) updateData.dischargeSummary = updates.dischargeSummary;
    if (updates.sessionCount !== undefined) updateData.sessionCount = updates.sessionCount;

    // If status is being set to a terminal state, set end date
    if (updates.status && ['completed', 'discharged', 'dropped_out'].includes(updates.status)) {
      updateData.endDate = new Date().toISOString();
      
      // Generate discharge summary if not provided
      if (!updates.dischargeSummary) {
        const updatedEpisode = { ...episode, ...updateData };
        updateData.dischargeSummary = generateDischargeSummary(updatedEpisode);
      }
    }

    await episodeRef.update(updateData);

    log.info('Treatment episode updated', { therapistId, episodeId, updates: Object.keys(updates) });

    return NextResponse.json({ 
      success: true,
      episode: { ...episode, ...updateData },
    });
  } catch (error) {
    log.error('Treatment episode update error', {}, error);
    return NextResponse.json({ error: 'Failed to update treatment episode' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/treatment-episode', correlationId: crypto.randomUUID() });

  try {
    // Try therapist auth first, then regular auth
    let userId: string;
    let isTherapist = false;

    const therapistResult = await verifyTherapist(req);
    if (!(therapistResult instanceof NextResponse)) {
      userId = therapistResult.userId;
      isTherapist = true;
    } else {
      const authResult = await verifyAuth(req);
      if (authResult instanceof NextResponse) return authResult;
      userId = authResult.userId;
    }

    const url = new URL(req.url);
    const episodeId = url.searchParams.get('episodeId');
    const patientId = url.searchParams.get('patientId');
    const status = url.searchParams.get('status');
    const checkStepRecommendation = url.searchParams.get('checkStep') === 'true';

    if (!isAdminConfigured()) {
      return NextResponse.json({ episodes: [] });
    }

    const db = getAdminFirestore();

    // Single episode fetch
    if (episodeId) {
      const episodeDoc = await db.collection('treatmentEpisodes').doc(episodeId).get();
      if (!episodeDoc.exists) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
      }

      const episode = episodeDoc.data() as TreatmentEpisode;

      // Verify access
      if (isTherapist && episode.therapistId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (!isTherapist && episode.patientId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Check step recommendation if requested
      let stepRecommendation = null;
      if (checkStepRecommendation && episode.initialPHQ9 !== undefined && episode.initialGAD7 !== undefined) {
        // Get latest outcome measures
        const latestMeasures = await db.collection('outcomeMeasures')
          .where('userId', '==', episode.patientId)
          .where('episodeId', '==', episodeId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();

        const phq9 = latestMeasures.docs.find(d => d.data().type === 'PHQ9')?.data();
        const gad7 = latestMeasures.docs.find(d => d.data().type === 'GAD7')?.data();

        if (phq9 && gad7) {
          stepRecommendation = recommendStepChange(
            episode.step,
            episode.initialPHQ9,
            phq9.total,
            episode.initialGAD7,
            gad7.total,
            episode.sessionCount
          );
        }
      }

      return NextResponse.json({ 
        episode,
        stepInfo: STEPPED_CARE_MODEL[episode.step],
        stepRecommendation,
      });
    }

    // List episodes
    let query = isTherapist
      ? db.collection('treatmentEpisodes').where('therapistId', '==', userId)
      : db.collection('treatmentEpisodes').where('patientId', '==', userId);

    if (patientId && isTherapist) {
      // Verify consent
      const consent = await db.collection('therapistConsent')
        .where('therapistId', '==', userId)
        .where('patientId', '==', patientId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (consent.empty) {
        return NextResponse.json({ error: 'No consent for this patient' }, { status: 403 });
      }

      query = db.collection('treatmentEpisodes')
        .where('therapistId', '==', userId)
        .where('patientId', '==', patientId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    const episodes = snapshot.docs.map(doc => ({
      ...doc.data(),
      stepInfo: STEPPED_CARE_MODEL[(doc.data() as TreatmentEpisode).step],
    }));

    return NextResponse.json({ episodes });
  } catch (error) {
    log.error('Treatment episode fetch error', {}, error);
    return NextResponse.json({ episodes: [] });
  }
}
