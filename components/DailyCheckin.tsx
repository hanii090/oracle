'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface DailyCheckinProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: CheckinData) => void;
  onStartVoiceSession?: () => void;
  userName?: string;
  lastMood?: number;
  streak?: number;
}

export interface CheckinData {
  mood: number;
  activities: string[];
  note: string;
  timestamp: number;
}

const ACTIVITIES = [
  { id: 'exercise', emoji: '🏃', label: 'Exercise' },
  { id: 'social', emoji: '👥', label: 'Social' },
  { id: 'nature', emoji: '🌿', label: 'Nature' },
  { id: 'creative', emoji: '🎨', label: 'Creative' },
  { id: 'meditation', emoji: '🧘', label: 'Meditation' },
  { id: 'reading', emoji: '📖', label: 'Reading' },
  { id: 'sleep', emoji: '😴', label: 'Good Sleep' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'work', emoji: '💻', label: 'Work' },
  { id: 'cooking', emoji: '🍳', label: 'Cooking' },
];

const MOOD_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😢', label: 'Terrible', color: 'text-red-400' },
  2: { emoji: '😰', label: 'Very Low', color: 'text-red-300' },
  3: { emoji: '😔', label: 'Low', color: 'text-orange-400' },
  4: { emoji: '😕', label: 'Below Average', color: 'text-orange-300' },
  5: { emoji: '😐', label: 'Neutral', color: 'text-yellow-400' },
  6: { emoji: '🙂', label: 'Okay', color: 'text-lime-400' },
  7: { emoji: '😊', label: 'Good', color: 'text-green-400' },
  8: { emoji: '😄', label: 'Great', color: 'text-green-300' },
  9: { emoji: '🥰', label: 'Wonderful', color: 'text-emerald-400' },
  10: { emoji: '✨', label: 'Amazing', color: 'text-emerald-300' },
};

export function DailyCheckin({
  isOpen,
  onClose,
  onComplete,
  onStartVoiceSession,
  userName,
  lastMood,
  streak = 0,
}: DailyCheckinProps) {
  // When !isOpen we return null, which unmounts DailyCheckinInner.
  // When isOpen becomes true again, DailyCheckinInner remounts fresh
  // with default state — no refs or effects needed for reset.
  if (!isOpen) return null;

  return (
    <DailyCheckinInner
      onClose={onClose}
      onComplete={onComplete}
      onStartVoiceSession={onStartVoiceSession}
      userName={userName}
      lastMood={lastMood}
      streak={streak}
    />
  );
}

function DailyCheckinInner({
  onClose,
  onComplete,
  onStartVoiceSession,
  userName,
  lastMood,
  streak = 0,
}: Omit<DailyCheckinProps, 'isOpen'>) {
  const [step, setStep] = useState<'mood' | 'activities' | 'note' | 'done'>('mood');
  const [mood, setMood] = useState<number>(5);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const handleMoodSelect = useCallback((value: number) => {
    setMood(value);
    // Auto-advance after a brief pause
    setTimeout(() => setStep('activities'), 400);
  }, []);

  const toggleActivity = useCallback((id: string) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }, []);

  const handleComplete = useCallback(() => {
    const data: CheckinData = {
      mood,
      activities: selectedActivities,
      note,
      timestamp: Date.now(),
    };
    setStep('done');
    onComplete(data);
  }, [mood, selectedActivities, note, onComplete]);

  const moodTrend = lastMood !== undefined
    ? mood > lastMood ? 'up' : mood < lastMood ? 'down' : 'same'
    : null;

  const timeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md mx-4 bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h3 className="text-lg font-medium text-white/90">
                {step === 'done' ? 'Check-in Complete ✦' : `${timeGreeting}${userName ? `, ${userName}` : ''}`}
              </h3>
              {streak > 0 && step !== 'done' && (
                <p className="text-xs text-amber-500/60 mt-0.5">
                  🔥 {streak}-day streak
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* Step 1: Mood */}
              {step === 'mood' && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <p className="text-sm text-white/50">How are you feeling right now?</p>

                  {/* Mood slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl">{MOOD_LABELS[mood]?.emoji}</span>
                      <div>
                        <span className={`text-lg font-medium ${MOOD_LABELS[mood]?.color}`}>
                          {MOOD_LABELS[mood]?.label}
                        </span>
                        {moodTrend && (
                          <span className="ml-2 inline-flex items-center">
                            {moodTrend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                            {moodTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                            {moodTrend === 'same' && <Minus className="w-4 h-4 text-yellow-400" />}
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={mood}
                      onChange={(e) => setMood(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
                        [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-900/30"
                    />

                    <div className="flex justify-between text-[10px] text-white/20">
                      <span>Terrible</span>
                      <span>Amazing</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('activities')}
                    className="w-full py-3 rounded-xl bg-amber-900/20 hover:bg-amber-900/30 text-amber-200/80 text-sm font-medium transition-colors"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {/* Step 2: Activities */}
              {step === 'activities' && (
                <motion.div
                  key="activities"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-white/50">What have you done today? (optional)</p>

                  <div className="grid grid-cols-5 gap-2">
                    {ACTIVITIES.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => toggleActivity(activity.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                          selectedActivities.includes(activity.id)
                            ? 'bg-amber-900/30 border border-amber-500/30'
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">{activity.emoji}</span>
                        <span className="text-[9px] text-white/40 leading-tight">{activity.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('note')}
                      className="flex-1 py-3 rounded-xl bg-amber-900/20 hover:bg-amber-900/30 text-amber-200/80 text-sm font-medium transition-colors"
                    >
                      Add a note
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex-1 py-3 rounded-xl bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-200/80 text-sm font-medium transition-colors"
                    >
                      Done ✓
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Note */}
              {step === 'note' && (
                <motion.div
                  key="note"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-white/50">Anything else on your mind?</p>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write freely — this is just for you..."
                    className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-500/30"
                    autoFocus
                  />

                  <button
                    onClick={handleComplete}
                    className="w-full py-3 rounded-xl bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-200/80 text-sm font-medium transition-colors"
                  >
                    Complete Check-in ✓
                  </button>
                </motion.div>
              )}

              {/* Step 4: Done */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                  >
                    <Sparkles className="w-12 h-12 text-amber-400/60 mx-auto" />
                  </motion.div>

                  <div className="space-y-1">
                    <p className="text-white/80">Mood logged: {MOOD_LABELS[mood]?.emoji} {MOOD_LABELS[mood]?.label}</p>
                    {selectedActivities.length > 0 && (
                      <p className="text-sm text-white/40">
                        {selectedActivities.map(id => ACTIVITIES.find(a => a.id === id)?.emoji).join(' ')}
                      </p>
                    )}
                    {streak > 0 && (
                      <p className="text-sm text-amber-500/60">🔥 {streak + 1}-day streak!</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {onStartVoiceSession && (
                      <button
                        onClick={() => {
                          onClose();
                          onStartVoiceSession();
                        }}
                        className="w-full py-3 rounded-xl bg-amber-900/20 hover:bg-amber-900/30 text-amber-200/80 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        Start a voice session
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
