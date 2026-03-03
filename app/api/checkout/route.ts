import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutRateLimit } from '@/lib/rate-limit';
import { verifyAuth } from '@/lib/auth-middleware';
import { getStripeEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';

let stripeClient: Stripe | null = null;

function getStripe(secretKey: string): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkoutRateLimit(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { tier } = await req.json();

    if (!tier) {
      return NextResponse.json({ error: 'Missing tier' }, { status: 400 });
    }

    let priceId = '';
    if (tier === 'philosopher') {
      priceId = stripeEnv.STRIPE_PRICE_ID_PHILOSOPHER;
    } else if (tier === 'pro') {
      priceId = stripeEnv.STRIPE_PRICE_ID_PRO;
    } else {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Payment not configured for this tier. Please contact support.' }, { status: 503 });
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
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      client_reference_id: userId,
    });

    log.info('Checkout session created', { userId, tier, sessionId: session.id });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    log.error('Stripe Checkout error', {}, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
