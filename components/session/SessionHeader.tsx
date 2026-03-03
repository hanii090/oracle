'use client';

interface SessionHeaderProps {
  depth: number;
  nightMode: boolean;
  isViewingPast: boolean;
  viewSessionDate?: string;
  onToggleNight: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function SessionHeader({
  depth,
  nightMode,
  isViewingPast,
  viewSessionDate,
  onToggleNight,
  onRestart,
  onExit,
}: SessionHeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-12 border-b ${nightMode ? 'border-border/30' : 'border-border'} pb-6`}>
      <div className="font-cinzel text-gold tracking-[0.3em] text-sm uppercase">
        {isViewingPast
          ? `Session — ${viewSessionDate ? new Date(viewSessionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Past'}`
          : `Depth Level ${depth}`
        }
        {!isViewingPast && depth > 7 && !nightMode && (
          <span className="ml-3 text-[9px] text-crimson-bright tracking-widest animate-pulse" aria-label="Confrontation mode active">⚡ Confrontation</span>
        )}
        {nightMode && (
          <span className="ml-3 text-[9px] text-gold/60 tracking-widest" aria-label="Night Oracle mode active">🌙 Night</span>
        )}
      </div>
      <div className="flex items-center gap-6">
        {!isViewingPast && (
          <>
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
