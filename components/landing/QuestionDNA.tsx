'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Question DNA — Feature 02
 * Shows which question types the user responds to most honestly.
 */

type QuestionType = 'excavation' | 'confrontation' | 'permission' | 'reframe' | 'projection' | 'silence';

interface DNAProfile {
  type: QuestionType;
  avgHonesty: number;
  count: number;
}

const TYPE_META: Record<QuestionType, { icon: string; label: string; desc: string }> = {
  excavation: { icon: '⛏️', label: 'Excavation', desc: 'Digging deeper into what you said' },
  confrontation: { icon: '⚡', label: 'Confrontation', desc: 'Surfacing contradictions' },
  permission: { icon: '🕊️', label: 'Permission', desc: 'Allowing forbidden feelings' },
  reframe: { icon: '🔄', label: 'Reframe', desc: 'New lens on the familiar' },
  projection: { icon: '🪞', label: 'Projection', desc: 'Hypotheticals and other perspectives' },
  silence: { icon: '🤫', label: 'Silence', desc: 'Space to sit with truth' },
};

export function QuestionDNA() {
  const [profile, setProfile] = useState<DNAProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, getIdToken } = useAuth();

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/question-dna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'profile', sessionMessages: [], sessionId: '' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading || profile.length === 0) return null;

  const maxCount = Math.max(...profile.map(p => p.count), 1);
  const topType = profile[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl px-6 mb-8"
    >
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 text-left flex items-center gap-4 hover:bg-raised transition-colors"
        >
          <span className="text-2xl">🧬</span>
          <div className="flex-1">
            <div className="font-cinzel text-xs tracking-[0.15em] text-gold uppercase">Your Question DNA</div>
            <p className="font-cormorant italic text-sm text-text-muted mt-1">
              You respond most honestly to {TYPE_META[topType?.type]?.label.toLowerCase()} questions
            </p>
          </div>
          <span className={`text-gold transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                <p className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
                  Honesty score by question type · based on {profile.reduce((s, p) => s + p.count, 0)} questions
                </p>
                {profile.map((item) => {
                  const meta = TYPE_META[item.type];
                  const barWidth = item.count > 0 ? Math.max(10, (item.avgHonesty * 100)) : 0;

                  return (
                    <div key={item.type} className="group">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg">{meta.icon}</span>
                        <span className="font-cinzel text-[11px] tracking-wide text-text-main w-28">{meta.label}</span>
                        <div className="flex-1 h-2 bg-deep rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(to right, rgba(192,57,43,${0.3 + item.avgHonesty * 0.7}), rgba(192,57,43,${item.avgHonesty}))`,
                            }}
                          />
                        </div>
                        <span className="font-courier text-[10px] text-text-muted w-12 text-right">
                          {Math.round(item.avgHonesty * 100)}%
                        </span>
                        <span className="font-courier text-[9px] text-text-muted/60 w-16 text-right">
                          ({item.count} Q&apos;s)
                        </span>
                      </div>
                    </div>
                  );
                })}
                <p className="font-cormorant italic text-xs text-text-muted mt-4 border-t border-border pt-4">
                  Sorca weights your future sessions toward the question types where you are most honest — and occasionally tests you with the types where you deflect.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
