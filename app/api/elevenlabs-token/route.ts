import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';
import { ELEVENLABS_CONFIG } from '@/lib/elevenlabs-client';

/**
 * POST /api/elevenlabs-token — Returns a signed conversation URL for ElevenLabs.
 * 
 * Validates:
 * 1. User is authenticated
 * 2. User has a voice-eligible tier (pro or practice)
 * 3. User hasn't exceeded monthly voice minutes
 * 
 * Returns the agent ID and signed URL for client-side conversation init.
 */
export async function POST(req: Request) {
  const log = createLogger({ route: '/api/elevenlabs-token', correlationId: crypto.randomUUID() });

  try {
    // ── Auth ────────────────────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // ── Check ElevenLabs config ────────────────────────────────
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      log.warn('ElevenLabs not configured');
      return NextResponse.json(
        { error: 'Voice sessions are not yet configured. Coming soon.' },
        { status: 503 }
      );
    }

    // ── Tier gate — check voice eligibility ────────────────────
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tier = userData?.tier || 'free';

    const voiceLimit = ELEVENLABS_CONFIG.voiceLimits[tier] || 0;

    if (voiceLimit === 0) {
      return NextResponse.json(
        { 
          error: 'Voice sessions require a Philosopher, Pro, or Practice subscription.',
          upgrade: true,
          requiredTier: 'philosopher',
        },
        { status: 403 }
      );
    }

    // ── Check monthly voice usage ──────────────────────────────
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageDoc = await db.collection('voiceUsage').doc(`${userId}_${monthKey}`).get();
    const currentMinutes = usageDoc.exists ? (usageDoc.data()?.minutesUsed || 0) : 0;

    if (voiceLimit !== Infinity && currentMinutes >= voiceLimit) {
      return NextResponse.json(
        { 
          error: `You've used all ${voiceLimit} voice minutes this month. Upgrade for more.`,
          minutesUsed: currentMinutes,
          minutesLimit: voiceLimit,
          upgrade: true,
        },
        { status: 429 }
      );
    }

    // ── Get signed URL from ElevenLabs ─────────────────────────
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error('ElevenLabs signed URL failed', { status: response.status, error: errorText });
      return NextResponse.json(
        { error: 'Failed to initialize voice session. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    log.info('Voice session token issued', { 
      userId, 
      tier, 
      minutesUsed: currentMinutes,
      minutesLimit: voiceLimit === Infinity ? 'unlimited' : voiceLimit,
    });

    return NextResponse.json({
      signedUrl: data.signed_url,
      agentId,
      minutesUsed: currentMinutes,
      minutesLimit: voiceLimit === Infinity ? null : voiceLimit,
      minutesRemaining: voiceLimit === Infinity ? null : Math.max(0, voiceLimit - currentMinutes),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (err: unknown) {
    log.error('ElevenLabs token error', {}, err);
    return NextResponse.json(
      { error: 'Failed to initialize voice session.' },
      { status: 500 }
    );
  }
}
