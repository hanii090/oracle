import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const thoughtDropSchema = z.object({
  content: z.string().min(1).max(500),
});

export interface ThoughtDrop {
  id: string;
  userId: string;
  content: string;
  socraticResponse: string | null;
  createdAt: string;
  surfacedToTherapist: boolean;
}

// Generate a single Socratic response to a thought drop
function generateSocraticResponse(content: string): string {
  const lowerContent = content.toLowerCase();

  // Pattern-matched Socratic responses
  if (lowerContent.includes('anxious') || lowerContent.includes('worry') || lowerContent.includes('scared') || lowerContent.includes('afraid')) {
    const responses = [
      'What is this anxiety trying to protect you from?',
      'If you sat with this worry for a moment longer, what do you think it would tell you?',
      'When you imagine the worst outcome, how likely does it actually feel — and what would you do if it happened?',
      'What would it mean about you if this fear turned out to be unfounded?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('angry') || lowerContent.includes('frustrated') || lowerContent.includes('annoyed') || lowerContent.includes('furious')) {
    const responses = [
      'What boundary was crossed to create this anger?',
      'If the anger could speak, what would it demand on your behalf?',
      'What is underneath the anger — is there a hurt, a fear, or a need?',
      'What would it look like to honour this anger without being controlled by it?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('sad') || lowerContent.includes('down') || lowerContent.includes('low') || lowerContent.includes('hopeless') || lowerContent.includes('empty')) {
    const responses = [
      'What does this sadness need from you right now?',
      'If this feeling could tell you something important, what might it be?',
      'When was the last time this heaviness lifted, even briefly — what was different?',
      'What would it mean to be gentle with yourself in this moment?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('guilt') || lowerContent.includes('ashamed') || lowerContent.includes('regret') || lowerContent.includes('should have')) {
    const responses = [
      'If a friend told you they felt this guilt, what would you say to them?',
      'What standard are you holding yourself to — and who set it?',
      'Is this guilt pointing to something you want to repair, or something you need to release?',
      'What would self-forgiveness look like here — not excusing, but understanding?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('relationship') || lowerContent.includes('partner') || lowerContent.includes('friend') || lowerContent.includes('family') || lowerContent.includes('parent')) {
    const responses = [
      'What do you need from this person that you find hardest to ask for?',
      'What pattern keeps showing up in this relationship — and does it feel familiar from elsewhere in your life?',
      'If you could say the thing you have been holding back, what would it be?',
      'What would this relationship look like if both people felt truly heard?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('work') || lowerContent.includes('job') || lowerContent.includes('career') || lowerContent.includes('boss') || lowerContent.includes('colleague')) {
    const responses = [
      'What does this situation tell you about what you value in your working life?',
      'If you could change one thing about this dynamic, what would it be?',
      'What would it look like to bring more of who you really are into your work?',
      'Is this a problem to solve, or a signal to listen to?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerContent.includes('sleep') || lowerContent.includes('night') || lowerContent.includes('dream') || lowerContent.includes('insomnia') || lowerContent.includes('awake')) {
    const responses = [
      'What tends to occupy your mind when sleep will not come?',
      'If your wakefulness is trying to process something, what might it be?',
      'What would you need to feel safe enough to let go of the day?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Default Socratic responses
  const defaults = [
    'What made this thought feel important enough to write down?',
    'If you followed this thought to its root, what do you think you would find?',
    'What would change if you truly believed what you just wrote?',
    'What is this thought asking you to pay attention to?',
    'If you could sit with this thought without judgement, what would you notice?',
    'What does this tell you about what matters to you right now?',
    'If this thought were a question rather than a statement, what would it be asking?',
    'What would the wisest version of you say about this?',
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/thought-drop', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = thoughtDropSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sanitizedContent = sanitizeMessage(parsed.data.content);
    const socraticResponse = generateSocraticResponse(sanitizedContent);

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const now = new Date().toISOString();

    const drop: ThoughtDrop = {
      id: crypto.randomUUID(),
      userId,
      content: sanitizedContent,
      socraticResponse,
      createdAt: now,
      surfacedToTherapist: false,
    };

    await db.collection('thoughtDrops').doc(drop.id).set(drop);

    log.info('Thought drop saved', { userId, dropId: drop.id });

    return NextResponse.json({ drop });
  } catch (error) {
    log.error('Thought drop error', {}, error);
    return NextResponse.json({ error: 'Failed to save thought' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/thought-drop', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const clientId = url.searchParams.get('clientId');

    if (!isAdminConfigured()) {
      return NextResponse.json({ drops: [] });
    }

    const db = getAdminFirestore();

    // If clientId provided, this is a therapist requesting thought drops
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
      if (!consentData.permissions?.shareWeekSummary) {
        return NextResponse.json({ error: 'Client has not consented to sharing reflections' }, { status: 403 });
      }

      targetUserId = clientId;

      // Mark as surfaced to therapist
      const dropsSnapshot = await db.collection('thoughtDrops')
        .where('userId', '==', targetUserId)
        .where('surfacedToTherapist', '==', false)
        .limit(50)
        .get();

      const batch = db.batch();
      for (const doc of dropsSnapshot.docs) {
        batch.update(doc.ref, { surfacedToTherapist: true });
      }
      await batch.commit();
    }

    const snapshot = await db.collection('thoughtDrops')
      .where('userId', '==', targetUserId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const drops = snapshot.docs.map(d => d.data());

    return NextResponse.json({ drops });
  } catch (error) {
    log.error('Thought drops fetch error', {}, error);
    return NextResponse.json({ drops: [] });
  }
}
