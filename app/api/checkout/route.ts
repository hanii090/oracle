import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    const { tier, userId } = await req.json();

    if (!tier || !userId) {
      return NextResponse.json({ error: 'Missing tier or userId' }, { status: 400 });
    }

    let priceId = '';
    if (tier === 'philosopher') {
      priceId = process.env.STRIPE_PRICE_ID_PHILOSOPHER || 'price_philosopher_placeholder';
    } else if (tier === 'pro') {
      priceId = process.env.STRIPE_PRICE_ID_PRO || 'price_pro_placeholder';
    } else {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
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
      success_url: `${origin}/?success=true&tier=${tier}`,
      cancel_url: `${origin}/?canceled=true`,
      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
