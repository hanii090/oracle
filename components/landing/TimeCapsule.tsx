'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { CapsuleIcon } from '@/components/icons';

/**
 * Time Capsule — Feature 12
 * Write a message to your future self. Sorca asks three questions.
 * Seals for 6 months. Opens with a reflection.
 */

const CAPSULE_QUESTIONS = [
  "Who are you right now — in one sentence that would make a stranger understand?",
  "What do you hope will be different about you in six months?",
  "What are you afraid won't have changed?",
];

type CapsuleState = 'intro' | 'answering' | 'sealed' | 'opened' | 'list';

interface Capsule {
  id: string;
  sealedAt: string;
  opensAt: string;
  opened: boolean;
  isReady: boolean;
  daysRemaining: number;
}

export function TimeCapsule() {
  const [state, setState] = useState<CapsuleState>('intro');
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [sealedMessage, setSealedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, getIdToken } = useAuth();

  const handleSeal = useCallback(async () => {
    if (!user || answers.some(a => a.trim().length < 10)) return;
    setLoading(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/time-capsule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'create', answers }),
      });

      if (res.ok) {
        const data = await res.json();
        setSealedMessage(data.message);
        setState('sealed');
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, answers, getIdToken]);

  const loadCapsules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/time-capsule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'list' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCapsules(data.capsules || []);
        setState('list');
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl px-6 mb-8"
    >
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <CapsuleIcon size={40} className="mx-auto mb-4 text-gold" aria-hidden="true" />
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">The Time Capsule</h3>
              <p className="font-cormorant italic text-base text-text-mid mb-6 max-w-md mx-auto">
                Write a message to your future self. Sorca will ask you three questions, seal your answers, and open them in six months — with a reflection on how you&apos;ve changed.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => { setCurrentQuestion(0); setState('answering'); }}
                  className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors"
                >
                  Seal a Capsule
                </button>
                <button
                  onClick={loadCapsules}
                  className="px-6 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
                >
                  My Capsules
                </button>
              </div>
            </motion.div>
          )}

          {state === 'answering' && (
            <motion.div
              key="answering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              <div className="flex items-center gap-2 mb-6">
                {CAPSULE_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= currentQuestion ? 'bg-gold' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className="font-cormorant italic text-xl text-text-main mb-6">
                &ldquo;{CAPSULE_QUESTIONS[currentQuestion]}&rdquo;
              </p>
              <textarea
                value={answers[currentQuestion]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = e.target.value;
                  setAnswers(newAnswers);
                }}
                className="w-full bg-raised border border-border rounded-lg p-4 font-cormorant text-base text-text-main placeholder:text-text-muted/40 focus:border-gold/40 focus:outline-none resize-none"
                rows={4}
                placeholder="Be honest with your future self..."
              />
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => {
                    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
                    else setState('intro');
                  }}
                  className="font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
                >
                  ← Back
                </button>
                {currentQuestion < 2 ? (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    disabled={answers[currentQuestion].trim().length < 10}
                    className="px-6 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSeal}
                    disabled={loading || answers[currentQuestion].trim().length < 10}
                    className="px-6 py-2 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold hover:text-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sealing...' : '🔒 Seal Capsule'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {state === 'sealed' && (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <span className="text-5xl mb-4 block" aria-hidden="true">🔒</span>
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">Capsule Sealed</h3>
              <p className="font-cormorant italic text-base text-text-mid mb-2">{sealedMessage}</p>
              <p className="font-courier text-[10px] text-text-muted tracking-widest uppercase mt-4">
                See you in six months.
              </p>
              <button
                onClick={() => setState('intro')}
                className="mt-6 font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
              >
                Close
              </button>
            </motion.div>
          )}

          {state === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-6">Your Time Capsules</h3>
              {capsules.length === 0 ? (
                <p className="font-cormorant italic text-sm text-text-muted text-center py-4">
                  No capsules yet. Seal your first one.
                </p>
              ) : (
                <div className="space-y-3">
                  {capsules.map((capsule) => (
                    <div
                      key={capsule.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{capsule.opened ? '📭' : capsule.isReady ? '✨' : '🔒'}</span>
                        <div>
                          <div className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
                            Sealed {new Date(capsule.sealedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="font-cormorant italic text-sm text-text-mid">
                            {capsule.opened
                              ? 'Opened'
                              : capsule.isReady
                              ? 'Ready to open!'
                              : `Opens in ${capsule.daysRemaining} days`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setState('intro')}
                className="mt-4 font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
