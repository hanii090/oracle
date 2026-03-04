'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EndOfLifeToggleProps {
  isActive: boolean;
  onToggle: () => void;
  isPro: boolean;
}

/**
 * End of Life mode toggle button for the session header area.
 * Only visible to Pro users. When active, switches Sorca into
 * a specialised mode for legacy, grief, and love.
 */
export function EndOfLifeToggle({ isActive, onToggle, isPro }: EndOfLifeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isPro) return null;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-courier tracking-widest uppercase transition-all duration-500 border ${
          isActive
            ? 'bg-amber-900/20 border-amber-700/50 text-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.15)]'
            : 'bg-transparent border-border text-text-muted hover:border-amber-700/30 hover:text-amber-500/70'
        }`}
        aria-label={isActive ? 'Exit End of Life mode' : 'Enter End of Life mode'}
        aria-pressed={isActive}
      >
        <span className={`transition-all duration-500 ${isActive ? 'animate-pulse' : ''}`}>🕯️</span>
        <span className="hidden sm:inline">{isActive ? 'Legacy Mode' : 'End of Life'}</span>
      </button>

      <AnimatePresence>
        {showTooltip && !isActive && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-surface border border-amber-900/30 rounded-lg shadow-xl z-50"
          >
            <p className="font-cormorant text-xs text-text-mid leading-relaxed">
              A sacred space for legacy, grief, and love. Questions about what you want to leave behind.
            </p>
            <p className="font-courier text-[8px] text-amber-600/60 tracking-widest uppercase mt-2">
              Pro · End of Life Mode
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MemoryPortrait {
  id: string;
  title: string;
  essence: string;
  coreValues: string[];
  unsaidWords: string;
  legacyWish: string;
  keyQuotes: string[];
  toThoseLeft: string;
  palette: string[];
  generatedAt: string;
}

interface MemoryPortraitOverlayProps {
  portrait: MemoryPortrait | null;
  show: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay displaying a generated Memory Portrait.
 * Beautiful, reverent presentation of someone's legacy.
 */
export function MemoryPortraitOverlay({ portrait, show, onClose }: MemoryPortraitOverlayProps) {
  if (!show || !portrait) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 backdrop-blur-lg overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-2xl mx-auto p-10 my-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Candle icon */}
        <div className="text-center mb-8">
          <span className="text-4xl opacity-60">🕯️</span>
        </div>

        {/* Title */}
        <h2 className="font-cinzel text-2xl md:text-3xl text-amber-400 text-center mb-2 leading-tight">
          {portrait.title}
        </h2>
        <p className="font-courier text-[9px] text-amber-600/50 tracking-[0.3em] uppercase text-center mb-10">
          Memory Portrait
        </p>

        {/* Palette */}
        <div className="flex justify-center gap-2 mb-10">
          {portrait.palette.map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Essence */}
        <div className="mb-10">
          <p className="font-cormorant text-lg md:text-xl text-void/80 leading-relaxed italic text-center">
            &ldquo;{portrait.essence}&rdquo;
          </p>
        </div>

        {/* Core Values */}
        <div className="mb-10">
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-amber-500/60 mb-4">
            Core Values
          </h3>
          <div className="flex flex-wrap gap-2">
            {portrait.coreValues.map((value, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-amber-900/15 border border-amber-800/20 rounded-full font-courier text-[10px] text-amber-400/80 tracking-widest uppercase"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        {/* The Unsaid */}
        <div className="mb-10 p-6 bg-amber-900/10 border border-amber-800/15 rounded-lg">
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-amber-500/60 mb-3">
            What They Circled Around
          </h3>
          <p className="font-cormorant text-base text-void/70 leading-relaxed">
            {portrait.unsaidWords}
          </p>
        </div>

        {/* Legacy Wish */}
        <div className="mb-10">
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-amber-500/60 mb-3">
            What They Want to Leave Behind
          </h3>
          <p className="font-cormorant text-base text-void/70 leading-relaxed">
            {portrait.legacyWish}
          </p>
        </div>

        {/* Key Quotes */}
        {portrait.keyQuotes.length > 0 && (
          <div className="mb-10">
            <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-amber-500/60 mb-4">
              In Their Words
            </h3>
            <div className="space-y-3">
              {portrait.keyQuotes.map((quote, i) => (
                <p key={i} className="font-cormorant text-sm text-void/60 leading-relaxed pl-4 border-l-2 border-amber-800/30 italic">
                  &ldquo;{quote}&rdquo;
                </p>
              ))}
            </div>
          </div>
        )}

        {/* To Those Left Behind */}
        <div className="mb-10 p-8 bg-amber-900/10 border border-amber-700/20 rounded-lg text-center">
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-amber-500/60 mb-4">
            To Those Who Remain
          </h3>
          <p className="font-cormorant text-lg text-void/80 leading-relaxed italic">
            {portrait.toThoseLeft}
          </p>
        </div>

        {/* Close hint */}
        <p className="font-courier text-[10px] text-void/30 tracking-widest uppercase text-center mt-8">
          Click anywhere outside to close
        </p>
      </motion.div>
    </motion.div>
  );
}

interface ThreadArchiveModalProps {
  show: boolean;
  onClose: () => void;
  onCreateArchive: (recipientName: string, personalNote: string) => void;
  isCreating: boolean;
  archiveResult: { token: string; shareUrl: string; totalSessions: number } | null;
}

/**
 * Modal for creating a permanent Thread Archive to share with family.
 */
export function ThreadArchiveModal({ show, onClose, onCreateArchive, isCreating, archiveResult }: ThreadArchiveModalProps) {
  const [recipientName, setRecipientName] = useState('');
  const [personalNote, setPersonalNote] = useState('');

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-lg w-full bg-surface border border-amber-900/30 rounded-lg p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-3xl block mb-4">🕯️</span>

        {!archiveResult ? (
          <>
            <h2 className="font-cinzel text-lg text-text-main mb-2">Create Thread Archive</h2>
            <p className="font-cormorant text-sm text-text-muted leading-relaxed mb-8">
              Package your entire Sorca journey — every session, every portrait, every reflection — into a permanent archive your family can access with a simple link. No account needed.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="font-courier text-[9px] text-text-muted tracking-widest uppercase block mb-2">
                  For whom? (optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="My children, My partner, My family..."
                  className="w-full bg-void border border-border rounded px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-amber-700/50"
                />
              </div>
              <div>
                <label className="font-courier text-[9px] text-text-muted tracking-widest uppercase block mb-2">
                  Personal note (optional)
                </label>
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="A few words for whoever opens this..."
                  rows={3}
                  className="w-full bg-void border border-border rounded px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-amber-700/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-border text-text-muted font-courier text-xs tracking-widest uppercase rounded hover:border-text-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreateArchive(recipientName, personalNote)}
                disabled={isCreating}
                className="flex-1 py-2.5 bg-amber-900/20 border border-amber-700/50 text-amber-400 font-courier text-xs tracking-widest uppercase rounded hover:bg-amber-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Archive'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-cinzel text-lg text-amber-400 mb-2">Archive Created</h2>
            <p className="font-cormorant text-sm text-text-muted leading-relaxed mb-6">
              {archiveResult.totalSessions} sessions have been preserved. Share this link with your loved ones — no account needed to view.
            </p>

            <div className="bg-void border border-amber-900/30 rounded p-4 mb-6">
              <p className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-2">Share Link</p>
              <p className="font-courier text-sm text-amber-400 break-all select-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}{archiveResult.shareUrl}
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}${archiveResult.shareUrl}`
                );
              }}
              className="w-full py-2.5 bg-amber-900/20 border border-amber-700/50 text-amber-400 font-courier text-xs tracking-widest uppercase rounded hover:bg-amber-900/30 transition-colors mb-3"
            >
              Copy Link
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 border border-border text-text-muted font-courier text-xs tracking-widest uppercase rounded hover:border-text-muted transition-colors"
            >
              Done
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

interface EolSessionToolsProps {
  onGeneratePortrait: () => void;
  onOpenArchive: () => void;
  isGeneratingPortrait: boolean;
  messageCount: number;
}

/**
 * Toolbar shown during an active End of Life session.
 * Provides access to Memory Portrait generation and Thread Archive.
 */
export function EolSessionTools({ onGeneratePortrait, onOpenArchive, isGeneratingPortrait, messageCount }: EolSessionToolsProps) {
  const canGeneratePortrait = messageCount >= 6;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onGeneratePortrait}
        disabled={!canGeneratePortrait || isGeneratingPortrait}
        title={canGeneratePortrait ? 'Generate Memory Portrait from this session' : 'Continue the conversation to unlock Memory Portraits (6+ messages needed)'}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-courier tracking-widest uppercase transition-all border border-amber-900/20 text-amber-500/60 hover:border-amber-700/40 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isGeneratingPortrait ? (
          <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>🖼️</span>
        )}
        <span className="hidden sm:inline">Portrait</span>
      </button>
      <button
        onClick={onOpenArchive}
        title="Create a permanent Thread Archive for your family"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-courier tracking-widest uppercase transition-all border border-amber-900/20 text-amber-500/60 hover:border-amber-700/40 hover:text-amber-400"
      >
        <span>📦</span>
        <span className="hidden sm:inline">Archive</span>
      </button>
    </div>
  );
}
