'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTherapy } from '@/hooks/useTherapy';
import { SofaIcon, CalendarIcon } from '@/components/icons';

interface TherapyOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export function TherapyOnboarding({ onComplete, onSkip }: TherapyOnboardingProps) {
  const { completeTherapyOnboarding } = useTherapy();
  const [step, setStep] = useState(1);
  const [inTherapy, setInTherapy] = useState<boolean | null>(null);
  const [sessionDay, setSessionDay] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<string>('');
  const [therapistName, setTherapistName] = useState<string>('');

  const handleComplete = async () => {
    if (inTherapy === null) return;

    // Calculate next session date based on day and time
    let nextSessionDate: string | null = null;
    if (inTherapy && sessionDay) {
      const today = new Date();
      const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === sessionDay);
      const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Adjust for Monday start
      
      let daysUntilSession = dayIndex - todayIndex;
      if (daysUntilSession <= 0) daysUntilSession += 7;
      
      const nextSession = new Date(today);
      nextSession.setDate(today.getDate() + daysUntilSession);
      
      if (sessionTime) {
        const [hours, minutes] = sessionTime.split(':').map(Number);
        nextSession.setHours(hours, minutes, 0, 0);
      }
      
      nextSessionDate = nextSession.toISOString();
    }

    await completeTherapyOnboarding({
      inTherapy,
      sessionDay: inTherapy ? sessionDay : null,
      sessionTime: inTherapy ? sessionTime : null,
      therapistName: inTherapy ? therapistName : null,
      nextSessionDate,
    });
    
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg mx-4 bg-surface border border-border rounded-lg p-8 relative"
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-text-muted hover:text-gold transition-colors text-xs font-cinzel tracking-widest"
          aria-label="Skip therapy setup"
        >
          Skip
        </button>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Testimonial banner */}
              <div className="bg-teal-900/20 border border-teal-500/20 rounded-lg p-4 mb-6 -mx-2">
                <p className="font-cormorant italic text-sm text-teal-400/90 text-center leading-relaxed">
                  &ldquo;My clients come to sessions already excavated. We go deeper, faster.&rdquo;
                </p>
                <p className="font-courier text-[9px] text-teal-400/60 text-center mt-2 tracking-wider">
                  — Dr. Priya Khatri, NHS Psychotherapist
                </p>
              </div>

              <div className="text-center mb-6">
                <SofaIcon size={32} className="mx-auto mb-4 text-gold" aria-hidden="true" />
                <h2 className="font-cinzel text-xl text-text-main mb-2">
                  Are you currently in therapy?
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Unlock powerful features designed to deepen your healing journey between sessions.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setInTherapy(true); setStep(2); }}
                  className="w-full py-4 px-6 border border-teal-500/30 bg-teal-500/5 rounded-lg text-left hover:bg-teal-500/10 hover:border-teal-500 transition-all group"
                >
                  <div className="font-cinzel text-sm text-teal-400 group-hover:text-teal-300 transition-colors">
                    Yes, I&apos;m in therapy
                  </div>
                  <div className="text-xs text-text-muted mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-400">✦</span>
                      <span>Session Debrief — anchor insights before they fade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-teal-400">✦</span>
                      <span>Homework Companion — 75% completion rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-teal-400">✦</span>
                      <span>Pre-Session Primer — arrive prepared</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setInTherapy(false); handleComplete(); }}
                  className="w-full py-4 px-6 border border-border rounded-lg text-left hover:bg-raised hover:border-gold/30 transition-all group"
                >
                  <div className="font-cinzel text-sm text-text-main group-hover:text-gold transition-colors">
                    No, I&apos;m using Sorca independently
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    Continue with the full self-reflection experience
                  </div>
                </button>
              </div>

              <p className="text-xs text-text-muted text-center mt-6 leading-relaxed">
                <strong className="text-gold">Important:</strong> Sorca is not a replacement for therapy. 
                It&apos;s a tool for deepening reflection between sessions.
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <CalendarIcon size={32} className="mx-auto mb-4 text-gold" aria-hidden="true" />
                <h2 className="font-cinzel text-xl text-text-main mb-2">
                  When do you usually have therapy?
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  This helps Sorca time your Pre-Session Primer and Session Debrief perfectly.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                    Session Day
                  </label>
                  <select
                    value={sessionDay}
                    onChange={(e) => setSessionDay(e.target.value)}
                    className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">Select a day...</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                    Session Time (optional)
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                    Therapist&apos;s Name (optional, for your reference)
                  </label>
                  <input
                    type="text"
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    placeholder="e.g., Dr. Smith"
                    className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-text-muted/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!sessionDay}
                  className="flex-1 py-3 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Setup
                </button>
              </div>

              <p className="text-xs text-text-muted text-center mt-6">
                You can change these settings anytime in your account.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
