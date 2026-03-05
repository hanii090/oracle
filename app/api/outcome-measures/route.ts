import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import {
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  WSAS_QUESTIONS,
  getPHQ9Severity,
  getGAD7Severity,
  getWSASSeverity,
  calculateRecovery,
  type OutcomeMeasureType,
} from '@/lib/iapt-dataset';

const submitMeasureSchema = z.object({
  type: z.enum(['PHQ9', 'GAD7', 'WSAS']),
  scores: z.array(z.number().min(0).max(8)),
  episodeId: z.string().optional(),
  sessionNumber: z.number().optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/outcome-measures', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = submitMeasureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, scores, episodeId, sessionNumber } = parsed.data;

    // Validate score count matches question count
    const expectedCount = type === 'PHQ9' ? PHQ9_QUESTIONS.length 
      : type === 'GAD7' ? GAD7_QUESTIONS.length 
      : WSAS_QUESTIONS.length;

    if (scores.length !== expectedCount) {
      return NextResponse.json(
        { error: `Expected ${expectedCount} scores for ${type}, got ${scores.length}` },
        { status: 400 }
      );
    }

    // Validate score ranges
    const maxScore = type === 'WSAS' ? 8 : 3;
    if (scores.some(s => s < 0 || s > maxScore)) {
      return NextResponse.json(
        { error: `Scores must be between 0 and ${maxScore} for ${type}` },
        { status: 400 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const total = scores.reduce((sum, s) => sum + s, 0);
    const severity = type === 'PHQ9' ? getPHQ9Severity(total)
      : type === 'GAD7' ? getGAD7Severity(total)
      : getWSASSeverity(total);

    // Check if this is the initial measure for this episode
    let isInitial = true;
    if (episodeId) {
      const existingMeasures = await db.collection('outcomeMeasures')
        .where('userId', '==', userId)
        .where('episodeId', '==', episodeId)
        .where('type', '==', type)
        .limit(1)
        .get();
      isInitial = existingMeasures.empty;
    }

    const measure = {
      id: crypto.randomUUID(),
      userId,
      episodeId: episodeId || null,
      type,
      scores,
      total,
      severity,
      timestamp: new Date().toISOString(),
      sessionNumber: sessionNumber || null,
      isInitial,
    };

    await db.collection('outcomeMeasures').doc(measure.id).set(measure);

    log.info('Outcome measure submitted', { userId, type, total, severity });

    // Check for high-risk PHQ-9 Q9 score (suicidal ideation)
    let riskAlert = null;
    if (type === 'PHQ9' && scores[8] >= 1) {
      riskAlert = {
        level: scores[8] >= 2 ? 'high' : 'medium',
        message: 'PHQ-9 Question 9 indicates thoughts of self-harm. Safety assessment recommended.',
        score: scores[8],
      };

      // Create pattern alert for therapist if user has consent
      const consents = await db.collection('therapistConsent')
        .where('patientId', '==', userId)
        .where('status', '==', 'active')
        .get();

      for (const consent of consents.docs) {
        const consentData = consent.data();
        if (consentData.permissions?.sharePatternAlerts) {
          await db.collection('patternAlerts').add({
            therapistId: consentData.therapistId,
            clientId: userId,
            clientName: 'Client', // Will be populated by therapist dashboard
            type: 'distress',
            message: `PHQ-9 Q9 score of ${scores[8]} - thoughts of self-harm reported`,
            severity: riskAlert.level,
            createdAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }
    }

    return NextResponse.json({ 
      measure,
      riskAlert,
    });
  } catch (error) {
    log.error('Outcome measure submission error', {}, error);
    return NextResponse.json({ error: 'Failed to submit outcome measure' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/outcome-measures', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') as OutcomeMeasureType | null;
    const episodeId = url.searchParams.get('episodeId');
    const clientId = url.searchParams.get('clientId'); // For therapist access
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!isAdminConfigured()) {
      return NextResponse.json({ measures: [], recovery: null });
    }

    const db = getAdminFirestore();
    
    // If clientId provided, verify therapist has consent
    let targetUserId = userId;
    if (clientId) {
      const consent = await db.collection('therapistConsent')
        .where('therapistId', '==', userId)
        .where('patientId', '==', clientId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (consent.empty) {
        return NextResponse.json({ error: 'No consent to view client data' }, { status: 403 });
      }

      const consentData = consent.docs[0].data();
      if (!consentData.permissions?.shareMoodData) {
        return NextResponse.json({ error: 'Client has not consented to mood data sharing' }, { status: 403 });
      }

      targetUserId = clientId;
    }

    let query = db.collection('outcomeMeasures')
      .where('userId', '==', targetUserId)
      .orderBy('timestamp', 'desc');

    if (type) {
      query = db.collection('outcomeMeasures')
        .where('userId', '==', targetUserId)
        .where('type', '==', type)
        .orderBy('timestamp', 'desc');
    }

    if (episodeId) {
      query = db.collection('outcomeMeasures')
        .where('userId', '==', targetUserId)
        .where('episodeId', '==', episodeId)
        .orderBy('timestamp', 'desc');
    }

    const snapshot = await query.limit(limit).get();
    const measures = snapshot.docs.map(doc => doc.data());

    // Calculate recovery status if we have initial and current measures
    let recovery = null;
    if (measures.length >= 2) {
      const phq9Measures = measures.filter(m => m.type === 'PHQ9');
      const gad7Measures = measures.filter(m => m.type === 'GAD7');

      if (phq9Measures.length >= 2 && gad7Measures.length >= 2) {
        const initialPHQ9 = phq9Measures.find(m => m.isInitial)?.total || phq9Measures[phq9Measures.length - 1].total;
        const currentPHQ9 = phq9Measures[0].total;
        const initialGAD7 = gad7Measures.find(m => m.isInitial)?.total || gad7Measures[gad7Measures.length - 1].total;
        const currentGAD7 = gad7Measures[0].total;

        recovery = calculateRecovery(initialPHQ9, currentPHQ9, initialGAD7, currentGAD7);
      }
    }

    return NextResponse.json({ measures, recovery });
  } catch (error) {
    log.error('Outcome measures fetch error', {}, error);
    return NextResponse.json({ measures: [], recovery: null });
  }
}
