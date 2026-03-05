'use client';

import { motion, AnimatePresence } from 'motion/react';
import { getSafeModeResources } from '@/lib/safety';
import { SafeIcon, CloseIcon } from '@/components/icons';

interface SafeMessagingBannerProps {
  isActive: boolean;
  distressLevel: number;
  onDismiss?: () => void;
  showResources?: boolean;
}

export function SafeMessagingBanner({ 
  isActive, 
  distressLevel, 
  onDismiss,
  showResources = true 
}: SafeMessagingBannerProps) {
  const resources = getSafeModeResources();

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-amber-900/20 to-transparent"
        >
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="bg-surface/95 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <SafeIcon size={18} className="text-amber-400" aria-hidden="true" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-cinzel text-sm text-amber-400 tracking-wide">
                      Safe Mode Active
                    </h3>
                    {onDismiss && (
                      <button
                        onClick={onDismiss}
                        className="text-text-muted hover:text-amber-400 transition-colors text-xs"
                        aria-label="Dismiss safe mode banner"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-text-mid leading-relaxed mb-3">
                    Sorca has detected elevated distress and is focusing on grounding and support. 
                    Deep questioning is paused.
                  </p>

                  {showResources && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-text-muted font-cinzel tracking-wider uppercase">
                        Support Resources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {resources.slice(0, 2).map((resource, i) => (
                          <div 
                            key={i}
                            className="text-[11px] text-text-mid bg-raised/50 px-2 py-1 rounded"
                          >
                            {resource}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {distressLevel > 0.5 && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <p className="text-xs text-amber-400/80 text-center">
                    💛 You don't have to face this alone. Consider reaching out to someone you trust.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SafeMessagingCorner({ isActive }: { isActive: boolean }) {
  const resources = getSafeModeResources();
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-30"
        >
          <div className="bg-surface/95 backdrop-blur-sm border border-amber-500/30 rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-sm" aria-hidden="true">💛</span>
              <span className="font-cinzel text-[10px] text-amber-400 tracking-wider uppercase">
                Support Available
              </span>
            </div>
            <div className="space-y-1">
              {resources.slice(0, 2).map((resource, i) => (
                <p key={i} className="text-[10px] text-text-mid leading-relaxed">
                  {resource}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
