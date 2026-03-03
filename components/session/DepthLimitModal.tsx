'use client';

import { motion, AnimatePresence } from 'motion/react';

interface DepthLimitModalProps {
  show: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function DepthLimitModal({ show, onClose, onUpgrade }: DepthLimitModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="depth-limit-title"
          aria-describedby="depth-limit-desc"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="depth-limit-title" className="font-cinzel text-xl text-gold mb-4">The Abyss is Sealed</h3>
            <p id="depth-limit-desc" className="font-cormorant text-text-mid mb-8 text-lg">
              You have reached Depth Level 5, the limit of the Free tier. To descend further into the truth, you must become a Philosopher.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
              >
                Remain Here
              </button>
              <button
                onClick={onUpgrade}
                className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
              >
                Ascend
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
