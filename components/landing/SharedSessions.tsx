'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Shared Sessions — Feature 15
 * Two people answer the same questions independently.
 */

type SharedState = 'intro' | 'create' | 'join' | 'answering' | 'waiting' | 'results';

export function SharedSessions() {
  const [state, setState] = useState<SharedState>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, getIdToken } = useAuth();

  const createSession = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/shared-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'create', partnerName }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setInviteCode(data.session.inviteCode);
        setQuestions(data.session.questions);
        setAnswers(new Array(data.session.questions.length).fill(''));
        setState('create');
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, partnerName, getIdToken]);

  const joinSession = useCallback(async () => {
    if (!user || !joinCode) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/shared-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'join', inviteCode: joinCode, partnerName }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setQuestions(data.session.questions);
        setAnswers(new Array(data.session.questions.length).fill(''));
        setState('answering');
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, joinCode, partnerName, getIdToken]);

  const submitAnswers = useCallback(async () => {
    if (!user || !sessionId) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/shared-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'submit', sessionId, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'complete') {
          setResults(data);
          setState('results');
        } else {
          setState('waiting');
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, sessionId, answers, getIdToken]);

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
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <span className="text-4xl mb-4 block" aria-hidden="true">👥</span>
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">Shared Session</h3>
              <p className="font-cormorant italic text-base text-text-mid mb-6 max-w-md mx-auto">
                Two people. Same questions. Neither sees the other&apos;s answers until both have responded. What you discover about each other might change everything.
              </p>
              <input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full max-w-xs mx-auto mb-4 bg-raised border border-border rounded-lg px-4 py-2 font-cormorant text-sm text-text-main placeholder:text-text-muted/40 focus:border-gold/40 focus:outline-none text-center block"
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={createSession}
                  disabled={loading}
                  className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-30"
                >
                  {loading ? '...' : 'Create Session'}
                </button>
                <button
                  onClick={() => setState('join')}
                  className="px-6 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
                >
                  Join with Code
                </button>
              </div>
            </motion.div>
          )}

          {state === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <span className="text-4xl mb-4 block" aria-hidden="true">🔗</span>
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">Share This Code</h3>
              <div className="bg-raised border border-gold/20 rounded-lg px-8 py-4 inline-block mb-4">
                <span className="font-cinzel text-3xl tracking-[0.3em] text-gold">{inviteCode}</span>
              </div>
              <p className="font-cormorant italic text-sm text-text-muted mb-6">
                Send this code to your partner. Once they join, you&apos;ll both answer the same questions.
              </p>
              <button
                onClick={() => { setCurrentQ(0); setState('answering'); }}
                className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors"
              >
                Start Answering →
              </button>
            </motion.div>
          )}

          {state === 'join' && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-6">Enter Invite Code</h3>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="bg-raised border border-border rounded-lg px-8 py-4 font-cinzel text-2xl tracking-[0.3em] text-text-main placeholder:text-text-muted/30 focus:border-gold/40 focus:outline-none text-center w-full max-w-xs mx-auto block mb-4"
              />
              <div className="flex justify-center gap-4">
                <button onClick={() => setState('intro')} className="font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase">← Back</button>
                <button
                  onClick={joinSession}
                  disabled={loading || joinCode.length < 6}
                  className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-30"
                >
                  {loading ? '...' : 'Join'}
                </button>
              </div>
            </motion.div>
          )}

          {state === 'answering' && questions.length > 0 && (
            <motion.div key="answering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
              <div className="flex items-center gap-2 mb-6">
                {questions.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentQ ? 'bg-gold' : 'bg-border'}`} />
                ))}
              </div>
              <p className="font-cormorant italic text-xl text-text-main mb-6">&ldquo;{questions[currentQ]}&rdquo;</p>
              <textarea
                value={answers[currentQ]}
                onChange={(e) => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
                className="w-full bg-raised border border-border rounded-lg p-4 font-cormorant text-base text-text-main placeholder:text-text-muted/40 focus:border-gold/40 focus:outline-none resize-none"
                rows={4}
                placeholder="Answer honestly — they can't see this until you've both finished."
              />
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setState('intro')}
                  className="font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
                >← Back</button>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ(currentQ + 1)}
                    disabled={answers[currentQ].trim().length < 5}
                    className="px-6 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-30"
                  >Next →</button>
                ) : (
                  <button
                    onClick={submitAnswers}
                    disabled={loading || answers[currentQ].trim().length < 5}
                    className="px-6 py-2 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold hover:text-void transition-colors disabled:opacity-30"
                  >{loading ? 'Submitting...' : 'Submit All'}</button>
                )}
              </div>
            </motion.div>
          )}

          {state === 'waiting' && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">Waiting</h3>
              <p className="font-cormorant italic text-sm text-text-muted">
                Your answers are sealed. Waiting for the other person to finish.
              </p>
            </motion.div>
          )}

          {state === 'results' && results && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-6 text-center">What Sorca Sees</h3>
              {results.analysis && (
                <div className="bg-gold-dim border border-gold/15 border-l-2 border-l-gold p-6 rounded-lg mb-6">
                  <p className="font-cormorant italic text-base text-text-main leading-relaxed whitespace-pre-line">{results.analysis}</p>
                </div>
              )}
              <button
                onClick={() => setState('intro')}
                className="mx-auto block font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
              >Close</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
