'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { THERAPY_MODES, TIME_MODES, getTimeModeForHour, type TherapyMode, type TimeMode } from '@/lib/therapy-modes';

interface ModalitySwitcherProps {
  currentModality: string;
  currentTimeMode: string | null;
  onModalityChange: (modalityId: string) => void;
  onTimeModeChange: (timeModeId: string | null) => void;
  isPro: boolean;
}

export function ModalitySwitcher({
  currentModality,
  currentTimeMode,
  onModalityChange,
  onTimeModeChange,
  isPro,
}: ModalitySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'modality' | 'time'>('modality');
  const suggestedTimeMode = useMemo(() => getTimeModeForHour(new Date().getHours()), []);

  const currentMode = THERAPY_MODES.find(m => m.id === currentModality) || THERAPY_MODES[0];
  const currentTime = currentTimeMode ? TIME_MODES.find(m => m.id === currentTimeMode) : null;

  if (!isPro) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[9px] px-2 py-1 bg-gold/10 text-gold rounded font-cinzel">
          {currentMode.icon} {currentMode.shortName}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-lg hover:border-gold/30 transition-colors"
      >
        <span className="text-[10px] text-gold">{currentMode.icon}</span>
        <span className="text-[10px] text-text-main font-cinzel">{currentMode.shortName}</span>
        {currentTime && (
          <>
            <span className="text-[10px] text-text-muted">·</span>
            <span className={`text-[10px] text-${currentTime.colour}`}>{currentTime.name}</span>
          </>
        )}
        <span className="text-[8px] text-text-muted ml-0.5">▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            className="absolute top-full mt-2 right-0 z-50 w-80 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab('modality')}
                className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider transition-colors ${
                  tab === 'modality' ? 'text-gold border-b-2 border-gold' : 'text-text-muted hover:text-text-mid'
                }`}
              >
                Modality
              </button>
              <button
                onClick={() => setTab('time')}
                className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider transition-colors ${
                  tab === 'time' ? 'text-gold border-b-2 border-gold' : 'text-text-muted hover:text-text-mid'
                }`}
              >
                Time of Day
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {tab === 'modality' && (
                <div className="space-y-1">
                  {THERAPY_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onModalityChange(mode.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentModality === mode.id
                          ? 'bg-gold/10 border border-gold/30'
                          : 'hover:bg-raised border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{mode.icon}</span>
                        <span className="text-xs text-text-main font-cinzel">{mode.name}</span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed pl-5">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {tab === 'time' && (
                <div className="space-y-1">
                  {/* Auto option */}
                  <button
                    onClick={() => {
                      onTimeModeChange(null);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentTimeMode === null
                        ? 'bg-gold/10 border border-gold/30'
                        : 'hover:bg-raised border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-main font-cinzel">Auto</span>
                      {suggestedTimeMode && (
                        <span className="text-[9px] text-text-muted">
                          (Currently: {suggestedTimeMode.name})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      Sorca adapts its tone based on the time of day.
                    </p>
                  </button>

                  {TIME_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onTimeModeChange(mode.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentTimeMode === mode.id
                          ? 'bg-gold/10 border border-gold/30'
                          : 'hover:bg-raised border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-text-main font-cinzel">{mode.name}</span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border">
              <p className="text-[8px] text-text-muted text-center">
                These modes shape how Sorca asks questions — they do not replace professional therapy.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact badge for showing current mode in session header
 */
export function ModalityBadge({ modalityId, timeModeId }: { modalityId: string; timeModeId?: string | null }) {
  const mode = THERAPY_MODES.find(m => m.id === modalityId) || THERAPY_MODES[0];
  const timeMode = timeModeId ? TIME_MODES.find(m => m.id === timeModeId) : null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-text-muted">
      <span className="text-gold">{mode.icon}</span>
      <span>{mode.shortName}</span>
      {timeMode && (
        <>
          <span className="text-border">·</span>
          <span>{timeMode.name}</span>
        </>
      )}
    </span>
  );
}
