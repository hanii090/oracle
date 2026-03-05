import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const createConcernSchema = z.object({
  patientId: z.string(),
  concernType: z.enum(['child_protection', 'adult_at_risk', 'domestic_abuse', 'self_neglect', 'exploitation', 'other']),
  description: z.string().max(5000),
  riskLevel: z.enum(['low', 'medium', 'high', 'immediate']),
  actionsTaken: z.array(z.string()).optional(),
  referralMade: z.boolean().default(false),
  referralDetails: z.string().max(2000).optional(),
  localAuthorityContacted: z.boolean().default(false),
  policeContacted: z.boolean().default(false),
});

const updateConcernSchema = z.object({
  concernId: z.string(),
  status: z.enum(['open', 'monitoring', 'referred', 'closed']).optional(),
  actionsTaken: z.array(z.string()).optional(),
  followUpNotes: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
});

export interface SafeguardingConcern {
  id: string;
  patientId: string;
  therapistId: string;
  concernType: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'immediate';
  status: 'open' | 'monitoring' | 'referred' | 'closed';
  actionsTaken: string[];
  referralMade: boolean;
  referralDetails?: string;
  localAuthorityContacted: boolean;
  policeContacted: boolean;
  followUpNotes?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

// UK Local Authority Safeguarding Contacts (sample - would be expanded)
export const UK_SAFEGUARDING_CONTACTS = {
  children: {
    national: 'NSPCC Helpline: 0808 800 5000',
    emergency: 'Police: 999',
    advice: 'Local Authority Children\'s Services (check local directory)',
  },
  adults: {
    national: 'Adult Social Care (local authority)',
    emergency: 'Police: 999',
    advice: 'Age UK: 0800 678 1602',
  },
  domesticAbuse: {
    national: 'National Domestic Abuse Helpline: 0808 2000 247',
    emergency: 'Police: 999',
    menSupport: 'Men\'s Advice Line: 0808 801 0327',
  },
};

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/safeguarding', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = createConcernSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { 
      patientId, concernType, description, riskLevel, 
      actionsTaken, referralMade, referralDetails,
      localAuthorityContacted, policeContacted 
    } = parsed.data;

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
    const concern: SafeguardingConcern = {
      id: crypto.randomUUID(),
      patientId,
      therapistId,
      concernType,
      description: sanitizeMessage(description),
      riskLevel,
      status: referralMade ? 'referred' : 'open',
      actionsTaken: actionsTaken || [],
      referralMade,
      referralDetails: referralDetails ? sanitizeMessage(referralDetails) : undefined,
      localAuthorityContacted,
      policeContacted,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('safeguardingConcerns').doc(concern.id).set(concern);

    // Create audit log
    await db.collection('safeguardingAudit').add({
      concernId: concern.id,
      action: 'created',
      therapistId,
      patientId,
      riskLevel,
      concernType,
      timestamp: now,
    });

    // Create high-priority pattern alert for immediate risk
    if (riskLevel === 'immediate' || riskLevel === 'high') {
      await db.collection('patternAlerts').add({
        therapistId,
        clientId: patientId,
        clientName: 'Client',
        type: 'distress',
        message: `Safeguarding concern raised: ${concernType} (${riskLevel} risk)`,
        severity: riskLevel === 'immediate' ? 'crisis' : 'high',
        createdAt: now,
        acknowledged: true,
        safeguardingConcernId: concern.id,
      });
    }

    log.info('Safeguarding concern created', { 
      therapistId, 
      patientId, 
      concernId: concern.id, 
      riskLevel,
      concernType,
    });

    return NextResponse.json({ 
      concern,
      contacts: UK_SAFEGUARDING_CONTACTS,
    });
  } catch (error) {
    log.error('Safeguarding concern creation error', {}, error);
    return NextResponse.json({ error: 'Failed to create safeguarding concern' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const log = createLogger({ route: '/api/safeguarding', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const body = await req.json();
    const parsed = updateConcernSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { concernId, ...updates } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const concernRef = db.collection('safeguardingConcerns').doc(concernId);
    const concernDoc = await concernRef.get();

    if (!concernDoc.exists) {
      return NextResponse.json({ error: 'Concern not found' }, { status: 404 });
    }

    const existingConcern = concernDoc.data() as SafeguardingConcern;

    if (existingConcern.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updateData: Partial<SafeguardingConcern> = {
      updatedAt: now,
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.actionsTaken) {
      updateData.actionsTaken = [...existingConcern.actionsTaken, ...updates.actionsTaken];
    }
    if (updates.followUpNotes) updateData.followUpNotes = sanitizeMessage(updates.followUpNotes);
    if (updates.outcome) updateData.outcome = sanitizeMessage(updates.outcome);

    await concernRef.update(updateData);

    // Create audit log
    await db.collection('safeguardingAudit').add({
      concernId,
      action: 'updated',
      therapistId,
      patientId: existingConcern.patientId,
      changedFields: Object.keys(updates),
      timestamp: now,
    });

    log.info('Safeguarding concern updated', { therapistId, concernId });

    return NextResponse.json({ 
      success: true,
      concern: { ...existingConcern, ...updateData },
    });
  } catch (error) {
    log.error('Safeguarding concern update error', {}, error);
    return NextResponse.json({ error: 'Failed to update safeguarding concern' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/safeguarding', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    const url = new URL(req.url);
    const concernId = url.searchParams.get('concernId');
    const patientId = url.searchParams.get('patientId');
    const status = url.searchParams.get('status');
    const includeContacts = url.searchParams.get('contacts') === 'true';

    if (!isAdminConfigured()) {
      return NextResponse.json({ concerns: [], contacts: includeContacts ? UK_SAFEGUARDING_CONTACTS : undefined });
    }

    const db = getAdminFirestore();

    // Single concern fetch
    if (concernId) {
      const concernDoc = await db.collection('safeguardingConcerns').doc(concernId).get();
      if (!concernDoc.exists) {
        return NextResponse.json({ error: 'Concern not found' }, { status: 404 });
      }

      const concern = concernDoc.data() as SafeguardingConcern;
      if (concern.therapistId !== therapistId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ 
        concern,
        contacts: includeContacts ? UK_SAFEGUARDING_CONTACTS : undefined,
      });
    }

    // List concerns
    let query = db.collection('safeguardingConcerns')
      .where('therapistId', '==', therapistId)
      .orderBy('createdAt', 'desc');

    if (patientId) {
      query = db.collection('safeguardingConcerns')
        .where('therapistId', '==', therapistId)
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc');
    }

    if (status) {
      query = db.collection('safeguardingConcerns')
        .where('therapistId', '==', therapistId)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(50).get();
    const concerns = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ 
      concerns,
      contacts: includeContacts ? UK_SAFEGUARDING_CONTACTS : undefined,
    });
  } catch (error) {
    log.error('Safeguarding concerns fetch error', {}, error);
    return NextResponse.json({ concerns: [] });
  }
}
