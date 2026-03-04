'use client';

import { Tooltip } from '@/components/ui/Tooltip';

interface SessionHeaderProps {
  depth: number;
  nightMode: boolean;
  isViewingPast: boolean;
  viewSessionDate?: string;
  streak?: number;
  tier?: string;
  onToggleNight: () => void;
  onRestart: () => void;
  onExit: () => void;
  onHelp?: () => void;
}

function DepthRing({ depth, maxDepth, tier }: { depth: number; maxDepth: number; tier: string }) {
  const freeLimit = 5;
  const confrontationThreshold = 7;
  const displayMax = tier === 'free' ? freeLimit : maxDepth;
  const progress = Math.min(1, depth / displayMax);
  const circumference = 2 * Math.PI * 14;
  const strokeDashoffset = circumference * (1 - progress);

  // Color shifts based on depth
  let strokeColor = '#c0392b'; // accent red
  if (depth >= confrontationThreshold) strokeColor = '#8b1a2f'; // crimson
  else if (depth >= freeLimit) strokeColor = '#e74c3c'; // accent warm

  return (
    <Tooltip content={tier === 'free' ? `Depth ${depth}/${freeLimit} (Free limit)` : `Depth ${depth} — ${depth >= 7 ? 'Confrontation active' : depth >= 5 ? 'Getting personal' : 'Warming up'}`} side="bottom">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="rgba(197, 187, 168, 0.4)"
            strokeWidth="2"
          />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: depth >= 7 ? `drop-shadow(0 0 4px ${strokeColor})` : undefined,
            }}
          />
        </svg>
        <span className="absolute text-[10px] font-cinzel" style={{ color: strokeColor }}>
          {depth}
        </span>
      </div>
    </Tooltip>
  );
}

export function SessionHeader({
  depth,
  nightMode,
  isViewingPast,
  viewSessionDate,
  streak = 0,
  tier = 'free',
  onToggleNight,
  onRestart,
  onExit,
  onHelp,
}: SessionHeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-12 border-b ${nightMode ? 'border-border/30' : 'border-border'} pb-6`}>
      <div className="flex items-center gap-4">
        {!isViewingPast && !nightMode && (
          <DepthRing depth={depth} maxDepth={15} tier={tier} />
        )}
        <div className="font-cinzel text-gold tracking-[0.3em] text-sm uppercase">
          {isViewingPast
            ? `Session — ${viewSessionDate ? new Date(viewSessionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Past'}`
            : nightMode
              ? `Depth ${depth}`
              : `Depth Level ${depth}`
          }
          {!isViewingPast && depth > 7 && !nightMode && (
            <span className="ml-3 text-[9px] text-crimson-bright tracking-widest animate-pulse" aria-label="Confrontation mode active">⚡ Confrontation</span>
          )}
          {nightMode && (
            <span className="ml-3 text-[9px] text-gold/60 tracking-widest" aria-label="Night Oracle mode active">🌙 Night</span>
          )}
        </div>
        {/* Streak badge */}
        {!isViewingPast && streak > 0 && !nightMode && (
          <Tooltip content={`${streak} day streak — return daily to deepen the Oracle's awareness`} side="bottom">
            <div className="flex items-center gap-1 text-[9px] font-courier tracking-widest text-gold/70 bg-gold/5 border border-gold/10 px-2 py-1 rounded">
              🔥 {streak}
            </div>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-6">
        {!isViewingPast && (
          <>
            {/* Help button */}
            {onHelp && !nightMode && (
              <Tooltip content="Quick reference guide" side="bottom">
                <button
                  onClick={onHelp}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-text-muted hover:text-gold hover:border-gold/30 transition-all text-xs"
                  aria-label="Open help guide"
                >
                  ?
                </button>
              </Tooltip>
            )}
            <button
              onClick={onToggleNight}
              className={`transition-colors text-sm ${nightMode ? 'text-gold opacity-100' : 'text-text-muted opacity-50 hover:opacity-100 hover:text-gold'}`}
              title="Night Oracle — 3am mode"
              aria-label={nightMode ? 'Disable Night Oracle mode' : 'Enable Night Oracle mode'}
              aria-pressed={nightMode}
            >
              🌙
            </button>
            <button
              onClick={onRestart}
              className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
              aria-label="Restart session"
            >
              Restart
            </button>
          </>
        )}
        <button
          onClick={onExit}
          className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
          aria-label={isViewingPast ? 'Go back to session list' : 'Save and exit session'}
        >
          {isViewingPast ? 'Back' : 'Depart'}
        </button>
      </div>
    </div>
  );
}
