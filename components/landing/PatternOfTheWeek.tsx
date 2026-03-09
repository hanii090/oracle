'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Pattern of the Week — Feature 01
 * 
 * Surfaces the most significant recurring pattern Sorca has detected
 * across all the user's sessions. One devastating sentence per week.
 */

interface PatternData {
  patternOfTheWeek: string | null;
  patterns: Array<{
    type: string;
    summary: string;
    evidence: string[];
    occurrences: number;
  }>;
}

export function PatternOfTheWeek() {
  const { user, profile, getIdToken } = useAuth();
  const [data, setData] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchPatterns = useCallback(async () => {
    if (!user || !profile || profile.tier === 'free') return;
    
    // Only fetch once per week
    const lastFetch = localStorage.getItem('sorca_pattern_last_fetch');
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (lastFetch && Date.now() - parseInt(lastFetch) < oneWeek) {
      const cached = localStorage.getItem('sorca_pattern_data');
      if (cached) {
        try {
          setData(JSON.parse(cached));
          return;
        } catch { /* ignore */ }
      }
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
        localStorage.setItem('sorca_pattern_data', JSON.stringify(result));
        localStorage.setItem('sorca_pattern_last_fetch', String(Date.now()));
      }
    } catch (e) {
      console.error('Pattern fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user, profile, getIdToken]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  if (!data?.patternOfTheWeek || dismissed || loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl mx-auto mb-12"
      >
        <div className="bg-surface border border-gold/20 rounded-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.03)_0%,transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-gold/60 flex items-center gap-2">
                <span aria-hidden="true">🔍</span>
                Pattern of the Week
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-text-muted hover:text-gold transition-colors text-sm"
                aria-label="Dismiss pattern"
              >
                ✕
              </button>
            </div>

            <p className="font-cormorant italic text-xl text-text-main leading-relaxed mb-4">
              &ldquo;{data.patternOfTheWeek}&rdquo;
            </p>

            {data.patterns && data.patterns.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="font-courier text-[10px] text-gold/60 hover:text-gold tracking-widest uppercase transition-colors"
              >
                {expanded ? 'Hide Details' : `${data.patterns.length} Patterns Detected →`}
              </button>
            )}

            <AnimatePresence>
              {expanded && data.patterns && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 space-y-4 overflow-hidden"
                >
                  {data.patterns.map((pattern, i) => (
                    <div key={i} className="bg-raised/50 border border-border/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-courier tracking-wider uppercase px-2 py-0.5 rounded border border-gold/20 text-gold/70">
                          {pattern.type.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] font-courier text-text-muted">
                          ×{pattern.occurrences}
                        </span>
                      </div>
                      <p className="font-cormorant text-text-mid text-sm leading-relaxed">
                        {pattern.summary}
                      </p>
                      {pattern.evidence && pattern.evidence.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {pattern.evidence.map((e, j) => (
                            <p key={j} className="text-[11px] text-text-muted/60 font-courier pl-3 border-l border-gold/10">
                              &ldquo;{e}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
