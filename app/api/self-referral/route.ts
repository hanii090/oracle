import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage, sanitizeIp } from '@/lib/safety';
import { validateNHSNumber } from '@/lib/gp-integration';
import { recommendInitialStep } from '@/lib/stepped-care';
import { getPHQ9Severity, getGAD7Severity, PROBLEM_DESCRIPTORS } from '@/lib/iapt-dataset';
import { selfReferralRateLimit } from '@/lib/rate-limit';

const selfReferralSchema = z.object({
  // Personal details
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string(),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  nhsNumber: z.string().optional(),
  
  // Address
  addressLine1: z.string().max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100),
  postcode: z.string().max(10),
  
  // GP details
  gpPracticeName: z.string().max(200),
  gpName: z.string().max(100).optional(),
  gpAddressLine1: z.string().max(200),
  gpCity: z.string().max(100),
  gpPostcode: z.string().max(10),
  
  // Presenting problems
  presentingProblems: z.array(z.string()),
  mainConcern: z.string().max(2000),
  durationOfProblem: z.enum(['less_than_month', '1_3_months', '3_6_months', '6_12_months', 'over_year']),
  previousTherapy: z.boolean(),
  previousTherapyDetails: z.string().max(1000).optional(),
  currentMedication: z.boolean(),
  medicationDetails: z.string().max(500).optional(),
  
  // Initial screening scores
  phq9Scores: z.array(z.number().min(0).max(3)).length(9),
  gad7Scores: z.array(z.number().min(0).max(3)).length(7),
  
  // Employment
  employmentStatus: z.string(),
  
  // Consent
  consentToProcess: z.boolean(),
  consentToContactGP: z.boolean(),
  consentToEmergencyContact: z.boolean(),
  
  // Emergency contact
  emergencyContactName: z.string().max(100),
  emergencyContactPhone: z.string().max(20),
  emergencyContactRelationship: z.string().max(50),
});

export interface SelfReferral {
  id: string;
  status: 'pending' | 'triaged' | 'accepted' | 'waitlisted' | 'declined' | 'redirected';
  triageResult?: {
    recommendedStep: number;
    reason: string;
    phq9Total: number;
    gad7Total: number;
    phq9Severity: string;
    gad7Severity: string;
    riskFlags: string[];
  };
  personalDetails: {
    fullName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    nhsNumber?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      postcode: string;
    };
  };
  gpDetails: {
    practiceName: string;
    gpName?: string;
    address: {
      line1: string;
      city: string;
      postcode: string;
    };
  };
  clinicalInfo: {
    presentingProblems: string[];
    mainConcern: string;
    durationOfProblem: string;
    previousTherapy: boolean;
    previousTherapyDetails?: string;
    currentMedication: boolean;
    medicationDetails?: string;
    phq9Scores: number[];
    gad7Scores: number[];
    employmentStatus: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  consents: {
    process: boolean;
    contactGP: boolean;
    emergencyContact: boolean;
  };
  createdAt: string;
  updatedAt: string;
  assignedTherapistId?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/self-referral', correlationId: crypto.randomUUID() });

  // Rate limit: 3 submissions per hour per IP
  const ip = sanitizeIp(req.headers.get('x-forwarded-for')?.split(',')[0]);
  const rl = selfReferralRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many referral submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = selfReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate NHS number if provided
    if (data.nhsNumber) {
      const nhsValidation = validateNHSNumber(data.nhsNumber);
      if (!nhsValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid NHS number', details: nhsValidation.error },
          { status: 400 }
        );
      }
    }

    // Must consent to processing
    if (!data.consentToProcess) {
      return NextResponse.json(
        { error: 'Consent to process data is required' },
        { status: 400 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Calculate scores
    const phq9Total = data.phq9Scores.reduce((sum, s) => sum + s, 0);
    const gad7Total = data.gad7Scores.reduce((sum, s) => sum + s, 0);
    const phq9Severity = getPHQ9Severity(phq9Total);
    const gad7Severity = getGAD7Severity(gad7Total);

    // Check for risk flags
    const riskFlags: string[] = [];
    if (data.phq9Scores[8] >= 1) {
      riskFlags.push(`PHQ-9 Q9 score of ${data.phq9Scores[8]} - thoughts of self-harm`);
    }
    if (phq9Total >= 20) {
      riskFlags.push('Severe depression indicated');
    }
    if (gad7Total >= 15) {
      riskFlags.push('Severe anxiety indicated');
    }

    // Get step recommendation
    const stepRecommendation = recommendInitialStep(phq9Total, gad7Total, riskFlags.length > 1);

    const now = new Date().toISOString();
    const referral: SelfReferral = {
      id: crypto.randomUUID(),
      status: 'pending',
      triageResult: {
        recommendedStep: stepRecommendation.recommendedStep,
        reason: stepRecommendation.reason,
        phq9Total,
        gad7Total,
        phq9Severity,
        gad7Severity,
        riskFlags,
      },
      personalDetails: {
        fullName: sanitizeMessage(data.fullName),
        dateOfBirth: data.dateOfBirth,
        email: data.email.toLowerCase(),
        phone: data.phone,
        nhsNumber: data.nhsNumber,
        address: {
          line1: sanitizeMessage(data.addressLine1),
          line2: data.addressLine2 ? sanitizeMessage(data.addressLine2) : undefined,
          city: sanitizeMessage(data.city),
          postcode: data.postcode.toUpperCase(),
        },
      },
      gpDetails: {
        practiceName: sanitizeMessage(data.gpPracticeName),
        gpName: data.gpName ? sanitizeMessage(data.gpName) : undefined,
        address: {
          line1: sanitizeMessage(data.gpAddressLine1),
          city: sanitizeMessage(data.gpCity),
          postcode: data.gpPostcode.toUpperCase(),
        },
      },
      clinicalInfo: {
        presentingProblems: data.presentingProblems,
        mainConcern: sanitizeMessage(data.mainConcern),
        durationOfProblem: data.durationOfProblem,
        previousTherapy: data.previousTherapy,
        previousTherapyDetails: data.previousTherapyDetails ? sanitizeMessage(data.previousTherapyDetails) : undefined,
        currentMedication: data.currentMedication,
        medicationDetails: data.medicationDetails ? sanitizeMessage(data.medicationDetails) : undefined,
        phq9Scores: data.phq9Scores,
        gad7Scores: data.gad7Scores,
        employmentStatus: data.employmentStatus,
      },
      emergencyContact: {
        name: sanitizeMessage(data.emergencyContactName),
        phone: data.emergencyContactPhone,
        relationship: sanitizeMessage(data.emergencyContactRelationship),
      },
      consents: {
        process: data.consentToProcess,
        contactGP: data.consentToContactGP,
        emergencyContact: data.consentToEmergencyContact,
      },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('selfReferrals').doc(referral.id).set(referral);

    // Create audit log
    await db.collection('referralAudit').add({
      referralId: referral.id,
      action: 'submitted',
      timestamp: now,
      phq9Total,
      gad7Total,
      hasRiskFlags: riskFlags.length > 0,
    });

    log.info('Self-referral submitted', { 
      referralId: referral.id, 
      phq9Total, 
      gad7Total,
      recommendedStep: stepRecommendation.recommendedStep,
      riskFlags: riskFlags.length,
    });

    // Return confirmation without sensitive data
    return NextResponse.json({
      success: true,
      referralId: referral.id,
      message: 'Your referral has been received. We will contact you within 5 working days.',
      triage: {
        phq9Severity,
        gad7Severity,
        recommendedStep: stepRecommendation.recommendedStep,
        stepName: stepRecommendation.recommendedStep === 1 ? 'Guided Self-Help' 
          : stepRecommendation.recommendedStep === 2 ? 'Low-Intensity Therapy'
          : 'High-Intensity Therapy',
      },
      riskAlert: riskFlags.length > 0 ? {
        message: 'Based on your responses, we recommend speaking to someone today if you are having thoughts of self-harm.',
        contacts: [
          { name: 'Samaritans', phone: '116 123', available: '24/7' },
          { name: 'NHS 111', phone: '111', available: '24/7' },
          { name: 'Crisis Text Line', phone: 'Text SHOUT to 85258', available: '24/7' },
        ],
      } : null,
    });
  } catch (error) {
    log.error('Self-referral submission error', {}, error);
    return NextResponse.json({ error: 'Failed to submit referral' }, { status: 500 });
  }
}

// GET endpoint for therapists to view referrals
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/self-referral', correlationId: crypto.randomUUID() });

  try {
    const { verifyTherapist } = await import('@/lib/auth-middleware');
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    if (!isAdminConfigured()) {
      return NextResponse.json({ referrals: [] });
    }

    const db = getAdminFirestore();
    
    const snapshot = await db.collection('selfReferrals')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const referrals = snapshot.docs.map(doc => {
      const data = doc.data();
      // Return summary without full personal details
      return {
        id: data.id,
        status: data.status,
        createdAt: data.createdAt,
        triageResult: data.triageResult,
        presentingProblems: data.clinicalInfo.presentingProblems,
        durationOfProblem: data.clinicalInfo.durationOfProblem,
        // Partial personal info for identification
        initials: data.personalDetails.fullName.split(' ').map((n: string) => n[0]).join(''),
        postcode: data.personalDetails.address.postcode,
      };
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    log.error('Self-referral fetch error', {}, error);
    return NextResponse.json({ referrals: [] });
  }
}
