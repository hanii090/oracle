'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export function SessionTimeoutWarning() {
  const { showWarning, dismissWarning } = useSessionTimeout();

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-surface border border-editorial-gold/30 rounded-lg shadow-lg px-6 py-4 max-w-md w-full mx-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="text-editorial-gold text-lg mt-0.5">⏱</div>
            <div className="flex-1">
              <h3 className="font-cinzel text-sm text-text-main mb-1">Session Expiring</h3>
              <p className="text-xs text-text-muted">
                You&apos;ve been inactive for a while. Your session will end in 5 minutes for security.
              </p>
            </div>
            <button
              onClick={dismissWarning}
              className="px-4 py-1.5 bg-gold/10 border border-gold/30 text-gold font-cinzel text-[10px] tracking-widest rounded hover:bg-gold hover:text-void transition-colors"
            >
              Stay
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
