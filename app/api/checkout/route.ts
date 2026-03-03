import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutRateLimit } from '@/lib/rate-limit';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export async function POST(req: Request) {
  try {
    // Rate limiting (#5)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkoutRateLimit(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { tier, userId } = await req.json();

    if (!tier || !userId) {
      return NextResponse.json({ error: 'Missing tier or userId' }, { status: 400 });
    }

    let priceId = '';
    if (tier === 'philosopher') {
      priceId = process.env.STRIPE_PRICE_ID_PHILOSOPHER || '';
    } else if (tier === 'pro') {
      priceId = process.env.STRIPE_PRICE_ID_PRO || '';
    } else {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Payment not configured for this tier. Please contact support.' }, { status: 503 });
    }

    const stripe = getStripe();
    
    // In a real app, you'd use the actual APP_URL.
    // We'll pass it from the client to be safe.
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

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
