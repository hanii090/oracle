'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface Reflection {
  id: string;
  exerciseType: string;
  userResponse: string;
  socraticPrompt: string;
  createdAt: string;
}

interface ExerciseType {
  id: string;
  label: string;
}

interface HomeworkCompanionProps {
  homeworkId: string;
  homeworkTitle?: string;
  exerciseType?: string;
  onClose?: () => void;
}

export function HomeworkCompanion({ homeworkId, homeworkTitle, exerciseType: defaultType, onClose }: HomeworkCompanionProps) {
  const { user, getIdToken } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);

  // Input state
  const [selectedType, setSelectedType] = useState(defaultType || 'default');
  const [userResponse, setUserResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [latestPrompt, setLatestPrompt] = useState<string | null>(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<Array<{ prompt: string; response: string; timestamp: string }>>([]);
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalNotes, setJournalNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/homework-companion?homeworkId=${homeworkId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReflections(data.reflections || []);
        setExerciseTypes(data.exerciseTypes || []);
      }
    } catch (e) {
      console.error('Failed to load companion data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken, homeworkId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReflect = async () => {
    if (!userResponse.trim() || submitting) return;
    setSubmitting(true);
    setLatestPrompt(null);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework-companion?action=reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'reflect',
          homeworkId,
          exerciseType: selectedType,
          userResponse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLatestPrompt(data.prompt);

        // Add to journal entries
        setJournalEntries(prev => [...prev, {
          prompt: data.prompt,
          response: userResponse,
          timestamp: new Date().toISOString(),
        }]);

        setUserResponse('');
        await loadData();
      }
    } catch (e) {
      console.error('Failed to get reflection:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveJournal = async () => {
    if (journalEntries.length === 0) return;
    setSavingJournal(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework-companion?action=journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'journal',
          homeworkId,
          entries: journalEntries,
          completionNotes: journalNotes || undefined,
        }),
      });

      if (res.ok) {
        setJournalEntries([]);
        setJournalNotes('');
      }
    } catch (e) {
      console.error('Failed to save journal:', e);
    } finally {
      setSavingJournal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 border-2 border-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-sm text-text-main">Homework Companion</h3>
          {homeworkTitle && <p className="text-xs text-text-muted">{homeworkTitle}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-main text-sm">✕</button>
        )}
      </div>

      {/* Exercise type selector */}
      {exerciseTypes.length > 0 && (
        <div>
          <label className="block text-[10px] text-text-muted font-cinzel tracking-wider uppercase mb-1.5">
            Exercise Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {exerciseTypes.map(et => (
              <button
                key={et.id}
                onClick={() => setSelectedType(et.id)}
                className={`px-2.5 py-1 rounded text-[10px] border transition-all ${
                  selectedType === et.id
                    ? 'border-violet bg-violet/10 text-violet'
                    : 'border-border text-text-muted hover:border-violet/30'
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div>
        <label className="block text-[10px] text-text-muted font-cinzel tracking-wider uppercase mb-1.5">
          Your Reflection
        </label>
        <textarea
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          placeholder="Write about your experience with this homework exercise... What came up? What did you notice?"
          rows={4}
          maxLength={5000}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:border-violet/50 focus:outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              e.preventDefault();
              handleReflect();
            }
          }}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-text-muted">{userResponse.length}/5000</span>
          <button
            onClick={handleReflect}
            disabled={!userResponse.trim() || submitting}
            className="px-5 py-2 bg-violet/10 text-violet border border-violet/30 rounded-lg text-[10px] font-cinzel tracking-widest hover:bg-violet/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Reflecting...' : 'Get Socratic Prompt'}
          </button>
        </div>
      </div>

      {/* Latest Socratic prompt */}
      <AnimatePresence>
        {latestPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-violet/5 border border-violet/20 rounded-lg p-4"
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Sorca asks:</p>
            <p className="text-sm text-text-main font-cormorant italic leading-relaxed">
              &ldquo;{latestPrompt}&rdquo;
            </p>
            <p className="text-[9px] text-text-muted mt-2">
              Reflect on this question. Write your response above to continue the dialogue.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session journal */}
      {journalEntries.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-cinzel text-xs text-text-main">Session Journal ({journalEntries.length} entries)</h4>
            <button
              onClick={handleSaveJournal}
              disabled={savingJournal}
              className="px-3 py-1 bg-violet/10 text-violet border border-violet/30 rounded text-[9px] font-cinzel disabled:opacity-50"
            >
              {savingJournal ? 'Saving...' : 'Save Journal'}
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {journalEntries.map((entry, i) => (
              <div key={i} className="bg-raised/50 rounded p-2">
                <p className="text-[10px] text-text-mid mb-0.5">{entry.response.slice(0, 150)}{entry.response.length > 150 ? '...' : ''}</p>
                <p className="text-[9px] text-violet/70 italic">&ldquo;{entry.prompt}&rdquo;</p>
              </div>
            ))}
          </div>
          <textarea
            value={journalNotes}
            onChange={(e) => setJournalNotes(e.target.value)}
            placeholder="Any final notes on this homework session? (optional)"
            rows={2}
            className="w-full mt-2 bg-raised border border-border rounded px-3 py-2 text-[10px] text-text-main placeholder:text-text-muted/50 focus:border-violet/50 focus:outline-none resize-none"
            maxLength={1000}
          />
        </div>
      )}

      {/* Past reflections */}
      {reflections.length > 0 && (
        <details className="group">
          <summary className="text-[10px] text-text-muted cursor-pointer hover:text-text-mid font-cinzel tracking-wider">
            Past reflections ({reflections.length})
          </summary>
          <div className="mt-2 space-y-2">
            {reflections.slice(0, 5).map(r => (
              <div key={r.id} className="bg-surface/50 border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-violet/10 text-violet rounded">{r.exerciseType}</span>
                  <span className="text-[9px] text-text-muted">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-[10px] text-text-mid mb-1">{r.userResponse.slice(0, 100)}{r.userResponse.length > 100 ? '...' : ''}</p>
                <p className="text-[9px] text-violet/70 italic">&ldquo;{r.socraticPrompt}&rdquo;</p>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="text-[9px] text-text-muted text-center">
        This is not a replacement for therapy. Bring your reflections and journal to your next session.
      </p>
    </div>
  );
}
