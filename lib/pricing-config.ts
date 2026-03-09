/**
 * Pricing Configuration — Single Source of Truth
 *
 * All pricing data flows from this file:
 * - Landing page PricingSection renders from these definitions
 * - Checkout API resolves Stripe price IDs from tier keys
 * - Voice minute limits are imported from elevenlabs-client (canonical)
 * - Dashboard tier-gating checks voiceLimits for eligibility
 *
 * When you change a price in Stripe, update the corresponding
 * `price` / `pricePennies` here. No other file hardcodes amounts.
 */

import type { Tier } from '@/hooks/useAuth';
import { ELEVENLABS_CONFIG } from '@/lib/elevenlabs-client';

// ── Shared types ───────────────────────────────────────────────────

export interface PlanFeature {
  name: string;
  /** If true, the feature text is highlighted (gold for patient plans, teal for therapist) */
  highlight?: boolean;
}

export interface LockedFeature {
  name: string;
  /** Badge text shown next to locked features (e.g. "PLUS") */
  badge: string;
}

export interface PatientPlan {
  tier: Tier;
  label: string;
  /** Display price — null for free tier */
  price: number | null;
  /** Currency symbol */
  currency: string;
  subtitle: string;
  /** Whether to show the "Most Popular" badge */
  popular?: boolean;
  features: PlanFeature[];
  lockedFeatures?: LockedFeature[];
  /** CTA button text */
  cta: string;
  /** CTA text when this is the user's current plan */
  ctaCurrent: string;
  /** Monthly voice minutes included (from ElevenLabs config) */
  voiceMinutes: number;
  /** Whether to show a trial badge */
  trialDays: number;
}

export interface TherapistFeature {
  title: string;
  desc: string;
}

export interface TherapistPlan {
  tier: Tier;
  label: string;
  price: number;
  currency: string;
  subtitle: string;
  features: TherapistFeature[];
  cta: string;
  ctaHref: string;
  voiceMinutes: number;
  trialDays: number;
}

// ── Voice limits (re-exported from canonical source) ───────────────

export const VOICE_LIMITS = ELEVENLABS_CONFIG.voiceLimits;

/** Returns true if the given tier has voice access */
export function hasVoiceAccess(tier: Tier): boolean {
  return (VOICE_LIMITS[tier] ?? 0) > 0;
}

/** Returns human-readable voice allowance for a tier */
export function voiceAllowanceLabel(tier: Tier): string {
  const mins = VOICE_LIMITS[tier] ?? 0;
  if (mins === 0) return 'No voice sessions';
  if (!isFinite(mins)) return 'Unlimited voice sessions';
  if (mins >= 60) return `${Math.floor(mins / 60)} ${mins >= 120 ? 'hours' : 'hour'} voice sessions / month`;
  return `${mins} min voice sessions / month`;
}

// ── Trial configuration ────────────────────────────────────────────

export const TRIAL_DAYS = 14;

// ── Patient plans ──────────────────────────────────────────────────

export const PATIENT_PLANS: PatientPlan[] = [
  {
    tier: 'free',
    label: 'Patient Free',
    price: null,
    currency: '£',
    subtitle: 'Forever free · No card required',
    features: [
      { name: 'Daily mood check-ins' },
      { name: 'PHQ-9 & GAD-7 tracking' },
      { name: 'Grounding exercises' },
      { name: 'Crisis contacts (UK)' },
      { name: 'Basic session history' },
    ],
    lockedFeatures: [
      { name: 'Voice sessions', badge: 'PLUS' },
      { name: 'Homework companion', badge: 'PLUS' },
      { name: 'Relapse prevention plan', badge: 'PLUS' },
    ],
    cta: 'Get Started Free',
    ctaCurrent: 'Current Tier',
    voiceMinutes: VOICE_LIMITS.free,
    trialDays: 0,
  },
  {
    tier: 'philosopher',
    label: 'Patient Plus',
    price: 9,
    currency: '£',
    subtitle: `per month · ${TRIAL_DAYS}-day free trial`,
    popular: true,
    features: [
      { name: 'Everything in Free' },
      { name: `✦ ${voiceAllowanceLabel('philosopher')}`, highlight: true },
      { name: 'AI homework companion' },
      { name: 'Relapse prevention toolkit' },
      { name: 'Psychoeducation library' },
      { name: 'Daily check-in notifications' },
      { name: 'Therapist data sharing' },
      { name: 'Priority support' },
    ],
    cta: 'Upgrade',
    ctaCurrent: 'Current Plan',
    voiceMinutes: VOICE_LIMITS.philosopher,
    trialDays: TRIAL_DAYS,
  },
  {
    tier: 'pro',
    label: 'Patient Pro',
    price: 19,
    currency: '£',
    subtitle: 'per month · full support',
    features: [
      { name: 'Everything in Plus' },
      { name: `✦ ${voiceAllowanceLabel('pro')}`, highlight: true },
      { name: 'Shared sessions with partner/family' },
      { name: 'GP letter generation' },
      { name: 'Full data export (GDPR)' },
      { name: 'Priority clinical support' },
    ],
    cta: 'Upgrade',
    ctaCurrent: 'Current Tier',
    voiceMinutes: VOICE_LIMITS.pro,
    trialDays: TRIAL_DAYS,
  },
];

// ── Therapist plan ─────────────────────────────────────────────────

export const THERAPIST_PLAN: TherapistPlan = {
  tier: 'practice',
  label: 'Clinical Practice',
  price: 59,
  currency: '£',
  subtitle: 'per therapist / month',
  features: [
    { title: 'Unlimited Voice', desc: 'Unlimited voice sessions' },
    { title: 'PHQ-9 & GAD-7', desc: 'NHS-standard outcome tracking' },
    { title: 'Session Notes', desc: 'Clinical documentation' },
    { title: 'Stepped Care', desc: 'Step 1-3 pathway support' },
    { title: 'Risk Assessment', desc: 'Safeguarding tools' },
    { title: 'Voice Review', desc: 'Client transcript access' },
    { title: '10 Patients', desc: 'Included in subscription' },
    { title: 'UK Data Hosting', desc: 'GDPR + NHS DSP aligned' },
  ],
  cta: 'Learn More',
  ctaHref: '/for-therapists',
  voiceMinutes: VOICE_LIMITS.practice,
  trialDays: TRIAL_DAYS,
};

// ── Stripe price ID resolver (server-side only) ────────────────────

/**
 * Maps a tier key to its Stripe env-var name.
 * Used by /api/checkout to avoid hardcoding env var lookups.
 */
export const STRIPE_PRICE_ENV_KEYS: Record<string, string> = {
  philosopher: 'STRIPE_PRICE_ID_PHILOSOPHER',
  pro: 'STRIPE_PRICE_ID_PRO',
  practice: 'STRIPE_PRICE_ID_PRACTICE',
};

/**
 * Returns the plan data for a given tier, or null if not found.
 */
export function getPlan(tier: Tier): PatientPlan | TherapistPlan | null {
  if (tier === 'practice') return THERAPIST_PLAN;
  return PATIENT_PLANS.find(p => p.tier === tier) ?? null;
}
