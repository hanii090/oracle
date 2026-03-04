'use client';

import { motion, AnimatePresence } from 'motion/react';

interface HelpPanelProps {
  show: boolean;
  onClose: () => void;
}

const helpItems = [
  {
    icon: '💬',
    label: 'How It Works',
    desc: 'Type your truth. Sorca responds only with questions — never answers, never advice.',
  },
  {
    icon: '📊',
    label: 'Depth Levels',
    desc: 'Each exchange goes deeper. Depth 5+ gets personal. Depth 7+ triggers Confrontation.',
  },
  {
    icon: '🧵',
    label: 'The Thread',
    desc: 'Cross-session memory. Sorca remembers your past conversations and patterns.',
  },
  {
    icon: '🎵',
    label: 'Lyria Music',
    desc: 'Real-time ambient music that reacts to the emotional weight of your words.',
  },
  {
    icon: '🌙',
    label: 'Night Sorca',
    desc: 'Midnight–5am stripped-back mode. Questions shortened to 12 words. Auto-activates.',
  },
  {
    icon: '🎙️',
    label: 'Voice Sorca',
    desc: 'Speak your truth aloud and hear Sorca\'s questions. Philosopher tier.',
  },
  {
    icon: '👁️',
    label: 'Visual Breakthroughs',
    desc: 'AI-generated abstract visuals during emotional peaks. Philosopher tier.',
  },
  {
    icon: '⚡',
    label: 'Confrontation',
    desc: 'At Depth 7+, Sorca surfaces your own contradictions from past statements.',
  },
  {
    icon: '⬇️ 📋',
    label: 'Export Session',
    desc: 'Download your session as Markdown or copy it to clipboard.',
  },
  {
    icon: '🔥',
    label: 'Streaks',
    desc: 'Return daily to build your streak. Consecutive days deepen Sorca\'s awareness.',
  },
];

export function HelpPanel({ show, onClose }: HelpPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-void/80 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface border border-gold/20 rounded-xl p-8 max-w-md w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl shadow-gold/5 scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="help-title" className="font-cinzel text-gold text-sm tracking-[0.2em] uppercase">
                Quick Reference
              </h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-gold transition-colors text-lg"
                aria-label="Close help"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {helpItems.map((item) => (
                <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-raised/50 border border-border/50">
                  <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                  <div>
                    <div className="font-cinzel text-[11px] tracking-[0.1em] text-text-main mb-1">{item.label}</div>
                    <div className="font-cormorant text-text-mid text-sm leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-2.5 border border-gold/30 text-gold hover:bg-gold hover:text-void transition-all duration-300 font-cinzel text-xs tracking-[0.2em] uppercase rounded-lg"
            >
              Got It
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
