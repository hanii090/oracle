'use client';

import type { Message } from './ChatMessage';

interface FeatureStatusProps {
  pastThreadLength: number;
  depth: number;
  isBreakthrough: boolean;
}

export function FeatureStatus({ pastThreadLength, depth, isBreakthrough }: FeatureStatusProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap" role="status" aria-label="Active features">
      <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${pastThreadLength > 0 ? 'border-teal/30 text-teal-bright' : 'border-border text-text-muted/40'}`}>
        🧵 Thread {pastThreadLength > 0 ? 'Active' : 'Empty'}
      </div>
      <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-gold/20 text-gold/70">
        🎵 Lyria Active
      </div>
      {depth > 7 && (
        <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-crimson/30 text-crimson-bright animate-pulse">
          ⚡ Confrontation
        </div>
      )}
      <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${isBreakthrough ? 'border-violet/30 text-violet-bright animate-pulse' : 'border-border text-text-muted/40'}`}>
        👁️ Visuals {isBreakthrough ? 'Triggered' : 'Standby'}
      </div>
    </div>
  );
}
