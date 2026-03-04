'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Belief Lifespan Chart — Feature 04
 * Visualises the lifespan of each belief extracted from sessions.
 */

interface BeliefEntry {
  id: string;
  text: string;
  category: string;
  status: string;
  lifespanDays: number;
  firstExpressed: string;
  lastSeen: string;
  occurrences: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  identity: '#c0392b',
  world: '#5b4a8a',
  relationship: '#2a6b6b',
  capability: '#b8860b',
  fear: '#8b1a2f',
  desire: '#e74c3c',
  value: '#d4a017',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Still held',
  evolved: 'Evolved',
  abandoned: 'Let go',
  deepened: 'Deepened',
  contradicted: 'Contradicted',
};

export function BeliefLifespan() {
  const [beliefs, setBeliefs] = useState<BeliefEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, getIdToken } = useAuth();

  const loadBeliefs = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/beliefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionMessages: [], action: 'chart' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chart) setBeliefs(data.chart);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => { loadBeliefs(); }, [loadBeliefs]);

  if (loading || beliefs.length === 0) return null;

  const maxLifespan = Math.max(...beliefs.map(b => b.lifespanDays), 1);
  const filtered = selectedCategory
    ? beliefs.filter(b => b.category === selectedCategory)
    : beliefs;

  const categories = [...new Set(beliefs.map(b => b.category))];

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
          <span className="text-2xl">📊</span>
          <div className="flex-1">
            <div className="font-cinzel text-xs tracking-[0.15em] text-gold uppercase">Belief Lifespan</div>
            <p className="font-cormorant italic text-sm text-text-muted mt-1">
              {beliefs.length} beliefs tracked · {beliefs.filter(b => b.status === 'active').length} still held
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
              <div className="px-6 pb-6">
                {/* Category filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`font-courier text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border transition-colors ${
                      !selectedCategory ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:border-gold/30'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={`font-courier text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border transition-colors ${
                        selectedCategory === cat ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:border-gold/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Belief bars */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {filtered.map((belief, i) => {
                    const barWidth = Math.max(8, (belief.lifespanDays / maxLifespan) * 100);
                    const color = CATEGORY_COLORS[belief.category] || '#7a7060';

                    return (
                      <motion.div
                        key={belief.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="group"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="flex-1">
                            <div
                              className="h-6 rounded-full flex items-center px-3 relative overflow-hidden"
                              style={{ width: `${barWidth}%`, backgroundColor: `${color}20` }}
                            >
                              <div
                                className="absolute inset-y-0 left-0 rounded-full opacity-30"
                                style={{ width: '100%', backgroundColor: color }}
                              />
                              <span className="font-cormorant italic text-[11px] text-text-main relative z-10 truncate">
                                &ldquo;{belief.text}&rdquo;
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-courier text-[9px] text-text-muted">
                              {belief.lifespanDays}d
                            </span>
                            <span
                              className="font-courier text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full border"
                              style={{ borderColor: `${color}40`, color }}
                            >
                              {STATUS_LABELS[belief.status] || belief.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="font-cormorant italic text-xs text-text-muted mt-6 border-t border-border pt-4">
                  The beliefs you&apos;ve held the longest are the ones most worth examining. The ones that disappeared quickly were already ready to go.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
