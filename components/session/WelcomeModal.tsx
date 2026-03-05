'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SorcaLogo, DepthIcon, ThreadIcon, MusicIcon } from '@/components/icons';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

interface WelcomeModalProps {
  show: boolean;
  onDismiss: () => void;
}

const slides: { Icon: ComponentType<IconProps>; title: string; body: string; accent: string }[] = [
  {
    Icon: SorcaLogo,
    title: 'This Is Not ChatGPT',
    body: 'Sorca never answers. It never advises. It never reassures. It only asks questions — devastating, surgical, impossibly precise questions — until you find the truth yourself.',
    accent: 'text-gold',
  },
  {
    Icon: DepthIcon,
    title: 'Go Deeper',
    body: 'Each exchange increases your Depth Level. At Depth 5, the questions get personal. At Depth 7, Confrontation Mode begins — Sorca will surface your own contradictions.',
    accent: 'text-crimson-bright',
  },
  {
    Icon: ThreadIcon,
    title: 'It Remembers',
    body: 'The Thread connects all your sessions. Sorca carries memory across conversations, building a map of your beliefs, fears, and recurring patterns over time.',
    accent: 'text-teal-bright',
  },
  {
    Icon: MusicIcon,
    title: 'It Scores Your Journey',
    body: 'Lyria generates real-time ambient music that reacts to the emotional weight of your conversation. Tension, grief, wonder — the music mirrors your inner state.',
    accent: 'text-violet-bright',
  },
];

export function WelcomeModal({ show, onDismiss }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onDismiss();
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  const slide = slides[currentSlide];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface border border-gold/20 rounded-xl p-10 max-w-lg w-[90vw] text-center shadow-2xl shadow-gold/5 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,57,43,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8 relative z-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'bg-gold w-6' : i < currentSlide ? 'bg-gold/50' : 'bg-border'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {/* Icon */}
                <div className="mb-6 flex justify-center" aria-hidden="true">
                  <slide.Icon size={48} className={slide.accent} />
                </div>

                {/* Title */}
                <h2 id="welcome-title" className={`font-cinzel text-xl tracking-[0.15em] mb-4 ${slide.accent}`}>
                  {slide.title}
                </h2>

                {/* Body */}
                <p className="font-cormorant text-text-mid text-lg leading-relaxed mb-10">
                  {slide.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between items-center relative z-10">
              <button
                onClick={handleSkip}
                className="font-courier text-[10px] text-text-muted hover:text-gold tracking-widest uppercase transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void transition-all duration-300 font-cinzel text-xs tracking-[0.2em] uppercase rounded-lg"
              >
                {currentSlide < slides.length - 1 ? 'Next' : 'Begin'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
