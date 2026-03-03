/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed solution (e.g. @upstash/ratelimit).
 */

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

/**
 * Check and consume a rate limit token for the given key.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No entry or window expired — create fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++;
    return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  // Rate limited
  return { success: false, remaining: 0, resetAt: entry.resetAt };
}

// ── Pre-configured limiters ────────────────────────────────────────

/** Checkout: 5 requests per minute per IP */
export function checkoutRateLimit(ip: string): RateLimitResult {
  return rateLimit(`checkout:${ip}`, { maxRequests: 5, windowMs: 60_000 });
}

/** Oracle AI: 20 requests per minute per user */
export function oracleRateLimit(userId: string): RateLimitResult {
  return rateLimit(`oracle:${userId}`, { maxRequests: 20, windowMs: 60_000 });
}

/** Session validation: 10 requests per minute per user */
export function sessionRateLimit(userId: string): RateLimitResult {
  return rateLimit(`session:${userId}`, { maxRequests: 10, windowMs: 60_000 });
}
