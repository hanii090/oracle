import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const warningSignSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  category: z.enum(['thoughts', 'feelings', 'behaviours', 'physical']),
});

const supportPersonSchema = z.object({
  name: z.string().max(100),
  phone: z.string().max(20),
  howTheyHelp: z.string().max(200),
});

const updatePlanSchema = z.object({
  warningSignsEarly: z.array(warningSignSchema).optional(),
  warningSignsLate: z.array(warningSignSchema).optional(),
  copingStrategies: z.array(z.string().max(500)).optional(),
  supportPeople: z.array(supportPersonSchema).optional(),
  reasonsToStayWell: z.array(z.string().max(500)).optional(),
});

export interface RelapsePlan {
  userId: string;
  warningSignsEarly: Array<{ id: string; text: string; category: string }>;
  warningSignsLate: Array<{ id: string; text: string; category: string }>;
  copingStrategies: string[];
  supportPeople: Array<{ name: string; phone: string; howTheyHelp: string }>;
  actionPlan: Array<{ trigger: string; action: string }>;
  reasonsToStayWell: string[];
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/relapse-prevention', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ plan: null });
    }

    // Tier gating: Relapse prevention is a Plus+ feature (philosopher, pro, practice)
    const db = getAdminFirestore();
    const userDoc = await db.doc(`users/${userId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Relapse prevention plan requires Patient Plus or higher subscription' },
        { status: 403 }
      );
    }
    const planDoc = await db.collection('relapsePlans').doc(userId).get();

    if (!planDoc.exists) {
      // Return empty plan template
      return NextResponse.json({
        plan: {
          userId,
          warningSignsEarly: [],
          warningSignsLate: [],
          copingStrategies: [],
          supportPeople: [],
          actionPlan: [],
          reasonsToStayWell: [],
          createdAt: null,
          updatedAt: null,
        },
      });
    }

    return NextResponse.json({ plan: planDoc.data() });
  } catch (error) {
    log.error('Relapse prevention fetch error', {}, error);
    return NextResponse.json({ plan: null });
  }
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/relapse-prevention', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Tier gating: Relapse prevention is a Plus+ feature (philosopher, pro, practice)
    const db = getAdminFirestore();
    const userDoc = await db.doc(`users/${userId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';
    
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Relapse prevention plan requires Patient Plus or higher subscription' },
        { status: 403 }
      );
    }

    const planRef = db.collection('relapsePlans').doc(userId);
    const existingDoc = await planRef.get();
    const existingPlan = existingDoc.exists ? existingDoc.data() as RelapsePlan : null;

    const now = new Date().toISOString();
    const updates = parsed.data;

    // Sanitize text content
    const sanitizedUpdates: Partial<RelapsePlan> = {
      updatedAt: now,
    };

    if (updates.warningSignsEarly) {
      sanitizedUpdates.warningSignsEarly = updates.warningSignsEarly.map(sign => ({
        ...sign,
        text: sanitizeMessage(sign.text),
      }));
    }

    if (updates.warningSignsLate) {
      sanitizedUpdates.warningSignsLate = updates.warningSignsLate.map(sign => ({
        ...sign,
        text: sanitizeMessage(sign.text),
      }));
    }

    if (updates.copingStrategies) {
      sanitizedUpdates.copingStrategies = updates.copingStrategies.map(s => sanitizeMessage(s));
    }

    if (updates.supportPeople) {
      sanitizedUpdates.supportPeople = updates.supportPeople.map(person => ({
        name: sanitizeMessage(person.name),
        phone: person.phone,
        howTheyHelp: sanitizeMessage(person.howTheyHelp),
      }));
    }

    if (updates.reasonsToStayWell) {
      sanitizedUpdates.reasonsToStayWell = updates.reasonsToStayWell.map(r => sanitizeMessage(r));
    }

    if (existingPlan) {
      await planRef.update(sanitizedUpdates);
    } else {
      const newPlan: RelapsePlan = {
        userId,
        warningSignsEarly: sanitizedUpdates.warningSignsEarly || [],
        warningSignsLate: sanitizedUpdates.warningSignsLate || [],
        copingStrategies: sanitizedUpdates.copingStrategies || [],
        supportPeople: sanitizedUpdates.supportPeople || [],
        actionPlan: [],
        reasonsToStayWell: sanitizedUpdates.reasonsToStayWell || [],
        createdAt: now,
        updatedAt: now,
      };
      await planRef.set(newPlan);
    }

    const updatedDoc = await planRef.get();
    log.info('Relapse prevention plan updated', { userId });

    return NextResponse.json({ plan: updatedDoc.data() });
  } catch (error) {
    log.error('Relapse prevention update error', {}, error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
