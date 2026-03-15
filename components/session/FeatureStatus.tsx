'use client';

import { memo } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { ThreadIcon, MusicIcon, BoltIcon, VisionIcon, ConsentIcon } from '@/components/icons';

interface FeatureStatusProps {
  pastThreadLength: number;
  depth: number;
  isBreakthrough: boolean;
  tier?: string;
}

// ⚡ Bolt Optimization:
// Memoized FeatureStatus to prevent unnecessary re-renders when parent state (like chat input) updates.
// Expected Impact: Stops constant re-rendering of static feature status elements on each keystroke.
export const FeatureStatus = memo(function FeatureStatus({ pastThreadLength, depth, isBreakthrough, tier = 'free' }: FeatureStatusProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap" role="status" aria-label="Active features">
      <Tooltip content="The Thread — Sorca remembers your past sessions and patterns" side="bottom">
        <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border flex items-center gap-1 ${pastThreadLength > 0 ? 'border-teal/30 text-teal-bright' : 'border-border text-text-muted/40'}`}>
          <ThreadIcon size={10} /> Thread {pastThreadLength > 0 ? 'Active' : 'Empty'}
        </div>
      </Tooltip>

      <Tooltip content="Lyria — real-time ambient music reacting to your emotions" side="bottom">
        <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-gold/20 text-gold/70 flex items-center gap-1">
          <MusicIcon size={10} /> Lyria Active
        </div>
      </Tooltip>

      {depth > 7 && (
        <Tooltip content="Confrontation — Sorca now surfaces your own contradictions" side="bottom">
          <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-crimson/30 text-crimson-bright animate-pulse flex items-center gap-1">
            <BoltIcon size={10} /> Confrontation
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
        <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border flex items-center gap-1 ${
          tier === 'free'
            ? 'border-border text-text-muted/30'
            : isBreakthrough
              ? 'border-violet/30 text-violet-bright animate-pulse'
              : 'border-border text-text-muted/40'
        }`}>
          <VisionIcon size={10} /> Visuals {tier === 'free' ? <ConsentIcon size={8} /> : isBreakthrough ? 'Triggered' : 'Standby'}
        </div>
      </Tooltip>
    </div>
  );
});
