import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';

/**
 * Stripe Webhook Handler
 * Verifies payment server-side — the ONLY trusted path for tier upgrades.
 */

const log = createLogger({ route: '/api/webhooks/stripe' });

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is required');
    stripe = new Stripe(key, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
  }
  return stripe;
}

function tierFromPriceId(priceId: string): 'philosopher' | 'pro' | null {
  if (priceId === process.env.STRIPE_PRICE_ID_PHILOSOPHER) return 'philosopher';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  return null;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('Webhook signature verification failed', { message });
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (!userId) {
        log.error('No client_reference_id in checkout session');
        break;
      }

      // Get the subscription to find the price ID
      const subscriptionId = session.subscription as string;
      if (!subscriptionId) {
        log.error('No subscription in checkout session');
        break;
      }

      try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        if (!priceId) {
          log.error('No price ID found in subscription');
          break;
        }

        const tier = tierFromPriceId(priceId);
        if (!tier) {
          log.error('Unknown price ID', { priceId });
          break;
        }

        // Update user tier in Firestore (server-side — trusted)
        const db = getAdminFirestore();
        await db.doc(`users/${userId}`).set(
          {
            tier,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            upgradedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        log.info('User upgraded', { userId, tier });
      } catch (e) {
        log.error('Error processing checkout.session.completed', {}, e);
      }
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status;

      // Find the user by subscription ID
      try {
        const db = getAdminFirestore();
        const usersRef = db.collection('users');
        const snapshot = await usersRef
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];

          if (status === 'canceled' || status === 'unpaid' || event.type === 'customer.subscription.deleted') {
            // Downgrade to free
            await userDoc.ref.set({ tier: 'free', stripeSubscriptionId: null }, { merge: true });
            log.info('User downgraded to free', { userId: userDoc.id });
          } else if (status === 'active') {
            // Verify tier matches current price
            const priceId = subscription.items.data[0]?.price?.id;
            const tier = priceId ? tierFromPriceId(priceId) : null;
            if (tier) {
              await userDoc.ref.set({ tier }, { merge: true });
            }
          }
        }
      } catch (e) {
        log.error('Error processing subscription event', {}, e);
      }
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
