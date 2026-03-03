'use client';

import { Tooltip } from '@/components/ui/Tooltip';

interface FeatureStatusProps {
  pastThreadLength: number;
  depth: number;
  isBreakthrough: boolean;
  tier?: string;
}

export function FeatureStatus({ pastThreadLength, depth, isBreakthrough, tier = 'free' }: FeatureStatusProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap" role="status" aria-label="Active features">
      <Tooltip content="The Thread — Oracle remembers your past sessions and patterns" side="bottom">
        <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${pastThreadLength > 0 ? 'border-teal/30 text-teal-bright' : 'border-border text-text-muted/40'}`}>
          🧵 Thread {pastThreadLength > 0 ? 'Active' : 'Empty'}
        </div>
      </Tooltip>

      <Tooltip content="Lyria — real-time ambient music reacting to your emotions" side="bottom">
        <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-gold/20 text-gold/70">
          🎵 Lyria Active
        </div>
      </Tooltip>

      {depth > 7 && (
        <Tooltip content="Confrontation — Oracle now surfaces your own contradictions" side="bottom">
          <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-crimson/30 text-crimson-bright animate-pulse">
            ⚡ Confrontation
          </div>
        </Tooltip>
      )}

      <Tooltip
        content={
          tier === 'free'
            ? 'Visual Breakthroughs — upgrade to Philosopher to unlock'
            : 'Visual Breakthroughs — AI-generated visuals during emotional peaks'
        }
        side="bottom"
      >
        <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${
          tier === 'free'
            ? 'border-border text-text-muted/30'
            : isBreakthrough
              ? 'border-violet/30 text-violet-bright animate-pulse'
              : 'border-border text-text-muted/40'
        }`}>
          👁️ Visuals {tier === 'free' ? '🔒' : isBreakthrough ? 'Triggered' : 'Standby'}
        </div>
      </Tooltip>
    </div>
  );
}
