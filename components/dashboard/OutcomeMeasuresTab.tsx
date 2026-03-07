'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { PHQ9Form } from '@/components/outcome/PHQ9Form';
import { GAD7Form } from '@/components/outcome/GAD7Form';

interface OutcomeMeasure {
  id: string;
  type: 'PHQ9' | 'GAD7' | 'WSAS';
  scores: number[];
  total: number;
  severity: string;
  timestamp: string;
  isInitial: boolean;
}

interface Recovery {
  recovered: boolean;
  reliableImprovement: boolean;
  reliableDeterioration: boolean;
  phq9Change: number;
  gad7Change: number;
}

export function OutcomeMeasuresTab() {
  const { getIdToken, profile } = useAuth();
  const [measures, setMeasures] = useState<OutcomeMeasure[]>([]);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<'PHQ9' | 'GAD7' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMeasures = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/outcome-measures?limit=50', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMeasures(data.measures || []);
        setRecovery(data.recovery || null);
      }
    } catch (e) {
      console.error('Failed to load outcome measures:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadMeasures();
  }, [loadMeasures]);

  const handleSubmitMeasure = async (type: 'PHQ9' | 'GAD7', scores: number[], total: number) => {
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/outcome-measures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, scores }),
      });
      if (res.ok) {
        setActiveForm(null);
        await loadMeasures();
      }
    } catch (e) {
      console.error('Failed to submit measure:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const phq9Measures = measures.filter(m => m.type === 'PHQ9');
  const gad7Measures = measures.filter(m => m.type === 'GAD7');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeForm === 'PHQ9') {
    return (
      <div>
        <button
          onClick={() => setActiveForm(null)}
          className="text-xs text-text-muted hover:text-text-main font-cinzel tracking-widest mb-4"
        >
          ← Back to Outcomes
        </button>
        <PHQ9Form
          onSubmit={(scores, total) => handleSubmitMeasure('PHQ9', scores, total)}
          onCancel={() => setActiveForm(null)}
          isSubmitting={submitting}
        />
      </div>
    );
  }

  if (activeForm === 'GAD7') {
    return (
      <div>
        <button
          onClick={() => setActiveForm(null)}
          className="text-xs text-text-muted hover:text-text-main font-cinzel tracking-widest mb-4"
        >
          ← Back to Outcomes
        </button>
        <GAD7Form
          onSubmit={(scores, total) => handleSubmitMeasure('GAD7', scores, total)}
          onCancel={() => setActiveForm(null)}
          isSubmitting={submitting}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase">
          Outcome Measures
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveForm('PHQ9')}
            className="text-[10px] px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg font-cinzel tracking-wider hover:bg-blue-500/20 transition-colors"
          >
            + PHQ-9
          </button>
          <button
            onClick={() => setActiveForm('GAD7')}
            className="text-[10px] px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-lg font-cinzel tracking-wider hover:bg-violet-500/20 transition-colors"
          >
            + GAD-7
          </button>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-6">
        Track your mental health with validated clinical measures used by the NHS. Complete these fortnightly for the most accurate picture.
      </p>

      {/* Recovery Status */}
      {recovery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 ${
            recovery.recovered
              ? 'bg-emerald-900/20 border border-emerald-500/30'
              : recovery.reliableImprovement
                ? 'bg-gold/10 border border-gold/30'
                : recovery.reliableDeterioration
                  ? 'bg-red-900/20 border border-red-500/30'
                  : 'bg-surface border border-border'
          }`}
        >
          <h3 className="font-cinzel text-sm text-text-main mb-2">Recovery Status</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-muted">PHQ-9 change:</span>
              <span className={`ml-2 ${recovery.phq9Change < 0 ? 'text-emerald-400' : recovery.phq9Change > 0 ? 'text-red-400' : 'text-text-mid'}`}>
                {recovery.phq9Change > 0 ? '+' : ''}{recovery.phq9Change}
              </span>
            </div>
            <div>
              <span className="text-text-muted">GAD-7 change:</span>
              <span className={`ml-2 ${recovery.gad7Change < 0 ? 'text-emerald-400' : recovery.gad7Change > 0 ? 'text-red-400' : 'text-text-mid'}`}>
                {recovery.gad7Change > 0 ? '+' : ''}{recovery.gad7Change}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10px]">
            {recovery.recovered && <span className="text-emerald-400">Recovered — scores below clinical thresholds</span>}
            {!recovery.recovered && recovery.reliableImprovement && <span className="text-gold">Reliable improvement detected</span>}
            {recovery.reliableDeterioration && <span className="text-red-400">Scores have worsened — consider discussing with your therapist</span>}
            {!recovery.recovered && !recovery.reliableImprovement && !recovery.reliableDeterioration && (
              <span className="text-text-muted">No significant change yet</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Score Charts */}
      {(phq9Measures.length > 0 || gad7Measures.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {phq9Measures.length > 0 && (
            <div className="bg-raised border border-border rounded-lg p-4">
              <h3 className="font-cinzel text-xs text-blue-400 mb-3">PHQ-9 (Depression)</h3>
              <ScoreChart measures={phq9Measures} color="blue" maxScore={27} />
            </div>
          )}
          {gad7Measures.length > 0 && (
            <div className="bg-raised border border-border rounded-lg p-4">
              <h3 className="font-cinzel text-xs text-violet-400 mb-3">GAD-7 (Anxiety)</h3>
              <ScoreChart measures={gad7Measures} color="violet" maxScore={21} />
            </div>
          )}
        </div>
      )}

      {/* History */}
      {measures.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-4 opacity-30">📋</div>
          <p className="text-sm text-text-muted mb-2">No outcome measures recorded yet.</p>
          <p className="text-xs text-text-muted/70 max-w-md mx-auto">
            The PHQ-9 measures depression symptoms and the GAD-7 measures anxiety.
            Both are used by the NHS as standard clinical tools.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {measures.map(m => (
            <div key={m.id} className="p-3 bg-raised border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-cinzel ${
                    m.type === 'PHQ9' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
                  }`}>
                    {m.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'}
                  </span>
                  <span className="text-sm font-cinzel text-text-main">{m.total}</span>
                  {m.isInitial && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-gold/10 text-gold rounded">baseline</span>
                  )}
                </div>
                <span className="text-[9px] text-text-muted font-courier">
                  {new Date(m.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-[10px] text-text-muted">{m.severity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreChart({ measures, color, maxScore }: { measures: OutcomeMeasure[]; color: 'blue' | 'violet'; maxScore: number }) {
  const sorted = [...measures].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sorted.length < 1) return null;

  const width = 280;
  const height = 100;
  const padding = { top: 8, right: 8, bottom: 20, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW);
  const yScale = (score: number) => padding.top + chartH - (score / maxScore) * chartH;

  const colorClass = color === 'blue' ? 'text-blue-400' : 'text-violet-400';
  const fillClass = color === 'blue' ? 'fill-blue-400/10' : 'fill-violet-400/10';

  if (sorted.length === 1) {
    return (
      <div className="text-center py-2">
        <div className={`text-2xl font-cinzel ${colorClass}`}>{sorted[0].total}</div>
        <div className="text-[9px] text-text-muted">{sorted[0].severity}</div>
      </div>
    );
  }

  const points = sorted.map((m, i) => `${xScale(i)},${yScale(m.total)}`).join(' ');
  const areaPoints = `${xScale(0)},${yScale(0)} ${points} ${xScale(sorted.length - 1)},${yScale(0)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, Math.round(maxScore / 3), Math.round(maxScore * 2 / 3), maxScore].map(v => (
        <g key={v}>
          <line x1={padding.left} y1={yScale(v)} x2={width - padding.right} y2={yScale(v)}
            stroke="currentColor" className="text-border" strokeWidth="0.5" />
          <text x={padding.left - 4} y={yScale(v) + 3} textAnchor="end"
            className="fill-text-muted" fontSize="7" fontFamily="monospace">{v}</text>
        </g>
      ))}
      <polygon points={areaPoints} className={fillClass} />
      <polyline points={points} fill="none" stroke="currentColor" className={colorClass}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {sorted.map((m, i) => (
        <circle key={m.id} cx={xScale(i)} cy={yScale(m.total)} r="3"
          className={color === 'blue' ? 'fill-blue-400' : 'fill-violet-400'} />
      ))}
      {sorted.map((m, i) => (
        <text key={`label-${m.id}`} x={xScale(i)} y={height - 4} textAnchor="middle"
          className="fill-text-muted" fontSize="6" fontFamily="monospace">
          {new Date(m.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </text>
      ))}
    </svg>
  );
}
