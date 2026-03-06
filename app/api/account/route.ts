import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { getStripeEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';

/**
 * GET /api/account — Verify and sync subscription status from Stripe.
 * Called after checkout success to ensure the tier is updated.
 *
 * DELETE /api/account — Delete user account and all associated data.
 * Implements the "right to erasure" promised in the privacy policy.
 */

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripeClient) {
    try {
      const env = getStripeEnv();
      stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
    } catch {
      return null;
    }
  }
  return stripeClient;
}

function tierFromPriceId(priceId: string): 'philosopher' | 'pro' | 'practice' | null {
  if (priceId === process.env.STRIPE_PRICE_ID_PHILOSOPHER) return 'philosopher';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ID_PRACTICE) return 'practice';
  return null;
}

/**
 * GET /api/account — Verify subscription status and sync tier.
 * This is the safety net: if the webhook was delayed or failed,
 * we check Stripe directly and update Firestore.
 */
export async function GET(req: Request) {
  const log = createLogger({ route: '/api/account', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const db = getAdminFirestore();
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.exists ? userDoc.data()! : {};
    const currentTier = userData.tier || 'free';

    // If user already has a Stripe customer ID, verify their subscription
    if (userData.stripeCustomerId) {
      try {
        const stripe = getStripe();
        if (!stripe) throw new Error('Stripe not configured');
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripeCustomerId as string,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          const priceId = sub.items.data[0]?.price?.id;
          const tier = priceId ? tierFromPriceId(priceId) : null;

          if (tier && tier !== currentTier) {
            // Sync the tier — webhook may have been delayed
            await db.doc(`users/${userId}`).set(
              {
                tier,
                stripeSubscriptionId: sub.id,
                upgradedAt: new Date().toISOString(),
              },
              { merge: true }
            );
            log.info('Subscription synced via account check', { userId, tier, previousTier: currentTier });
            return NextResponse.json({ tier, synced: true });
          }

          return NextResponse.json({ tier: currentTier, synced: false });
        } else {
          // No active subscription — ensure user is on free tier
          if (currentTier !== 'free') {
            await db.doc(`users/${userId}`).set(
              { tier: 'free', stripeSubscriptionId: null },
              { merge: true }
            );
            log.info('Downgraded to free (no active subscription)', { userId });
            return NextResponse.json({ tier: 'free', synced: true });
          }
        }
      } catch (e) {
        log.error('Stripe subscription check failed', {}, e);
      }
    }

    // No Stripe customer — check if there's a recent checkout session for this user
    try {
      const stripe = getStripe();
      if (!stripe) throw new Error('Stripe not configured');
      const sessions = await stripe.checkout.sessions.list({
        limit: 5,
      });

      for (const session of sessions.data) {
        if (
          session.client_reference_id === userId &&
          session.payment_status === 'paid' &&
          session.subscription
        ) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          if (sub.status === 'active') {
            const priceId = sub.items.data[0]?.price?.id;
            const tier = priceId ? tierFromPriceId(priceId) : null;

            if (tier) {
              await db.doc(`users/${userId}`).set(
                {
                  tier,
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: sub.id,
                  upgradedAt: new Date().toISOString(),
                },
                { merge: true }
              );
              log.info('Subscription recovered from checkout session', { userId, tier });
              return NextResponse.json({ tier, synced: true });
            }
          }
        }
      }
    } catch (e) {
      log.error('Checkout session recovery check failed', {}, e);
    }

    return NextResponse.json({ tier: currentTier, synced: false });
  } catch (error) {
    log.error('Account verification error', {}, error);
    return NextResponse.json(
      { error: 'Failed to verify account status' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/account', correlationId: crypto.randomUUID() });

  try {
    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Account deletion requested', { userId });

    const db = getAdminFirestore();
    const userDoc = await db.doc(`users/${userId}`).get();

    if (userDoc.exists) {
      const userData = userDoc.data()!;

      // Cancel Stripe subscription if active
      if (userData.stripeSubscriptionId) {
        try {
          const stripe = getStripe();
          if (!stripe) throw new Error('Stripe not configured');
          await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
          log.info('Stripe subscription cancelled', { userId, subscriptionId: userData.stripeSubscriptionId });
        } catch (e) {
          log.warn('Failed to cancel Stripe subscription (may already be cancelled)', {}, e);
        }
      }

      // Delete all sessions (subcollection)
      const sessionsSnapshot = await db.collection(`users/${userId}/sessions`).get();
      const batch = db.batch();

      for (const doc of sessionsSnapshot.docs) {
        batch.delete(doc.ref);
      }

      // Delete user profile
      batch.delete(db.doc(`users/${userId}`));

      // Delete thread
      batch.delete(db.doc(`threads/${userId}`));

      await batch.commit();

      log.info('Account data deleted from Firestore', { userId, sessionsDeleted: sessionsSnapshot.size });
    }

    // Delete Firebase Auth account
    try {
      const { getAuth } = await import('firebase-admin/auth');
      await getAuth().deleteUser(userId);
      log.info('Firebase Auth user deleted', { userId });
    } catch (e) {
      log.warn('Failed to delete Firebase Auth user (may not exist)', {}, e);
    }

    return NextResponse.json({ success: true, message: 'Account and all data deleted.' });
  } catch (error) {
    log.error('Account deletion error', {}, error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}
