'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface MoodCheckIn {
  id: string;
  date: string;
  score: number;
  notes?: string;
  activities?: string[];
  timestamp: string;
}

interface MoodTrend {
  direction: 'improving' | 'declining' | 'stable';
  averageScore: number;
  checkInCount: number;
}

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Very low', color: 'text-red-400' },
  2: { label: 'Low', color: 'text-red-400' },
  3: { label: 'Struggling', color: 'text-amber-400' },
  4: { label: 'Below average', color: 'text-amber-400' },
  5: { label: 'Neutral', color: 'text-text-muted' },
  6: { label: 'Okay', color: 'text-text-mid' },
  7: { label: 'Good', color: 'text-emerald-400' },
  8: { label: 'Very good', color: 'text-emerald-400' },
  9: { label: 'Great', color: 'text-gold' },
  10: { label: 'Excellent', color: 'text-gold' },
};

const ACTIVITY_OPTIONS = [
  'Exercise', 'Social', 'Nature', 'Creative', 'Reading',
  'Meditation', 'Work', 'Rest', 'Therapy', 'Journaling',
];

export function MoodCheckInTab() {
  const { getIdToken } = useAuth();
  const [checkIns, setCheckIns] = useState<MoodCheckIn[]>([]);
  const [trend, setTrend] = useState<MoodTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [days, setDays] = useState(30);

  const loadMoodData = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/between-sessions?type=mood&days=${days}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCheckIns(data.checkIns || []);
        setTrend(data.trend || null);
      }
    } catch (e) {
      console.error('Failed to load mood data:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken, days]);

  useEffect(() => {
    loadMoodData();
  }, [loadMoodData]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/between-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          score,
          notes: notes.trim() || undefined,
          activities: selectedActivities.length > 0 ? selectedActivities : undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setNotes('');
        setSelectedActivities([]);
        setScore(5);
        await loadMoodData();
      }
    } catch (e) {
      console.error('Failed to submit mood check-in:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = checkIns.some(c => c.date === todayKey);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase">
          Mood Journal
        </h2>
        {!hasCheckedInToday && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-gold hover:text-gold/80 font-cinzel tracking-widest"
          >
            + Check In Today
          </button>
        )}
        {hasCheckedInToday && (
          <span className="text-[9px] text-emerald-400 font-courier tracking-wider">
            ✓ Checked in today
          </span>
        )}
      </div>

      {/* Check-in Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-raised border border-gold/20 rounded-lg p-5 mb-6"
        >
          <h3 className="font-cinzel text-sm text-gold mb-4">How are you today?</h3>
          
          {/* Score Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-muted font-courier">Score</span>
              <span className={`text-sm font-cinzel ${MOOD_LABELS[score]?.color || 'text-text-main'}`}>
                {score}/10 — {MOOD_LABELS[score]?.label}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`flex-1 h-8 rounded text-xs font-cinzel transition-all ${
                    n === score
                      ? 'bg-gold text-void scale-110'
                      : n <= score
                        ? 'bg-gold/20 text-gold'
                        : 'bg-surface border border-border text-text-muted hover:border-gold/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="mb-4">
            <span className="text-[10px] text-text-muted font-courier block mb-2">Activities today</span>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_OPTIONS.map(activity => (
                <button
                  key={activity}
                  onClick={() => setSelectedActivities(prev =>
                    prev.includes(activity)
                      ? prev.filter(a => a !== activity)
                      : [...prev, activity]
                  )}
                  className={`text-[10px] px-2.5 py-1 rounded-full transition-all ${
                    selectedActivities.includes(activity)
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-surface border border-border text-text-muted hover:border-gold/20'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <span className="text-[10px] text-text-muted font-courier block mb-2">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={500}
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none font-cormorant"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-gold text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Check-In'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-border text-text-muted font-cinzel text-xs tracking-widest rounded-lg hover:border-gold/30"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Trend Summary */}
      {trend && (
        <div className="bg-raised border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted font-courier tracking-wider uppercase">
                {days}-day trend
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-lg font-cinzel ${
                  trend.direction === 'improving' ? 'text-emerald-400' :
                  trend.direction === 'declining' ? 'text-amber-400' :
                  'text-text-mid'
                }`}>
                  {trend.direction === 'improving' ? '↗' : trend.direction === 'declining' ? '↘' : '→'}
                </span>
                <span className="text-sm text-text-main font-cinzel capitalize">{trend.direction}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-cinzel text-gold">{trend.averageScore.toFixed(1)}</div>
              <div className="text-[9px] text-text-muted font-courier">avg score</div>
            </div>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`text-[10px] px-3 py-1 rounded font-courier transition-all ${
              days === d
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'bg-surface border border-border text-text-muted hover:border-gold/20'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Mood Chart (SVG) */}
      {checkIns.length > 0 && (
        <div className="bg-raised border border-border rounded-lg p-4 mb-4">
          <MoodChart checkIns={checkIns} />
        </div>
      )}

      {/* Check-in History */}
      {checkIns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-4 opacity-30">📊</div>
          <p className="text-sm text-text-muted">No mood check-ins yet.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-block mt-4 px-6 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/10"
            >
              Record Your First Check-In
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {checkIns.map((checkIn) => (
            <div key={checkIn.id} className="p-3 bg-raised border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-cinzel text-sm ${MOOD_LABELS[checkIn.score]?.color || 'text-text-main'}`}>
                    {checkIn.score}/10
                  </span>
                  <span className={`text-[10px] ${MOOD_LABELS[checkIn.score]?.color || 'text-text-muted'}`}>
                    {MOOD_LABELS[checkIn.score]?.label}
                  </span>
                </div>
                <span className="text-[9px] text-text-muted font-courier">
                  {new Date(checkIn.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {checkIn.notes && (
                <p className="text-xs text-text-mid font-cormorant italic">{checkIn.notes}</p>
              )}
              {checkIn.activities && checkIn.activities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {checkIn.activities.map(a => (
                    <span key={a} className="text-[8px] px-1.5 py-0.5 bg-gold/10 text-gold rounded">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoodChart({ checkIns }: { checkIns: MoodCheckIn[] }) {
  const sorted = [...checkIns].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sorted.length < 2) return null;

  const width = 600;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 24, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / (sorted.length - 1)) * chartW;
  const yScale = (score: number) => padding.top + chartH - ((score - 1) / 9) * chartH;

  const points = sorted.map((c, i) => `${xScale(i)},${yScale(c.score)}`).join(' ');
  const areaPoints = `${xScale(0)},${yScale(1)} ${points} ${xScale(sorted.length - 1)},${yScale(1)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {[1, 3, 5, 7, 10].map(v => (
        <g key={v}>
          <line
            x1={padding.left} y1={yScale(v)}
            x2={width - padding.right} y2={yScale(v)}
            stroke="currentColor" className="text-border" strokeWidth="0.5"
          />
          <text x={padding.left - 6} y={yScale(v) + 3} textAnchor="end"
            className="fill-text-muted" fontSize="8" fontFamily="monospace">
            {v}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} className="fill-gold/10" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        className="text-gold"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {sorted.map((c, i) => (
        <circle
          key={c.id}
          cx={xScale(i)}
          cy={yScale(c.score)}
          r="3"
          className={`${c.score <= 3 ? 'fill-red-400' : c.score >= 7 ? 'fill-emerald-400' : 'fill-gold'}`}
        />
      ))}

      {/* Date labels */}
      {sorted.length <= 14
        ? sorted.map((c, i) => (
          <text key={`label-${c.id}`} x={xScale(i)} y={height - 4} textAnchor="middle"
            className="fill-text-muted" fontSize="7" fontFamily="monospace">
            {new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ))
        : [0, Math.floor(sorted.length / 2), sorted.length - 1].map(i => (
          <text key={`label-${i}`} x={xScale(i)} y={height - 4} textAnchor="middle"
            className="fill-text-muted" fontSize="7" fontFamily="monospace">
            {new Date(sorted[i].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ))
      }
    </svg>
  );
}
