'use client';

import { motion, AnimatePresence } from 'motion/react';

interface ResetModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetModal({ show, onCancel, onConfirm }: ResetModalProps) {
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
          aria-labelledby="reset-modal-title"
          aria-describedby="reset-modal-desc"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reset-modal-title" className="font-cinzel text-xl text-gold mb-4">Sever the Thread?</h3>
            <p id="reset-modal-desc" className="font-cormorant text-text-mid mb-8 text-lg">
              This will erase all memory of your current journey. The Oracle will forget everything you have said.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
              >
                Sever
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
