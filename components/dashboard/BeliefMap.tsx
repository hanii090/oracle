'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface Belief {
  docId: string;
  id: string;
  text: string;
  category: 'identity' | 'world' | 'relationship' | 'capability' | 'fear' | 'desire' | 'value';
  firstExpressed: string;
  lastSeen: string;
  occurrences: number;
  status: 'active' | 'evolved' | 'abandoned' | 'deepened' | 'contradicted';
  evolution: { date: string; context: string }[];
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  identity: { label: 'Identity', color: 'text-gold', icon: '◇' },
  world: { label: 'World', color: 'text-blue-400', icon: '◈' },
  relationship: { label: 'Relationship', color: 'text-pink-400', icon: '❋' },
  capability: { label: 'Capability', color: 'text-emerald-400', icon: '□' },
  fear: { label: 'Fear', color: 'text-amber-400', icon: '△' },
  desire: { label: 'Desire', color: 'text-violet-400', icon: '○' },
  value: { label: 'Value', color: 'text-teal', icon: '✦' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-gold/10 text-gold' },
  evolved: { label: 'Evolved', color: 'bg-emerald-400/10 text-emerald-400' },
  abandoned: { label: 'Abandoned', color: 'bg-text-muted/10 text-text-muted' },
  deepened: { label: 'Deepened', color: 'bg-violet-400/10 text-violet-400' },
  contradicted: { label: 'Contradicted', color: 'bg-amber-400/10 text-amber-400' },
};

export function BeliefMap() {
  const { getIdToken } = useAuth();
  const [beliefs, setBeliefs] = useState<Belief[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBeliefs = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/beliefs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBeliefs(data.beliefs || []);
      }
    } catch (e) {
      console.error('Failed to load beliefs:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadBeliefs();
  }, [loadBeliefs]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filter ? beliefs.filter(b => b.category === filter) : beliefs;
  const categories = [...new Set(beliefs.map(b => b.category))];

  return (
    <div>
      <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
        Your Core Beliefs
      </h2>
      <p className="text-xs text-text-muted mb-5">
        Beliefs extracted from your sessions. See how they evolve over time.
      </p>

      {beliefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-4 opacity-30">💭</div>
          <p className="text-sm text-text-muted">No beliefs extracted yet.</p>
          <p className="text-xs text-text-muted/70 mt-2">
            After a few deeper sessions, Sorca will identify the beliefs underlying your words.
          </p>
        </div>
      ) : (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setFilter(null)}
              className={`text-[9px] px-2.5 py-1 rounded-full font-courier transition-all ${
                !filter ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-surface border border-border text-text-muted hover:border-gold/20'
              }`}
            >
              All ({beliefs.length})
            </button>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat] || { label: cat, color: 'text-text-muted', icon: '·' };
              const count = beliefs.filter(b => b.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(filter === cat ? null : cat)}
                  className={`text-[9px] px-2.5 py-1 rounded-full font-courier transition-all ${
                    filter === cat ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-surface border border-border text-text-muted hover:border-gold/20'
                  }`}
                >
                  {meta.icon} {meta.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Belief Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filtered.map(belief => {
              const catMeta = CATEGORY_META[belief.category] || { label: belief.category, color: 'text-text-muted', icon: '·' };
              const statusMeta = STATUS_META[belief.status] || { label: belief.status, color: 'bg-surface text-text-muted' };
              const isExpanded = expandedId === belief.docId;

              return (
                <motion.div
                  key={belief.docId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-raised border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : belief.docId)}
                    className="w-full text-left p-4 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-sm text-text-main font-cormorant italic leading-relaxed flex-1">
                        &ldquo;{belief.text}&rdquo;
                      </p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded shrink-0 ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] ${catMeta.color}`}>
                        {catMeta.icon} {catMeta.label}
                      </span>
                      <span className="text-[8px] text-text-muted">·</span>
                      <span className="text-[8px] text-text-muted font-courier">
                        {belief.occurrences}x across sessions
                      </span>
                      <span className="text-[8px] text-text-muted">·</span>
                      <span className="text-[8px] text-text-muted font-courier">
                        First: {new Date(belief.firstExpressed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </button>

                  {isExpanded && belief.evolution && belief.evolution.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4 border-t border-border"
                    >
                      <h4 className="text-[9px] text-text-muted font-courier tracking-wider uppercase mt-3 mb-2">Evolution</h4>
                      <div className="space-y-2 pl-3 border-l border-gold/20">
                        {belief.evolution.map((ev, i) => (
                          <div key={i} className="text-[10px]">
                            <span className="text-text-muted font-courier">
                              {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <p className="text-text-mid font-cormorant italic mt-0.5">
                              &ldquo;{ev.context}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
