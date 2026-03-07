'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface ThoughtDropData {
  id: string;
  content: string;
  socraticResponse: string | null;
  createdAt: string;
}

interface ThoughtDropProps {
  variant?: 'floating' | 'inline';
  onClose?: () => void;
}

export function ThoughtDrop({ variant = 'inline', onClose }: ThoughtDropProps) {
  const { user, getIdToken } = useAuth();
  const [thought, setThought] = useState('');
  const [drops, setDrops] = useState<ThoughtDropData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const loadDrops = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/thought-drop?limit=10', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDrops(data.drops || []);
      }
    } catch (e) {
      console.error('Failed to load thought drops:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  const handleSubmit = async () => {
    if (!thought.trim() || submitting) return;
    setSubmitting(true);
    setLastResponse(null);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/thought-drop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: thought }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastResponse(data.drop.socraticResponse);
        setDrops(prev => [data.drop, ...prev]);
        setThought('');
      }
    } catch (e) {
      console.error('Failed to submit thought:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Input area */}
      <div>
        <p className="text-xs text-text-muted mb-2 italic">
          Had a thought between sessions? Drop it here.
        </p>
        <div className="relative">
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="What's on your mind..."
            rows={3}
            maxLength={500}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none pr-16"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!thought.trim() || submitting}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-gold/10 text-gold border border-gold/30 rounded text-[10px] font-cinzel tracking-widest hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '...' : 'Drop'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-text-muted">{thought.length}/500</span>
          <span className="text-[9px] text-text-muted">Not a full session — just a quick reflection</span>
        </div>
      </div>

      {/* Socratic response */}
      <AnimatePresence>
        {lastResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gold/5 border border-gold/20 rounded-lg p-4"
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Sorca reflects:</p>
            <p className="text-sm text-text-main font-cormorant italic leading-relaxed">
              &ldquo;{lastResponse}&rdquo;
            </p>
            <p className="text-[9px] text-text-muted mt-2">
              Sit with this. No need to respond — your therapist will see a summary before your next session.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent drops */}
      {drops.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] text-text-muted hover:text-text-mid font-cinzel tracking-wider"
          >
            {showHistory ? '▾' : '▸'} Recent thoughts ({drops.length})
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {drops.slice(0, 5).map(drop => (
                  <div key={drop.id} className="bg-surface/50 border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs text-text-mid flex-1">{drop.content}</p>
                      <span className="text-[9px] text-text-muted whitespace-nowrap">
                        {new Date(drop.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {drop.socraticResponse && (
                      <p className="text-[10px] text-gold/80 italic mt-1">
                        &ldquo;{drop.socraticResponse}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-20 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-surface border border-gold/30 rounded-lg p-4 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-cinzel text-sm text-gold tracking-wider">Thought Drop</h3>
            {onClose && (
              <button onClick={onClose} className="text-text-muted hover:text-text-main text-sm">✕</button>
            )}
          </div>
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h3 className="font-cinzel text-sm text-gold tracking-wider mb-3">Thought Drop</h3>
      {content}
    </div>
  );
}
