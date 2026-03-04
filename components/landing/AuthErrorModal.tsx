'use client';

import { motion, AnimatePresence } from 'motion/react';

interface AuthErrorModalProps {
  error: string | null;
  onClose: () => void;
}

export function AuthErrorModal({ error, onClose }: AuthErrorModalProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="auth-error-title"
          aria-describedby="auth-error-desc"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface border border-crimson/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-crimson/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="auth-error-title" className="font-cinzel text-xl text-crimson mb-4">Authentication Error</h3>
            <p id="auth-error-desc" className="font-cormorant text-text-mid mb-8 text-lg">
              {error}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
