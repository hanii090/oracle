'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Stars } from '@/components/Stars';
import { motion } from 'motion/react';
import Link from 'next/link';

interface WeekSummary {
  id: string;
  themes: string[];
  moodTrend: string;
  keyInsight: string;
  openQuestions: string[];
  suggestedFocus: string;
  sessionCount: number;
  homeworkCheckIns: number;
  generatedAt: string;
  therapistNotes?: string;
}

export default function SharedSummaryPage() {
  const params = useParams();
  const weekId = params.weekId as string;
  const { user, getIdToken, isTherapist } = useAuth();
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await getIdToken();
        const res = await fetch(`/api/week-summary?weekId=${weekId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
        } else {
          setError('Summary not found or access denied');
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err);
        setError('Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user, weekId, getIdToken]);

  const getMoodIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      case 'fluctuating': return '📊';
      default: return '📊';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen bg-void relative">
        <Stars />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center relative z-10">
          <h1 className="font-cinzel text-2xl text-text-main mb-4">Summary Not Found</h1>
          <p className="text-text-muted mb-8">{error || 'This summary may have been removed or you don\'t have access.'}</p>
          <Link href="/" className="text-gold hover:text-gold/80 font-cinzel text-sm tracking-widest">
            ← Back to Sorca
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Week Summary</p>
          <h1 className="font-cinzel text-2xl text-text-main mb-2">
            {formatDate(summary.generatedAt)}
          </h1>
          <p className="text-sm text-text-muted">
            {summary.sessionCount} sessions · {summary.homeworkCheckIns} check-ins
          </p>
        </motion.div>

        {/* Mood Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-xl p-6 mb-6 text-center"
        >
          <div className="text-4xl mb-2">{getMoodIcon(summary.moodTrend)}</div>
          <p className="text-sm text-text-muted">This week felt</p>
          <p className="font-cinzel text-lg text-text-main capitalize">{summary.moodTrend}</p>
        </motion.div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6 mb-6"
        >
          <p className="text-xs text-amber-400 uppercase tracking-widest mb-3">Key Insight</p>
          <p className="font-cormorant text-xl text-text-main leading-relaxed">
            &ldquo;{summary.keyInsight}&rdquo;
          </p>
        </motion.div>

        {/* Themes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface border border-border rounded-xl p-6 mb-6"
        >
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Themes This Week</p>
          <div className="flex flex-wrap gap-2">
            {summary.themes.map((theme, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm"
              >
                {theme}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Open Questions */}
        {summary.openQuestions && summary.openQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface border border-border rounded-xl p-6 mb-6"
          >
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Questions to Explore</p>
            <ul className="space-y-2">
              {summary.openQuestions.map((q, i) => (
                <li key={i} className="text-text-mid flex items-start gap-2">
                  <span className="text-violet-400">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Suggested Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-6 mb-6"
        >
          <p className="text-xs text-teal-400 uppercase tracking-widest mb-3">Suggested Focus</p>
          <p className="text-text-main">{summary.suggestedFocus}</p>
        </motion.div>

        {/* Therapist Notes (only visible to therapists) */}
        {isTherapist && summary.therapistNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-6 mb-6"
          >
            <p className="text-xs text-violet-400 uppercase tracking-widest mb-3">Clinical Notes (Private)</p>
            <p className="text-text-mid text-sm">{summary.therapistNotes}</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center gap-4"
        >
          <Link
            href="/user-dashboard"
            className="px-6 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/10"
          >
            View Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-2 bg-gold text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/90"
          >
            Start Session
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
