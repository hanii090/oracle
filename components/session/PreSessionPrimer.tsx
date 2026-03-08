'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useTherapy } from '@/hooks/useTherapy';

interface PreSessionPrimerProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function PreSessionPrimer({ onComplete, onDismiss }: PreSessionPrimerProps) {
  const { getIdToken } = useAuth();
  const { therapyProfile } = useTherapy();
  const [step, setStep] = useState<'initial' | 'followup' | 'complete'>('initial');
  const [initialResponse, setInitialResponse] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInitialSubmit = async () => {
    if (!initialResponse.trim()) return;
    setIsLoading(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/pre-session-primer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          response: initialResponse,
          sessionDate: therapyProfile?.nextSessionDate || new Date().toISOString(),
          step: 'initial',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFollowUpQuestion(data.followUp || "What makes this feel important to say today?");
        setStep('followup');
      }
    } catch (e) {
      console.error('Primer error:', e);
      setFollowUpQuestion("What makes this feel important to say today?");
      setStep('followup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    setIsLoading(true);

    try {
      const token = await getIdToken();
      await fetch('/api/pre-session-primer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          response: followUpResponse,
          sessionDate: therapyProfile?.nextSessionDate || new Date().toISOString(),
          step: 'followup',
          previousResponse: initialResponse,
        }),
      });

      setStep('complete');
      setTimeout(onComplete, 2500);
    } catch (e) {
      console.error('Primer save error:', e);
      setStep('complete');
      setTimeout(onComplete, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const skipFollowUp = async () => {
    setIsLoading(true);
    try {
      const token = await getIdToken();
      await fetch('/api/pre-session-primer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          response: initialResponse,
          sessionDate: therapyProfile?.nextSessionDate || new Date().toISOString(),
          step: 'followup',
        }),
      });
    } catch (e) {
      console.error('Primer skip error:', e);
    } finally {
      setIsLoading(false);
    }
    setStep('complete');
    setTimeout(onComplete, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/98 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg bg-surface border border-border rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-cyan-900/20 border-b border-cyan-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400" aria-hidden="true">⏰</span>
              </div>
              <div>
                <h2 className="font-cinzel text-sm text-cyan-400 tracking-wide">
                  Pre-Session Primer
                </h2>
                <p className="text-[10px] text-text-muted">
                  Your session is in 1 hour
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-text-muted hover:text-gold text-xs"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <p className="text-lg text-text-main leading-relaxed mb-6 text-center">
                  What do you most want to say today that you&apos;re afraid you&apos;ll forget once you&apos;re in the room?
                </p>

                <textarea
                  value={initialResponse}
                  onChange={(e) => setInitialResponse(e.target.value)}
                  placeholder="The thing I keep meaning to bring up..."
                  rows={4}
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500 transition-colors resize-none mb-4"
                  autoFocus
                />

                <button
                  onClick={handleInitialSubmit}
                  disabled={!initialResponse.trim() || isLoading}
                  className="w-full py-3 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-cyan-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </motion.div>
            )}

            {step === 'followup' && (
              <motion.div
                key="followup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-raised border border-border rounded-lg p-4 mb-4">
                  <p className="text-xs text-text-muted mb-1">You said:</p>
                  <p className="text-sm text-text-mid italic">&quot;{initialResponse}&quot;</p>
                </div>

                <p className="text-lg text-text-main leading-relaxed mb-6 text-center">
                  {followUpQuestion}
                </p>

                <textarea
                  value={followUpResponse}
                  onChange={(e) => setFollowUpResponse(e.target.value)}
                  placeholder="Because..."
                  rows={3}
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-cyan-500 transition-colors resize-none mb-4"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={skipFollowUp}
                    disabled={isLoading}
                    className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-cyan-500/30 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-cyan-500 hover:text-void transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Done'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">✓</span>
                </div>
                <h3 className="font-cinzel text-lg text-cyan-400 mb-2">
                  Primed for Your Session
                </h3>
                <p className="text-sm text-text-muted">
                  Your thoughts are waiting. Bring them with you.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PreSessionPrimerPrompt({
  therapistName,
  sessionTime,
  onStart,
  onDismiss,
}: {
  therapistName?: string;
  sessionTime?: string;
  onStart: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md mx-4"
    >
      <div className="bg-surface border border-cyan-500/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">⏰</span>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel text-sm text-cyan-400 tracking-wide mb-1">
              Session in 1 hour
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-3">
              {therapistName ? `Your session with ${therapistName}` : 'Your therapy session'} 
              {sessionTime ? ` at ${sessionTime}` : ''} is coming up. 
              Take 2 minutes to prime yourself.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onStart}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-cyan-500/30 transition-colors"
              >
                Start Primer
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-text-muted font-cinzel text-[10px] tracking-widest uppercase hover:text-text-mid transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
