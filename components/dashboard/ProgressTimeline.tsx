'use client';

import { motion } from 'motion/react';
import type { SessionSummary } from '@/hooks/useAuth';

interface ProgressTimelineProps {
  sessions: SessionSummary[];
  onViewSession: (session: SessionSummary) => void;
}

export function ProgressTimeline({ sessions, onViewSession }: ProgressTimelineProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-4 opacity-30">📈</div>
        <p className="text-sm text-text-muted">No sessions yet. Start your first session to see your journey.</p>
      </div>
    );
  }

  const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const maxDepth = Math.max(...sorted.map(s => s.maxDepth), 1);
  const avgDepth = sorted.reduce((sum, s) => sum + s.maxDepth, 0) / sorted.length;

  // Depth chart dimensions
  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 24, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW);
  const yScale = (depth: number) => padding.top + chartH - (depth / maxDepth) * chartH;

  return (
    <div>
      <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
        Your Journey
      </h2>
      <p className="text-xs text-text-muted mb-4">
        {sorted.length} sessions · Average depth {avgDepth.toFixed(1)} · Max depth {maxDepth}
      </p>

      {/* Depth Chart */}
      {sorted.length >= 2 && (
        <div className="bg-raised border border-border rounded-lg p-4 mb-4">
          <h3 className="text-[10px] text-text-muted font-courier tracking-wider uppercase mb-2">Session Depth Over Time</h3>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Grid */}
            {[1, Math.ceil(maxDepth / 2), maxDepth].map(v => (
              <g key={v}>
                <line x1={padding.left} y1={yScale(v)} x2={width - padding.right} y2={yScale(v)}
                  stroke="currentColor" className="text-border" strokeWidth="0.5" />
                <text x={padding.left - 6} y={yScale(v) + 3} textAnchor="end"
                  className="fill-text-muted" fontSize="8" fontFamily="monospace">{v}</text>
              </g>
            ))}

            {/* Area */}
            <polygon
              points={`${xScale(0)},${yScale(0)} ${sorted.map((s, i) => `${xScale(i)},${yScale(s.maxDepth)}`).join(' ')} ${xScale(sorted.length - 1)},${yScale(0)}`}
              className="fill-gold/10"
            />

            {/* Line */}
            <polyline
              points={sorted.map((s, i) => `${xScale(i)},${yScale(s.maxDepth)}`).join(' ')}
              fill="none" stroke="currentColor" className="text-gold"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />

            {/* Dots */}
            {sorted.map((s, i) => (
              <circle key={s.id} cx={xScale(i)} cy={yScale(s.maxDepth)} r="3"
                className={s.maxDepth >= maxDepth * 0.8 ? 'fill-gold' : 'fill-gold/60'}
              />
            ))}

            {/* Date labels */}
            {sorted.length <= 10
              ? sorted.map((s, i) => (
                <text key={`d-${s.id}`} x={xScale(i)} y={height - 4} textAnchor="middle"
                  className="fill-text-muted" fontSize="7" fontFamily="monospace">
                  {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </text>
              ))
              : [0, Math.floor(sorted.length / 2), sorted.length - 1].map(i => (
                <text key={`d-${i}`} x={xScale(i)} y={height - 4} textAnchor="middle"
                  className="fill-text-muted" fontSize="7" fontFamily="monospace">
                  {new Date(sorted[i].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </text>
              ))
            }
          </svg>
        </div>
      )}

      {/* Session List as Timeline */}
      <div className="space-y-0 max-h-[400px] overflow-y-auto">
        {[...sorted].reverse().map((session, i) => {
          const depthPct = (session.maxDepth / maxDepth) * 100;
          return (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onViewSession(session)}
              className="w-full flex items-start gap-3 p-3 hover:bg-raised transition-colors rounded-lg text-left group"
            >
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center shrink-0 mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  session.maxDepth >= maxDepth * 0.8 ? 'bg-gold' :
                  session.maxDepth >= maxDepth * 0.5 ? 'bg-gold/60' :
                  'bg-border'
                }`} />
                {i < sorted.length - 1 && (
                  <div className="w-px h-8 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cinzel text-xs text-text-main group-hover:text-gold transition-colors">
                    Depth {session.maxDepth}
                  </span>
                  <span className="text-[9px] text-text-muted font-courier">
                    {new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-[10px] text-text-mid line-clamp-1 font-cormorant italic">
                  &ldquo;{session.preview}&rdquo;
                </p>
                {/* Depth bar */}
                <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-gold/40 rounded-full" style={{ width: `${depthPct}%` }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
