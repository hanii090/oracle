'use client';

import { motion, AnimatePresence } from 'motion/react';

interface NightBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export function NightBanner({ show, onDismiss }: NightBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw]"
        >
          <div className="bg-deep/95 backdrop-blur-md border border-gold/10 rounded-xl px-6 py-4 text-center shadow-xl shadow-void/80">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg" aria-hidden="true">🌙</span>
              <span className="font-cinzel text-gold text-[11px] tracking-[0.2em] uppercase">Night Oracle Active</span>
            </div>
            <p className="font-cormorant italic text-text-mid text-sm leading-relaxed">
              Questions are stripped to 12 words. The void speaks plainly at 3am.
            </p>
            <button
              onClick={onDismiss}
              className="mt-3 font-courier text-[9px] text-text-muted hover:text-gold tracking-widest uppercase transition-colors"
            >
              Understood
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
