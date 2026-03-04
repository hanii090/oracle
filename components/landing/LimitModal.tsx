'use client';

import { motion, AnimatePresence } from 'motion/react';

interface LimitModalProps {
  show: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function LimitModal({ show, onClose, onUpgrade }: LimitModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="limit-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="limit-modal-title" className="font-cinzel text-xl text-gold mb-4">The Thread is Frayed</h3>
            <p className="font-cormorant text-text-mid mb-8 text-lg">
              You have reached your limit of 5 sessions for this moon cycle. To delve deeper into the abyss, you must ascend to the Philosopher tier.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
                aria-label="Close and stay on free tier"
              >
                Retreat
              </button>
              <button
                onClick={onUpgrade}
                className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
                aria-label="Upgrade to Philosopher tier for £12 per month"
              >
                Ascend (£12/mo)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
