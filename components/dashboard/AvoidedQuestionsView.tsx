'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface AvoidedQuestion {
  id: string;
  question: string;
  userResponse: string;
  deflectionType: string;
  confidence: number;
  significance: string;
  detectedAt: string;
  surfaced: boolean;
}

const DEFLECTION_LABELS: Record<string, { label: string; color: string }> = {
  humour: { label: 'Humour', color: 'text-amber-400' },
  topic_change: { label: 'Topic change', color: 'text-violet-400' },
  vagueness: { label: 'Vagueness', color: 'text-text-muted' },
  intellectualising: { label: 'Intellectualising', color: 'text-blue-400' },
  dismissal: { label: 'Dismissal', color: 'text-red-400' },
  too_quick: { label: 'Too quick', color: 'text-amber-400' },
};

export function AvoidedQuestionsView() {
  const { getIdToken } = useAuth();
  const [questions, setQuestions] = useState<AvoidedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/avoided', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.avoidedQuestions || []);
      }
    } catch (e) {
      console.error('Failed to load avoided questions:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
        Questions You&apos;ve Circled
      </h2>
      <p className="text-xs text-text-muted mb-6">
        Sorca detected these moments where you may have deflected or avoided going deeper. 
        There&apos;s no pressure — but exploring them might be meaningful.
      </p>

      {questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-4 opacity-30">🔄</div>
          <p className="text-sm text-text-muted">No avoided questions detected yet.</p>
          <p className="text-xs text-text-muted/70 mt-2">
            After a few sessions, Sorca will identify questions you may have circled around.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {questions.map((q) => {
            const deflection = DEFLECTION_LABELS[q.deflectionType] || { label: q.deflectionType, color: 'text-text-muted' };
            const daysSince = Math.floor(
              (Date.now() - new Date(q.detectedAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-raised border border-border rounded-lg hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-text-main font-cinzel leading-relaxed flex-1">
                    &ldquo;{q.question}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded ${deflection.color} bg-current/10`}>
                      <span className={deflection.color}>{deflection.label}</span>
                    </span>
                  </div>
                </div>

                {q.significance && (
                  <p className="text-[10px] text-text-muted mb-2 font-cormorant italic">
                    {q.significance}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-text-muted font-courier">
                    {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                    {' · '}
                    {Math.round(q.confidence * 100)}% confidence
                  </span>
                </div>

                {q.userResponse && (
                  <details className="mt-2">
                    <summary className="text-[9px] text-text-muted/60 cursor-pointer hover:text-text-muted">
                      Your original response
                    </summary>
                    <p className="mt-1.5 text-xs text-text-mid/70 font-cormorant italic pl-3 border-l border-border">
                      &ldquo;{q.userResponse}&rdquo;
                    </p>
                  </details>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
