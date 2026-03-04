'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Message } from './ChatMessage';

interface ShareCardProps {
  show: boolean;
  depth: number;
  messageCount: number;
  onClose: () => void;
}

export function ShareCard({ show, depth, messageCount, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = `I reached Depth ${depth} on Sorca — the question that changes everything. ${messageCount} exchanges into the void.\n\nCan you handle the truth?\nhttps://sorca.life`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sorca — Depth ${depth}`,
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  }, [shareText, depth, handleCopy]);

  const handleDownloadCard = useCallback(async () => {
    if (!cardRef.current) return;

    // Create a canvas-based depth card image
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, '#f5f0e8');
    gradient.addColorStop(0.5, '#ede7d8');
    gradient.addColorStop(1, '#f5f0e8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Border
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.3)';
    ctx.lineWidth = 2;
    ctx.roundRect(20, 20, 1160, 590, 16);
    ctx.stroke();

    // Subtle radial glow
    const radGradient = ctx.createRadialGradient(600, 280, 0, 600, 280, 300);
    radGradient.addColorStop(0, 'rgba(192, 57, 43, 0.04)');
    radGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = radGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Eye symbol
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(600, 160, 50, 25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(600, 160, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();

    // "DEPTH" text
    ctx.fillStyle = '#c0392b';
    ctx.font = '600 14px serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('D E P T H', 600, 230);

    // Depth number
    ctx.fillStyle = '#0e0c09';
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(depth), 600, 360);

    // Subtitle
    ctx.fillStyle = '#3d3830';
    ctx.font = 'italic 24px serif';
    ctx.fillText(`${messageCount} exchanges into the void`, 600, 410);

    // Oracle brand
    ctx.fillStyle = 'rgba(192, 57, 43, 0.4)';
    ctx.font = '600 12px serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('S O R C A  —  T H E  Q U E S T I O N  T H A T  C H A N G E S  E V E R Y T H I N G', 600, 560);

    // Download
    const link = document.createElement('a');
    link.download = `sorca-depth-${depth}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [depth, messageCount]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The visual card */}
            <div
              ref={cardRef}
              className="bg-gradient-to-b from-deep via-surface to-deep border border-gold/20 rounded-xl p-10 text-center mb-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,57,43,0.04)_0%,transparent_60%)] pointer-events-none" />
              
              {/* Eye */}
              <div className="w-16 h-8 mx-auto mb-6 relative z-10" aria-hidden="true">
                <svg viewBox="0 0 80 40" fill="none" className="w-full h-full">
                  <path d="M4 20 C20 4 60 4 76 20 C60 36 20 36 4 20 Z" stroke="#c0392b" strokeWidth="1.5" fill="none" opacity="0.6"/>
                  <circle cx="40" cy="20" r="8" stroke="#c0392b" strokeWidth="1.5" fill="none" opacity="0.8"/>
                  <circle cx="40" cy="20" r="3" fill="#c0392b" opacity="0.9"/>
                </svg>
              </div>

              <div className="font-cinzel text-[10px] tracking-[0.4em] text-gold/60 uppercase mb-3 relative z-10">Depth</div>
              <div className="font-cinzel text-7xl md:text-8xl text-gold-bright mb-3 relative z-10" style={{ textShadow: '0 0 60px rgba(192,57,43,0.2)' }}>
                {depth}
              </div>
              <div className="font-cormorant italic text-text-mid text-lg mb-6 relative z-10">
                {messageCount} exchanges into the void
              </div>
              <div className="font-cinzel text-[8px] tracking-[0.3em] text-gold/40 uppercase relative z-10">
                Sorca — The Question That Changes Everything
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void transition-all duration-300 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg"
              >
                {typeof navigator !== 'undefined' && 'share' in navigator ? '📤 Share' : '📋 Copy'}
              </button>
              <button
                onClick={handleDownloadCard}
                className="flex-1 py-3 border border-border text-text-muted hover:text-gold hover:border-gold/30 transition-all duration-300 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg"
              >
                ⬇️ Download Card
              </button>
              <button
                onClick={handleCopy}
                className="py-3 px-4 border border-border text-text-muted hover:text-gold hover:border-gold/30 transition-all duration-300 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 font-courier text-[10px] text-text-muted hover:text-gold tracking-widest uppercase transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
