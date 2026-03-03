import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { getServerEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';

/**
 * POST /api/billing/portal — Create a Stripe Customer Portal session
 * Allows users to manage their subscription, update payment methods, view invoices.
 */

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const env = getServerEnv();
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
  }
  return stripeClient;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/billing/portal', correlationId: crypto.randomUUID() });

  try {
    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Look up the user's Stripe customer ID from Firestore
    const db = getAdminFirestore();
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. You are on the free tier.' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/`,
    });

    log.info('Portal session created', { userId });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    log.error('Billing portal error', {}, error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
