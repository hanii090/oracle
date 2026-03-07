'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface PreSessionMoodCheckInProps {
  onComplete: (mood: { score: number; mainConcern: string }) => void;
  onSkip: () => void;
}

const MOOD_WORDS = [
  { label: 'Anxious', score: 3, color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' },
  { label: 'Sad', score: 3, color: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10' },
  { label: 'Angry', score: 3, color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
  { label: 'Numb', score: 4, color: 'text-text-muted border-border hover:bg-raised' },
  { label: 'Okay', score: 6, color: 'text-text-mid border-border hover:bg-raised' },
  { label: 'Hopeful', score: 7, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
  { label: 'Calm', score: 7, color: 'text-teal border-teal/30 hover:bg-teal/10' },
  { label: 'Good', score: 8, color: 'text-gold border-gold/30 hover:bg-gold/10' },
];

export function PreSessionMoodCheckIn({ onComplete, onSkip }: PreSessionMoodCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [mainConcern, setMainConcern] = useState('');
  const [step, setStep] = useState<'mood' | 'concern'>('mood');

  const handleMoodSelect = (label: string) => {
    setSelectedMood(label);
    setStep('concern');
  };

  const handleComplete = () => {
    const mood = MOOD_WORDS.find(m => m.label === selectedMood);
    onComplete({
      score: mood?.score || 5,
      mainConcern: mainConcern.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4"
      >
        {step === 'mood' && (
          <>
            <h2 className="font-cinzel text-lg text-gold tracking-wider mb-2 text-center">
              How are you arriving?
            </h2>
            <p className="text-xs text-text-muted text-center mb-6">
              This helps Sorca meet you where you are.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {MOOD_WORDS.map(mood => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodSelect(mood.label)}
                  className={`p-3 rounded-lg border text-sm font-cinzel tracking-wider transition-all ${mood.color} ${
                    selectedMood === mood.label ? 'ring-1 ring-gold' : ''
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>

            <button
              onClick={onSkip}
              className="w-full text-center text-[10px] text-text-muted/60 hover:text-text-muted font-courier tracking-wider"
            >
              Skip check-in
            </button>
          </>
        )}

        {step === 'concern' && (
          <>
            <h2 className="font-cinzel text-lg text-gold tracking-wider mb-2 text-center">
              What&apos;s on your mind?
            </h2>
            <p className="text-xs text-text-muted text-center mb-4">
              One sentence is enough. This is just for you and Sorca.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-text-muted">Arriving:</span>
              <span className="text-xs text-gold font-cinzel">{selectedMood}</span>
            </div>

            <textarea
              value={mainConcern}
              onChange={(e) => setMainConcern(e.target.value)}
              placeholder="What's the main thing on your mind right now?"
              maxLength={300}
              rows={3}
              className="w-full bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none font-cormorant mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 bg-gold text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/80 transition-colors"
              >
                Begin Session
              </button>
              <button
                onClick={() => { onComplete({ score: MOOD_WORDS.find(m => m.label === selectedMood)?.score || 5, mainConcern: '' }); }}
                className="px-4 py-2.5 border border-border text-text-muted font-cinzel text-xs tracking-widest rounded-lg hover:border-gold/30"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
