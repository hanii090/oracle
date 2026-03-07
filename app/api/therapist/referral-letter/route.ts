import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const letterSchema = z.object({
  clientId: z.string(),
  clientName: z.string().max(200),
  clientDOB: z.string(),
  clientAddress: z.string().max(500).optional(),
  clientNHSNumber: z.string().max(20).optional(),
  recipientType: z.enum(['gp', 'psychiatrist', 'specialist', 'other']),
  recipientName: z.string().max(200),
  recipientTitle: z.string().max(100).optional(),
  recipientAddress: z.string().max(500).optional(),
  letterType: z.enum(['referral', 'update', 'discharge']),
  presentingProblem: z.string().max(5000),
  treatmentSummary: z.string().max(5000),
  reasonForReferral: z.string().max(3000).optional(),
  riskLevel: z.enum(['none', 'low', 'medium', 'high']),
  riskDetails: z.string().max(2000).optional(),
  medicationNotes: z.string().max(1000).optional(),
  recommendations: z.string().max(2000).optional(),
});

function generateLetter(data: z.infer<typeof letterSchema>, therapistData: Record<string, string>): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const recipientTitle = data.recipientType === 'gp' ? 'Dr' : (data.recipientTitle || '');
  const salutation = `Dear ${recipientTitle} ${data.recipientName}`.trim();

  let letterTypeHeading = '';
  switch (data.letterType) {
    case 'referral': letterTypeHeading = 'Re: Referral for Psychological/Psychiatric Assessment'; break;
    case 'update': letterTypeHeading = 'Re: Progress Update — Psychological Therapy'; break;
    case 'discharge': letterTypeHeading = 'Re: Discharge Summary — Psychological Therapy'; break;
  }

  let body = `${therapistData.practiceName || ''}
${therapistData.practiceAddress || ''}

${today}

${data.recipientAddress || ''}

${salutation},

${letterTypeHeading}

Patient: ${data.clientName}
Date of Birth: ${data.clientDOB}
${data.clientNHSNumber ? `NHS Number: ${data.clientNHSNumber}` : ''}

I am writing to ${data.letterType === 'referral' ? 'refer' : data.letterType === 'update' ? 'update you regarding' : 'inform you of the discharge of'} the above-named patient, whom I have been seeing for psychological therapy.

PRESENTING DIFFICULTIES
${data.presentingProblem}

TREATMENT SUMMARY
${data.treatmentSummary}
`;

  if (data.letterType === 'referral' && data.reasonForReferral) {
    body += `
REASON FOR REFERRAL
${data.reasonForReferral}
`;
  }

  body += `
RISK ASSESSMENT
Current risk level: ${data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
${data.riskDetails || 'No specific risk concerns identified at this time.'}
`;

  if (data.medicationNotes) {
    body += `
MEDICATION
${data.medicationNotes}
`;
  }

  if (data.recommendations) {
    body += `
RECOMMENDATIONS
${data.recommendations}
`;
  }

  body += `
I would be happy to discuss this patient further if required. Please do not hesitate to contact me.

Yours sincerely,

${therapistData.displayName || 'Therapist'}
${therapistData.qualifications || ''}
${therapistData.registrationBody ? `${therapistData.registrationBody} (${therapistData.registrationNumber || ''})` : ''}
${therapistData.practiceName || ''}
`;

  return body;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/referral-letter', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = letterSchema.safeParse(body);

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

    // Verify tier — referral letters require Pro or Practice
    const userDoc = await db.doc(`users/${therapistId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    if (!['pro', 'practice'].includes(tier)) {
      return NextResponse.json(
        { error: 'Referral letters require Pro or Practice tier' },
        { status: 403 }
      );
    }

    // Verify consent
    const consent = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', parsed.data.clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consent.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    const therapistData = userDoc.data() || {};
    const sanitizedData = {
      ...parsed.data,
      clientName: sanitizeMessage(parsed.data.clientName),
      presentingProblem: sanitizeMessage(parsed.data.presentingProblem),
      treatmentSummary: sanitizeMessage(parsed.data.treatmentSummary),
      reasonForReferral: parsed.data.reasonForReferral ? sanitizeMessage(parsed.data.reasonForReferral) : undefined,
      riskDetails: parsed.data.riskDetails ? sanitizeMessage(parsed.data.riskDetails) : undefined,
      medicationNotes: parsed.data.medicationNotes ? sanitizeMessage(parsed.data.medicationNotes) : undefined,
      recommendations: parsed.data.recommendations ? sanitizeMessage(parsed.data.recommendations) : undefined,
    };

    const letter = generateLetter(sanitizedData, therapistData as Record<string, string>);

    // Store for audit
    const letterId = crypto.randomUUID();
    await db.collection('referralLetters').doc(letterId).set({
      id: letterId,
      therapistId,
      clientId: parsed.data.clientId,
      letterType: parsed.data.letterType,
      recipientType: parsed.data.recipientType,
      recipientName: parsed.data.recipientName,
      createdAt: new Date().toISOString(),
    });

    log.info('Referral letter generated', { therapistId, clientId: parsed.data.clientId, type: parsed.data.letterType });

    return NextResponse.json({ letter, letterId });
  } catch (error) {
    log.error('Referral letter error', {}, error);
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 });
  }
}
