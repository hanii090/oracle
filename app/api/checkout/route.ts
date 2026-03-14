import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutRateLimit } from '@/lib/rate-limit';
import { verifyAuth } from '@/lib/auth-middleware';
import { getStripeEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { sanitizeIp } from '@/lib/safety';
import { STRIPE_PRICE_ENV_KEYS, TRIAL_DAYS, getPlan } from '@/lib/pricing-config';
import { z } from 'zod';
import { sanitizeIp } from '@/lib/safety';

const checkoutSchema = z.object({
  tier: z.enum(['philosopher', 'pro', 'practice']),
  therapistCredentials: z.object({
    registrationBody: z.string().min(1),
    registrationNumber: z.string().min(1),
    practiceName: z.string().optional(),
  }).optional(),
});

let stripeClient: Stripe | null = null;

function getStripe(secretKey: string): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/checkout', correlationId: crypto.randomUUID() });

  try {
    // ── Validate Stripe is configured ──────────────────────────
    let stripeEnv;
    try {
      stripeEnv = getStripeEnv();
    } catch {
      return NextResponse.json(
        { error: 'Payments are not currently available. Please try again later.' },
        { status: 503 }
      );
    }

    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Rate limiting (#5)
    const ip = sanitizeIp(req.headers.get('x-forwarded-for')?.split(',')[0]);
    const rateCheck = checkoutRateLimit(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { tier, therapistCredentials } = parsed.data;

    // Validate therapist credentials for practice tier
    if (tier === 'practice') {
      if (!therapistCredentials?.registrationBody || !therapistCredentials?.registrationNumber) {
        return NextResponse.json({ 
          error: 'Professional registration details are required for clinical practice accounts' 
        }, { status: 400 });
      }
    }

    // Resolve Stripe price ID from pricing config (single source of truth)
    const envKey = STRIPE_PRICE_ENV_KEYS[tier];
    if (!envKey) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const priceId = (stripeEnv as Record<string, string | undefined>)[envKey] || '';
    const plan = getPlan(tier as 'philosopher' | 'pro' | 'practice');

    if (!priceId) {
      log.warn('Price ID not configured', { tier, envKey });
      return NextResponse.json({
        error: tier === 'practice'
          ? 'Clinical Practice subscriptions are coming soon. Please contact hello@sorca.life to join the waitlist.'
          : 'This subscription tier is not yet available. Please try again later or contact support.',
        waitlist: tier === 'practice',
      }, { status: 503 });
    }

    const stripe = getStripe(stripeEnv.STRIPE_SECRET_KEY);
    
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Free trial from pricing config (single source of truth)
      subscription_data: {
        trial_period_days: plan?.trialDays || TRIAL_DAYS,
      },
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      client_reference_id: userId,
      metadata: tier === 'practice' && therapistCredentials ? {
        therapist_registration_body: therapistCredentials.registrationBody,
        therapist_registration_number: therapistCredentials.registrationNumber,
        therapist_practice_name: therapistCredentials.practiceName || '',
      } : undefined,
    });

    log.info('Checkout session created', { userId, tier, sessionId: session.id });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    log.error('Stripe Checkout error', {}, err);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
