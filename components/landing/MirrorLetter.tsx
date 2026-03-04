'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Mail, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface MirrorLetterProps {
  userId: string | null;
  isPaidUser: boolean;
}

export default function MirrorLetter({ userId, isPaidUser }: MirrorLetterProps) {
  const [letter, setLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  const cacheKey = `sorca_mirror_letter_${monthKey}`;
  const dismissKey = `sorca_mirror_letter_dismissed_${monthKey}`;

  useEffect(() => {
    if (!userId || !isPaidUser) return;

    // Check if dismissed this month
    if (typeof window !== 'undefined' && localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    // Check cache
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLetter(parsed.letter);
        return;
      } catch {
        // Cache corrupted, fetch fresh
      }
    }

    fetchLetter();
  }, [userId, isPaidUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLetter = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mirror-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 400) {
          // Not enough data yet — silently hide
          return;
        }
        throw new Error(data.error || 'Failed to generate letter');
      }

      const data = await res.json();
      setLetter(data.letter);

      // Cache for the month
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({ letter: data.letter }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(dismissKey, 'true');
    }
  }, [dismissKey]);

  if (!userId || !isPaidUser || dismissed || (!letter && !loading)) return null;

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-6" aria-label="Mirror Letter">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-stone-900/60 backdrop-blur-sm border border-stone-800/50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-cinzel tracking-wide text-stone-200">
                    Mirror Letter
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-stone-500 hover:text-stone-300 transition-colors p-1.5"
                  aria-label={expanded ? 'Collapse letter' : 'Expand letter'}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-stone-500 hover:text-stone-300 transition-colors p-1.5"
                  aria-label="Dismiss mirror letter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-5 flex items-center gap-2 text-stone-500 text-sm">
                <Sparkles className="w-4 h-4 animate-pulse text-violet-400" />
                <span className="font-cormorant italic">Writing your letter…</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-5 text-stone-500 text-sm">
                <p>{error}</p>
              </div>
            )}

            {/* Preview (always visible) */}
            {letter && !loading && (
              <div className="px-5 py-4">
                <p className="text-stone-400 font-cormorant text-base italic leading-relaxed line-clamp-2">
                  {letter.split('\n')[0]}
                </p>
              </div>
            )}

            {/* Expanded letter */}
            <AnimatePresence>
              {expanded && letter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-stone-800/50 pt-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      {letter.split('\n').map((paragraph, i) => (
                        <p
                          key={i}
                          className="text-stone-300 font-cormorant text-base leading-relaxed mb-3 last:mb-0"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-800/30 flex items-center justify-between">
                      <span className="text-xs text-stone-600 font-cinzel tracking-wider">
                        From your patterns — Sorca
                      </span>
                      <button
                        onClick={() => {
                          if (letter && typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(letter);
                          }
                        }}
                        className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
                      >
                        Copy letter
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
