/**
 * Voice Usage Tracking
 * 
 * Manages voice session minute tracking per user per month.
 * Works with Firestore `voiceUsage` collection.
 */

import type { Tier } from '@/hooks/useAuth';
import { ELEVENLABS_CONFIG } from './elevenlabs-client';

export interface VoiceUsage {
  userId: string;
  month: string; // YYYY-MM
  minutesUsed: number;
  sessionCount: number;
  lastSessionAt: string;
}

export interface VoiceUsageStatus {
  minutesUsed: number;
  minutesLimit: number | null; // null = unlimited
  minutesRemaining: number | null;
  percentUsed: number;
  isAtLimit: boolean;
  canStartSession: boolean;
  tier: string;
}

/**
 * Calculate voice usage status for a user's tier
 */
export function getVoiceUsageStatus(tier: Tier, minutesUsed: number): VoiceUsageStatus {
  const limit = ELEVENLABS_CONFIG.voiceLimits[tier] || 0;
  const isUnlimited = limit === Infinity;

  return {
    minutesUsed,
    minutesLimit: isUnlimited ? null : limit,
    minutesRemaining: isUnlimited ? null : Math.max(0, limit - minutesUsed),
    percentUsed: isUnlimited ? 0 : limit > 0 ? Math.min(100, (minutesUsed / limit) * 100) : 100,
    isAtLimit: !isUnlimited && minutesUsed >= limit,
    canStartSession: limit > 0 && (isUnlimited || minutesUsed < limit),
    tier,
  };
}

/**
 * Format voice usage for display
 */
export function formatVoiceUsage(status: VoiceUsageStatus): string {
  if (status.minutesLimit === null) return `${status.minutesUsed}m used (unlimited)`;
  return `${status.minutesUsed}m / ${status.minutesLimit}m used`;
}

/**
 * Get the current month key for Firestore
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Tier upgrade suggestion based on usage
 */
export function getUpgradeSuggestion(tier: Tier, minutesUsed: number): string | null {
  if (tier === 'free') {
    return 'Upgrade to Philosopher (£9/mo) for 60 minutes of voice sessions, or Pro (£19/mo) for 5 hours.';
  }
  if (tier === 'philosopher' && minutesUsed >= 50) {
    return 'Running low on voice minutes? Upgrade to Pro (£19/mo) for 5 hours/month.';
  }
  return null;
}
