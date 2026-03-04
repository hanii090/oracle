'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertCircle, Clock } from 'lucide-react';

interface AvoidedReminder {
  question: string;
  daysSinceAvoided: number;
  message: string;
  deflectionType: string;
}

interface AvoidedQuestionNotificationProps {
  reminder: AvoidedReminder | null;
  onDismiss: () => void;
  onExplore: (question: string) => void;
}

const deflectionLabels: Record<string, string> = {
  humour: 'deflected with humour',
  topic_change: 'changed the subject',
  vagueness: 'stayed on the surface',
  intellectualising: 'intellectualised it away',
  dismissal: 'dismissed it too quickly',
  too_quick: 'moved past it too fast',
};

export default function AvoidedQuestionNotification({
  reminder,
  onDismiss,
  onExplore,
}: AvoidedQuestionNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reminder) {
      // Small delay so it doesn't pop in immediately
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [reminder]);

  const handleExplore = useCallback(() => {
    if (reminder) {
      onExplore(reminder.question);
      setVisible(false);
    }
  }, [reminder, onExplore]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300); // Wait for exit animation
  }, [onDismiss]);

  if (!reminder) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]"
          role="alert"
          aria-label="Avoided question reminder"
        >
          <div className="bg-surface backdrop-blur-xl border border-gold/20 rounded-2xl p-5 shadow-2xl shadow-ink/10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-gold/80">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium tracking-wide uppercase font-cinzel">
                  Avoided Question Archive
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-main transition-colors p-1 -m-1"
                aria-label="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time indicator */}
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-3">
              <Clock className="w-3 h-3" />
              <span>{reminder.message}</span>
            </div>

            {/* The question */}
            <blockquote className="text-text-main font-cormorant text-lg italic leading-relaxed mb-3 pl-3 border-l-2 border-gold/30">
              &ldquo;{reminder.question}&rdquo;
            </blockquote>

            {/* Deflection type */}
            <p className="text-text-muted text-xs mb-4">
              You {deflectionLabels[reminder.deflectionType] || 'moved past it'}.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleExplore}
                className="flex-1 bg-gold-dim hover:bg-gold-glow text-gold border border-gold/20 rounded-lg py-2 px-4 text-sm font-cinzel tracking-wide transition-all duration-300"
              >
                Explore This Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-mid text-sm px-3 transition-colors"
              >
                Not yet
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
