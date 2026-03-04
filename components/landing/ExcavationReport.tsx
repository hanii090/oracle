'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface ExcavationReport {
  month: string;
  generatedAt: string;
  stats: {
    totalSessions: number;
    totalExchanges: number;
    avgDepth: number;
    maxDepth: number;
    deepestTheme: string;
    totalMinutes: number;
  };
  patterns: {
    recurring: string[];
    avoidance: string[];
    breakthroughs: string[];
  };
  beliefs: {
    active: string[];
    evolved: string[];
    contradicted: string[];
  };
  silenceProfile: {
    avgScore: number;
    quality: string;
    trend: string;
  } | null;
  narrative: string;
  questionOfTheMonth: string;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function ExcavationReportSection() {
  const [report, setReport] = useState<ExcavationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, getIdToken } = useAuth();

  const fetchReport = useCallback(async () => {
    if (!user || profile?.tier === 'free') return;
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/excavation-report', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.narrative) {
          setReport(data);
        }
      } else if (res.status !== 404) {
        setError('Could not load report');
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [user, profile?.tier, getIdToken]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (!user || profile?.tier === 'free') return null;
  if (!report && !loading) return null;

  return (
    <section className="w-full max-w-4xl px-6 mt-4 mb-8 relative z-10">
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        <span>Monthly Excavation Report</span>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-gold transition-colors font-courier text-[10px] tracking-widest uppercase"
        >
          {expanded ? 'Collapse' : 'Read Report'}
        </button>
      </div>

      {loading && (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="font-courier text-[10px] text-text-muted tracking-widest uppercase animate-pulse">
            Excavating your month...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <p className="font-courier text-xs text-text-muted">{error}</p>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Stats bar — always visible */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[100px]">
              <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-1">Sessions</div>
              <div className="font-cinzel text-gold text-xl">{report.stats.totalSessions}</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[100px]">
              <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-1">Avg Depth</div>
              <div className="font-cinzel text-gold text-xl">{report.stats.avgDepth}</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[100px]">
              <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-1">Deepest</div>
              <div className="font-cinzel text-gold text-xl">{report.stats.maxDepth}</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[100px]">
              <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-1">~Minutes</div>
              <div className="font-cinzel text-gold text-xl">{report.stats.totalMinutes}</div>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                {/* Narrative */}
                <div className="bg-surface border border-gold/20 rounded-lg p-8 mb-4">
                  <div className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                    {monthLabel(report.month)} · Field Notes
                  </div>
                  <div className="font-cormorant text-lg text-text-mid leading-relaxed italic whitespace-pre-line">
                    {report.narrative}
                  </div>
                </div>

                {/* Question of the Month */}
                <div className="bg-raised border border-gold/30 rounded-lg p-6 mb-4 text-center">
                  <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-3">
                    Question of the Month
                  </div>
                  <p className="font-cinzel text-lg text-text-main">
                    {report.questionOfTheMonth}
                  </p>
                </div>

                {/* Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {report.patterns.recurring.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg p-5">
                      <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-3">Recurring Patterns</div>
                      <ul className="space-y-2">
                        {report.patterns.recurring.map((p, i) => (
                          <li key={i} className="font-cormorant text-sm text-text-mid pl-3 relative">
                            <span className="absolute left-0 top-1.5 text-[5px] text-gold">◆</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.patterns.avoidance.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg p-5">
                      <div className="font-courier text-[8px] text-gold/60 tracking-widest uppercase mb-3">Avoidance Zones</div>
                      <ul className="space-y-2">
                        {report.patterns.avoidance.map((p, i) => (
                          <li key={i} className="font-cormorant text-sm text-text-mid pl-3 relative">
                            <span className="absolute left-0 top-1.5 text-[5px] text-gold">◆</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.patterns.breakthroughs.length > 0 && (
                    <div className="bg-surface border border-border rounded-lg p-5">
                      <div className="font-courier text-[8px] text-teal tracking-widest uppercase mb-3">Breakthroughs</div>
                      <ul className="space-y-2">
                        {report.patterns.breakthroughs.map((p, i) => (
                          <li key={i} className="font-cormorant text-sm text-text-mid pl-3 relative">
                            <span className="absolute left-0 top-1.5 text-[5px] text-teal">◆</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Beliefs */}
                {(report.beliefs.active.length > 0 || report.beliefs.evolved.length > 0 || report.beliefs.contradicted.length > 0) && (
                  <div className="bg-surface border border-border rounded-lg p-5 mb-4">
                    <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-4">Belief Inventory</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {report.beliefs.active.length > 0 && (
                        <div>
                          <div className="font-courier text-[8px] text-teal tracking-widest uppercase mb-2">Active</div>
                          {report.beliefs.active.map((b, i) => (
                            <p key={i} className="font-cormorant text-xs text-text-mid italic mb-1">&ldquo;{b}&rdquo;</p>
                          ))}
                        </div>
                      )}
                      {report.beliefs.evolved.length > 0 && (
                        <div>
                          <div className="font-courier text-[8px] text-editorial-gold tracking-widest uppercase mb-2">Evolved</div>
                          {report.beliefs.evolved.map((b, i) => (
                            <p key={i} className="font-cormorant text-xs text-text-mid italic mb-1">&ldquo;{b}&rdquo;</p>
                          ))}
                        </div>
                      )}
                      {report.beliefs.contradicted.length > 0 && (
                        <div>
                          <div className="font-courier text-[8px] text-gold tracking-widest uppercase mb-2">Contradicted</div>
                          {report.beliefs.contradicted.map((b, i) => (
                            <p key={i} className="font-cormorant text-xs text-text-mid italic mb-1">&ldquo;{b}&rdquo;</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Silence Profile */}
                {report.silenceProfile && (
                  <div className="bg-surface border border-border rounded-lg p-5 mb-4 flex items-center gap-6">
                    <div>
                      <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-1">Silence Score</div>
                      <div className="font-cinzel text-3xl text-text-main">{report.silenceProfile.avgScore}</div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <div className="font-cinzel text-xs text-text-main capitalize">{report.silenceProfile.quality}</div>
                      <div className="font-courier text-[9px] text-text-muted capitalize">{report.silenceProfile.trend.replace('_', ' ')}</div>
                    </div>
                  </div>
                )}

                {/* Deepest Theme */}
                <div className="text-center py-4">
                  <div className="font-courier text-[8px] text-text-muted tracking-widest uppercase mb-2">Deepest Excavation</div>
                  <p className="font-cormorant italic text-sm text-text-mid">
                    &ldquo;{report.stats.deepestTheme}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
