'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DepthToastProps {
  depth: number;
  tier: string;
}

const depthHints: Record<number, string> = {
  2: 'Sorca is listening… go deeper.',
  3: 'Real questions start at Depth 5.',
  4: 'One more step and things get personal…',
  5: 'Depth 5 — Sorca sees your patterns now.',
  7: '⚡ Confrontation mode — Sorca will surface your contradictions.',
  10: 'Few reach Depth 10. The void is paying attention.',
};

export function DepthToast({ depth, tier }: DepthToastProps) {
  const [showToast, setShowToast] = useState(false);
  const prevDepthRef = useRef(depth);
  const hint = depthHints[depth];
  const message = hint && !(tier === 'free' && depth >= 5) ? hint : null;

  useEffect(() => {
    if (depth !== prevDepthRef.current && message) {
      prevDepthRef.current = depth;
      // Use setTimeout to avoid synchronous setState in effect (React 19)
      const showTimer = setTimeout(() => setShowToast(true), 0);
      const hideTimer = setTimeout(() => setShowToast(false), 4000);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
    prevDepthRef.current = depth;
  }, [depth, message]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] max-w-sm w-[85vw]"
        >
          <div className="bg-deep/95 backdrop-blur-md border border-gold/15 rounded-xl px-5 py-3 text-center shadow-xl shadow-void/60">
            <p className="font-cormorant italic text-text-mid text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
