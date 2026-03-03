import { z } from 'zod';

// ── Server-side environment variables ──────────────────────────────
// Core vars that ALL API routes need
const serverSchema = z.object({
  // Firebase public (also available server-side)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID is required'),

  // Firebase Admin
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),

  // Stripe — optional at server-env level; routes that need them validate individually
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PHILOSOPHER: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),

  // AI (server-only — no NEXT_PUBLIC_ prefix)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),

  // Rate limiting (optional — falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _serverEnv: ServerEnv | null = null;

/**
 * Parse and cache server-side environment variables.
 * Throws with a clear message if any required variable is missing.
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error('❌ Missing or invalid environment variables:', errors);
    throw new Error(
      `Environment validation failed. Missing: ${Object.keys(errors).join(', ')}. ` +
      'See .env.example for required variables.'
    );
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}

// ── Stripe environment variables ───────────────────────────────────
// Validated separately so missing Stripe config doesn't break non-Stripe routes
const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_ID_PHILOSOPHER: z.string().min(1, 'STRIPE_PRICE_ID_PHILOSOPHER is required'),
  STRIPE_PRICE_ID_PRO: z.string().min(1, 'STRIPE_PRICE_ID_PRO is required'),
});

export type StripeEnv = z.infer<typeof stripeSchema>;

let _stripeEnv: StripeEnv | null = null;

/**
 * Parse and cache Stripe-specific environment variables.
 * Only call this from Stripe-related routes (checkout, billing, webhooks).
 */
export function getStripeEnv(): StripeEnv {
  if (_stripeEnv) return _stripeEnv;

  const parsed = stripeSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missing = Object.keys(errors).join(', ');
    console.error('❌ Missing Stripe environment variables:', errors);
    throw new Error(
      `Stripe is not fully configured. Missing: ${missing}. ` +
      'Payments are disabled until these are set in Vercel Environment Variables.'
    );
  }
  _stripeEnv = parsed.data;
  return _stripeEnv;
}

// ── Client-side environment variables ──────────────────────────────
const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientSchema>;

/**
 * Validate that public Firebase env vars are present.
 * Safe to call on client or server.
 */
export function getClientEnv(): ClientEnv {
  return clientSchema.parse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
