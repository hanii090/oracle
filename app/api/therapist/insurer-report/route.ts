import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';
import { getInsurerTemplate, populateTemplate, getInsurerList, type InsurerReportData } from '@/lib/insurer-templates';

const reportSchema = z.object({
  insurerId: z.string(),
  clientId: z.string(),
  clientName: z.string().max(200),
  clientDOB: z.string(),
  policyNumber: z.string().max(100),
  claimNumber: z.string().max(100).optional(),
  referralDate: z.string(),
  presentingProblem: z.string().max(5000),
  diagnosis: z.string().max(500).optional(),
  treatmentModality: z.string().max(200),
  sessionFrequency: z.string().max(100),
  sessionsAttended: z.number().min(0),
  sessionsAuthorised: z.number().min(0).optional(),
  sessionsRequested: z.number().min(0).optional(),
  initialPHQ9: z.number().min(0).max(27).optional(),
  currentPHQ9: z.number().min(0).max(27).optional(),
  initialGAD7: z.number().min(0).max(21).optional(),
  currentGAD7: z.number().min(0).max(21).optional(),
  progressSummary: z.string().max(5000),
  treatmentPlan: z.string().max(3000),
  riskAssessment: z.string().max(2000),
  treatmentStartDate: z.string(),
  expectedEndDate: z.string().optional(),
});

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/therapist/insurer-report', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

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

    // Verify tier — insurer reports require Pro or Practice tier
    const userDoc = await db.doc(`users/${therapistId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    if (!['pro', 'practice'].includes(tier)) {
      return NextResponse.json(
        { error: 'Insurer reports require Pro or Practice tier' },
        { status: 403 }
      );
    }

    // Verify consent for this client
    const consent = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('patientId', '==', parsed.data.clientId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (consent.empty) {
      return NextResponse.json({ error: 'No active consent for this client' }, { status: 403 });
    }

    const template = getInsurerTemplate(parsed.data.insurerId);
    if (!template) {
      return NextResponse.json({ error: 'Unknown insurer template' }, { status: 400 });
    }

    // Get therapist details
    const therapistData = userDoc.data();
    const now = new Date().toISOString().split('T')[0];

    const reportData: Partial<InsurerReportData> = {
      clientName: sanitizeMessage(parsed.data.clientName),
      clientDOB: parsed.data.clientDOB,
      policyNumber: parsed.data.policyNumber,
      claimNumber: parsed.data.claimNumber,
      therapistName: therapistData?.displayName || 'Therapist',
      therapistQualifications: therapistData?.qualifications || '[Qualifications]',
      therapistRegistration: therapistData?.registrationBody 
        ? `${therapistData.registrationBody} (${therapistData.registrationNumber || 'N/A'})`
        : '[Registration details]',
      practiceName: therapistData?.practiceName || '',
      practiceAddress: therapistData?.practiceAddress || '',
      referralDate: parsed.data.referralDate,
      presentingProblem: sanitizeMessage(parsed.data.presentingProblem),
      diagnosis: parsed.data.diagnosis ? sanitizeMessage(parsed.data.diagnosis) : undefined,
      treatmentModality: parsed.data.treatmentModality,
      sessionFrequency: parsed.data.sessionFrequency,
      sessionsAttended: parsed.data.sessionsAttended,
      sessionsAuthorised: parsed.data.sessionsAuthorised,
      sessionsRequested: parsed.data.sessionsRequested,
      initialPHQ9: parsed.data.initialPHQ9,
      currentPHQ9: parsed.data.currentPHQ9,
      initialGAD7: parsed.data.initialGAD7,
      currentGAD7: parsed.data.currentGAD7,
      progressSummary: sanitizeMessage(parsed.data.progressSummary),
      treatmentPlan: sanitizeMessage(parsed.data.treatmentPlan),
      riskAssessment: sanitizeMessage(parsed.data.riskAssessment),
      reportDate: now,
      treatmentStartDate: parsed.data.treatmentStartDate,
      expectedEndDate: parsed.data.expectedEndDate,
    };

    const populatedReport = populateTemplate(template.template, reportData);

    // Store report for audit
    const reportId = crypto.randomUUID();
    await db.collection('insurerReports').doc(reportId).set({
      id: reportId,
      therapistId,
      clientId: parsed.data.clientId,
      insurerId: parsed.data.insurerId,
      insurerName: template.name,
      reportData,
      createdAt: new Date().toISOString(),
    });

    log.info('Insurer report generated', { therapistId, clientId: parsed.data.clientId, insurer: template.name });

    return NextResponse.json({
      report: populatedReport,
      reportId,
      insurerName: template.name,
      notes: template.notes,
    });
  } catch (error) {
    log.error('Insurer report error', {}, error);
    return NextResponse.json({ error: 'Failed to generate insurer report' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/insurer-report', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // List available insurers
    if (action === 'list') {
      return NextResponse.json({ insurers: getInsurerList() });
    }

    // List past reports
    const { userId: therapistId } = authResult;
    const clientId = url.searchParams.get('clientId');

    if (!isAdminConfigured()) {
      return NextResponse.json({ reports: [] });
    }

    const db = getAdminFirestore();
    let query = db.collection('insurerReports')
      .where('therapistId', '==', therapistId)
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (clientId) {
      query = db.collection('insurerReports')
        .where('therapistId', '==', therapistId)
        .where('clientId', '==', clientId)
        .orderBy('createdAt', 'desc')
        .limit(20);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map(d => ({
      id: d.data().id,
      insurerName: d.data().insurerName,
      clientId: d.data().clientId,
      createdAt: d.data().createdAt,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    log.error('Insurer reports list error', {}, error);
    return NextResponse.json({ reports: [] });
  }
}
