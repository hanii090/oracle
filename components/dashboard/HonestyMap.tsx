'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface DNAProfile {
  type: string;
  avgHonesty: number;
  count: number;
}

interface DNAEntry {
  id: string;
  questionText: string;
  type: string;
  honestyScore: number;
  honestyExplanation?: string;
  timestamp: string;
}

const TYPE_LABELS: Record<string, { label: string; description: string }> = {
  excavation: { label: 'Excavation', description: 'Digging deeper into something already said' },
  confrontation: { label: 'Confrontation', description: 'Surfacing contradictions or uncomfortable truths' },
  permission: { label: 'Permission', description: 'Being given permission to feel something forbidden' },
  reframe: { label: 'Reframe', description: 'Seeing something familiar from a new angle' },
  projection: { label: 'Projection', description: 'Thinking from hypothetical or other perspectives' },
  silence: { label: 'Silence', description: 'Minimal questions that create space' },
};

export function HonestyMap() {
  const { getIdToken } = useAuth();
  const [profile, setProfile] = useState<DNAProfile[] | null>(null);
  const [entries, setEntries] = useState<DNAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntries, setShowEntries] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/question-dna', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || null);
        setEntries(data.recentEntries || []);
      }
    } catch (e) {
      console.error('Failed to load question DNA:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.length === 0) {
    return (
      <div>
        <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
          Your Honesty Map
        </h2>
        <div className="text-center py-12">
          <div className="text-3xl mb-4 opacity-30">🧬</div>
          <p className="text-sm text-text-muted">No question DNA data yet.</p>
          <p className="text-xs text-text-muted/70 mt-2">
            After a few sessions, Sorca will build a profile of which question types you respond to most honestly.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...profile.map(p => p.count), 1);

  // Find most and least honest types
  const withData = profile.filter(p => p.count > 0);
  const mostHonest = withData.length > 0 ? withData[0] : null;
  const leastHonest = withData.length > 1 ? withData[withData.length - 1] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase">
          Your Honesty Map
        </h2>
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="text-[9px] text-text-muted hover:text-gold font-courier tracking-wider"
        >
          {showEntries ? 'Show chart' : 'Show details'}
        </button>
      </div>
      <p className="text-xs text-text-muted mb-5">
        How honestly you respond to different types of questions Sorca asks.
      </p>

      {!showEntries ? (
        <>
          {/* Radar-style bar chart */}
          <div className="space-y-3 mb-5">
            {profile.map(item => {
              const meta = TYPE_LABELS[item.type] || { label: item.type, description: '' };
              const barWidth = item.count > 0 ? Math.max(item.avgHonesty * 100, 5) : 0;
              const barColor = item.avgHonesty >= 0.7
                ? 'bg-emerald-400'
                : item.avgHonesty >= 0.4
                  ? 'bg-gold'
                  : 'bg-amber-400';

              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs text-text-main font-cinzel">{meta.label}</span>
                      <span className="text-[9px] text-text-muted ml-2">({item.count} questions)</span>
                    </div>
                    <span className="text-xs text-text-main font-courier">
                      {item.count > 0 ? `${Math.round(item.avgHonesty * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                  <p className="text-[8px] text-text-muted/60 mt-0.5">{meta.description}</p>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          {mostHonest && leastHonest && mostHonest.type !== leastHonest.type && (
            <div className="p-3 bg-raised border border-border rounded-lg">
              <p className="text-xs text-text-mid">
                You tend to be <strong className="text-emerald-400">most open</strong> with{' '}
                <em>{TYPE_LABELS[mostHonest.type]?.label?.toLowerCase()}</em> questions
                {leastHonest.avgHonesty < 0.5 && (
                  <>
                    {' '}and <strong className="text-amber-400">most guarded</strong> with{' '}
                    <em>{TYPE_LABELS[leastHonest.type]?.label?.toLowerCase()}</em> questions
                  </>
                )}.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {entries.map(entry => (
            <div key={entry.id} className="p-3 bg-raised border border-border rounded-lg">
              <p className="text-xs text-text-main font-cinzel mb-1">&ldquo;{entry.questionText}&rdquo;</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 bg-gold/10 text-gold rounded">{entry.type}</span>
                <span className={`text-[9px] ${
                  entry.honestyScore >= 0.7 ? 'text-emerald-400' :
                  entry.honestyScore >= 0.4 ? 'text-gold' :
                  'text-amber-400'
                }`}>
                  {Math.round(entry.honestyScore * 100)}% honest
                </span>
                <span className="text-[8px] text-text-muted font-courier">
                  {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {entry.honestyExplanation && (
                <p className="text-[9px] text-text-muted mt-1 font-cormorant italic">{entry.honestyExplanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
