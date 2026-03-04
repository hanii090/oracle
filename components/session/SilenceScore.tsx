'use client';

import { motion } from 'motion/react';

/**
 * Silence Score — Feature 10
 * Compact display of the user's silence ratio, quality badge, and trend.
 * Shown in session header after voice usage.
 */

interface SilenceScoreProps {
  score: number;
  quality: string;
  trend: string;
}

const QUALITY_META: Record<string, { label: string; icon: string }> = {
  surface: { label: 'Surface', icon: '💨' },
  thinking: { label: 'Thinking', icon: '🤔' },
  deep: { label: 'Deep', icon: '🌊' },
  profound: { label: 'Profound', icon: '🕳️' },
};

const TREND_META: Record<string, { label: string; icon: string }> = {
  deepening: { label: 'Deepening', icon: '↗️' },
  retreating: { label: 'Retreating', icon: '↘️' },
  steady: { label: 'Steady', icon: '→' },
  insufficient_data: { label: '…', icon: '…' },
};

export function SilenceScore({ score, quality, trend }: SilenceScoreProps) {
  const qualityMeta = QUALITY_META[quality] || QUALITY_META.surface;
  const trendMeta = TREND_META[trend] || TREND_META.insufficient_data;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-2 py-1 bg-surface/50 border border-border/50 rounded-lg"
      title={`Silence Score: ${score} — ${qualityMeta.label}, ${trendMeta.label}`}
    >
      <span className="font-cinzel text-xs font-bold text-text-main">{score}</span>
      <span className="text-[10px]">{qualityMeta.icon}</span>
      <span className="font-courier text-[8px] text-text-muted">{trendMeta.icon}</span>
    </motion.div>
  );
}
