'use client';

import type { SessionSummary } from '@/hooks/useAuth';

interface SessionHistoryProps {
  sessions: SessionSummary[];
  onViewSession: (session: SessionSummary) => void;
}

export function SessionHistory({ sessions, onViewSession }: SessionHistoryProps) {
  return (
    <section className="w-full max-w-4xl px-6 mt-4 mb-8 relative z-10" aria-labelledby="sessions-heading">
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        <span id="sessions-heading">Your Past Sessions</span>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      {sessions.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide" role="list" aria-label="Session history">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onViewSession(session)}
              className="w-full text-left bg-surface border border-border hover:border-gold/30 p-5 rounded-lg transition-all duration-300 hover:bg-raised group"
              role="listitem"
              aria-label={`Session from ${new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, depth ${session.maxDepth}, ${session.messageCount} exchanges`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-cinzel text-xs text-gold tracking-widest">
                  Depth {session.maxDepth}
                </div>
                <div className="font-courier text-[10px] text-text-muted">
                  {new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <p className="font-cormorant italic text-text-mid text-base truncate">
                &ldquo;{session.preview}&rdquo;
              </p>
              <div className="font-courier text-[10px] text-text-muted mt-2">
                {session.messageCount} exchanges
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-border/30 rounded-lg bg-surface/30">
          <div className="text-3xl mb-4 opacity-40" aria-hidden="true">🕯️</div>
          <p className="font-cormorant italic text-text-muted text-lg">No sessions archived yet</p>
          <p className="font-courier text-[10px] text-text-muted/60 mt-2 tracking-widest uppercase">Complete a session and depart to archive it here</p>
        </div>
      )}
    </section>
  );
}
