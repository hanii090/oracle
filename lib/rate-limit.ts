/**
 * Rate limiter with Upstash Redis support and in-memory fallback.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars to enable Redis.
 * Otherwise, falls back to the in-memory implementation (suitable for single-instance).
 */

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// ── In-memory store (fallback) ─────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

function inMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  return { success: false, remaining: 0, resetAt: entry.resetAt };
}

// ── Redis-backed rate limiter (Upstash) ────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

async function redisRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const windowSec = Math.ceil(config.windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  try {
    // Use Upstash REST API — INCR + EXPIRE atomic pipeline
    const pipelineRes = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, windowSec.toString()],
      ]),
    });

    if (!pipelineRes.ok) {
      throw new Error(`Upstash returned ${pipelineRes.status}`);
    }

    const results = await pipelineRes.json() as Array<{ result: number }>;
    const currentCount = results[0]?.result ?? 1;
    const resetAt = Date.now() + config.windowMs;

    if (currentCount > config.maxRequests) {
      return { success: false, remaining: 0, resetAt };
    }

    return {
      success: true,
      remaining: config.maxRequests - currentCount,
      resetAt,
    };
  } catch (e) {
    console.warn('[rate-limit] Redis error, falling back to in-memory:', e instanceof Error ? e.message : e);
    return inMemoryRateLimit(key, config);
  }
}

/**
 * Check and consume a rate limit token for the given key.
 * Uses Redis when configured, in-memory otherwise.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  // For async Redis, we need a sync wrapper — use in-memory for now
  // and call rateLimitAsync for routes that can await.
  return inMemoryRateLimit(key, config);
}

/**
 * Async rate limiter — uses Redis when available.
 */
export async function rateLimitAsync(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (useRedis) {
    return redisRateLimit(key, config);
  }
  return inMemoryRateLimit(key, config);
}

// ── Pre-configured limiters ────────────────────────────────────────

/** Checkout: 5 requests per minute per IP */
export function checkoutRateLimit(ip: string): RateLimitResult {
  return rateLimit(`checkout:${ip}`, { maxRequests: 5, windowMs: 60_000 });
}

/** Sorca AI: 20 requests per minute per user */
export function sorcaRateLimit(userId: string): RateLimitResult {
  return rateLimit(`sorca:${userId}`, { maxRequests: 20, windowMs: 60_000 });
}

/** Session validation: 10 requests per minute per user */
export function sessionRateLimit(userId: string): RateLimitResult {
  return rateLimit(`session:${userId}`, { maxRequests: 10, windowMs: 60_000 });
}

/** Async versions — use Redis when available */
export async function sorcaRateLimitAsync(userId: string): Promise<RateLimitResult> {
  return rateLimitAsync(`sorca:${userId}`, { maxRequests: 20, windowMs: 60_000 });
}

export async function checkoutRateLimitAsync(ip: string): Promise<RateLimitResult> {
  return rateLimitAsync(`checkout:${ip}`, { maxRequests: 5, windowMs: 60_000 });
}

export async function sessionRateLimitAsync(userId: string): Promise<RateLimitResult> {
  return rateLimitAsync(`session:${userId}`, { maxRequests: 10, windowMs: 60_000 });
}

/** Self-referral: 3 submissions per hour per IP (sensitive PII endpoint) */
export function selfReferralRateLimit(ip: string): RateLimitResult {
  return rateLimit(`self-referral:${ip}`, { maxRequests: 3, windowMs: 3_600_000 });
}

/** Consent grant: 5 per hour per IP */
export function consentRateLimit(ip: string): RateLimitResult {
  return rateLimit(`consent:${ip}`, { maxRequests: 5, windowMs: 3_600_000 });
}

/** Find therapist search: 20 per minute per IP */
export function searchRateLimit(ip: string): RateLimitResult {
  return rateLimit(`search:${ip}`, { maxRequests: 20, windowMs: 60_000 });
}

/** GP letter generation: 5 per hour per user */
export function gpLetterRateLimit(userId: string): RateLimitResult {
  return rateLimit(`gp-letter:${userId}`, { maxRequests: 5, windowMs: 3_600_000 });
}

