import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import {
  generateReferralAcknowledgmentLetter,
  generateDischargeSummaryLetter,
  validateNHSNumber,
  type GPDetails,
  type PatientDetails,
  type TherapistDetails,
} from '@/lib/gp-integration';

const gpDetailsSchema = z.object({
  practiceName: z.string().min(1).max(200),
  gpName: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

const patientDetailsSchema = z.object({
  fullName: z.string().min(1).max(200),
  dateOfBirth: z.string(),
  nhsNumber: z.string().optional(),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  phone: z.string().max(20).optional(),
});

const therapistDetailsSchema = z.object({
  name: z.string().min(1).max(200),
  qualifications: z.string().min(1).max(500),
  serviceName: z.string().min(1).max(200),
  addressLine1: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  phone: z.string().min(1).max(20),
  email: z.string().email(),
});

const generateLetterSchema = z.object({
  type: z.enum(['referral_acknowledgment', 'discharge_summary']),
  gp: gpDetailsSchema,
  patient: patientDetailsSchema,
  therapist: therapistDetailsSchema,
  // For referral acknowledgment
  referralDate: z.string().optional(),
  presentingProblem: z.string().max(2000).optional(),
  phq9Score: z.number().min(0).max(27).optional(),
  gad7Score: z.number().min(0).max(21).optional(),
  riskLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  triageOutcome: z.enum(['step1', 'step2', 'step3', 'waitlist', 'signposted']).optional(),
  // For discharge summary
  episode: z.object({
    startDate: z.string(),
    endDate: z.string(),
    presentingProblem: z.string(),
    treatmentProvided: z.string(),
    sessionCount: z.number(),
    initialPHQ9: z.number().optional(),
    finalPHQ9: z.number().optional(),
    initialGAD7: z.number().optional(),
    finalGAD7: z.number().optional(),
    outcome: z.string(),
    recommendations: z.array(z.string()),
  }).optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/gp-letter', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Tier gating: GP letter generation is a Pro+ feature (pro, practice)
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      const userDoc = await db.doc(`users/${userId}`).get();
      const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
      
      if (tier !== 'pro' && tier !== 'practice') {
        return NextResponse.json(
          { error: 'GP letter generation requires Patient Pro or Clinical Practice subscription' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const parsed = generateLetterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, gp, patient, therapist } = parsed.data;

    // Validate NHS number if provided
    if (patient.nhsNumber) {
      const nhsValidation = validateNHSNumber(patient.nhsNumber);
      if (!nhsValidation.valid) {
        return NextResponse.json(
          { error: nhsValidation.error },
          { status: 400 }
        );
      }
    }

    let letter: string;
    let letterType: string;

    if (type === 'referral_acknowledgment') {
      if (!parsed.data.referralDate) {
        return NextResponse.json(
          { error: 'Referral date is required for acknowledgment letters' },
          { status: 400 }
        );
      }

      letter = generateReferralAcknowledgmentLetter(
        patient as PatientDetails,
        gp as GPDetails,
        therapist as TherapistDetails,
        parsed.data.referralDate
      );
      letterType = 'Referral Acknowledgment';
    } else if (type === 'discharge_summary') {
      if (!parsed.data.episode) {
        return NextResponse.json(
          { error: 'Episode details are required for discharge summary letters' },
          { status: 400 }
        );
      }

      letter = generateDischargeSummaryLetter(
        patient as PatientDetails,
        gp as GPDetails,
        therapist as TherapistDetails,
        parsed.data.episode
      );
      letterType = 'Discharge Summary';
    } else {
      return NextResponse.json({ error: 'Invalid letter type' }, { status: 400 });
    }

    // Store letter in database for audit trail
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      await db.collection('gpLetters').add({
        userId,
        type,
        letterType,
        patientName: patient.fullName,
        gpPractice: gp.practiceName,
        createdAt: new Date().toISOString(),
        // Don't store full letter content for privacy - just metadata
      });
    }

    log.info('GP letter generated', { userId, type, letterType });

    return NextResponse.json({
      letter,
      letterType,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error('GP letter generation error', {}, error);
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/gp-letter', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ letters: [] });
    }

    const db = getAdminFirestore();

    // Tier gating: GP letter generation is a Pro+ feature (pro, practice)
    const userDoc = await db.doc(`users/${userId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    
    if (tier !== 'pro' && tier !== 'practice') {
      return NextResponse.json(
        { error: 'GP letter generation requires Patient Pro or Clinical Practice subscription', letters: [] },
        { status: 403 }
      );
    }

    // Get letter history (metadata only)
    const snapshot = await db.collection('gpLetters')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const letters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ letters });
  } catch (error) {
    log.error('Get GP letters error', {}, error);
    return NextResponse.json({ letters: [] });
  }
}
