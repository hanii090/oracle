'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

export interface EmotionData {
  primary?: string;
  secondary?: string;
  avoidance?: string[];
  readyForDepth?: boolean;
  breakdownRisk?: number;
  breakthrough?: number;
  lyriaEmotionWeights?: Record<string, number>;
  nanaBananaPrompt?: string;
}

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  depth: number;
  emotionData?: EmotionData;
  modalityId?: string;
};

interface ChatMessageProps {
  message: Message;
  nightMode: boolean;
  isLast: boolean;
  index: number;
  totalMessages: number;
  showEmotionPulse?: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  grief: 'text-blue-400',
  sadness: 'text-blue-400',
  anxiety: 'text-amber-400',
  fear: 'text-amber-400',
  anger: 'text-red-400',
  frustration: 'text-red-400',
  joy: 'text-emerald-400',
  relief: 'text-emerald-400',
  hope: 'text-emerald-400',
  shame: 'text-violet-400',
  guilt: 'text-violet-400',
  loneliness: 'text-indigo-400',
  confusion: 'text-text-muted',
  numbness: 'text-text-muted',
  love: 'text-pink-400',
  acceptance: 'text-teal',
};

function getEmotionColor(emotion: string): string {
  const lower = emotion.toLowerCase();
  return EMOTION_COLORS[lower] || 'text-text-muted';
}

const MODALITY_CONTEXT: Record<string, string> = {
  socratic: 'Socratic mode — open-ended questioning to help you examine beliefs',
  cbt: 'CBT mode — exploring thought patterns and cognitive distortions',
  act: 'ACT mode — acceptance, defusion, and values-driven action',
  psychodynamic: 'Psychodynamic — connecting past experiences to present patterns',
  ifs: 'IFS mode — dialoguing with different parts of yourself',
  humanistic: 'Person-Centred — following your lead with empathic reflection',
  schema: 'Schema mode — exploring early beliefs that drive present reactions',
};

export function ChatMessage({ message, nightMode, isLast, index, showEmotionPulse }: ChatMessageProps) {
  const [emotionExpanded, setEmotionExpanded] = useState(false);
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: nightMode ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: nightMode ? 1.5 : 0.8,
        delay: isLast ? 0.2 : 0,
      }}
      className={`flex flex-col ${nightMode ? 'items-center' : message.role === 'assistant' ? 'items-start' : 'items-end'}`}
      role="article"
      aria-label={message.role === 'assistant' ? `Sorca asks at depth ${message.depth}` : 'Your response'}
    >
      {!nightMode && (
        <div className="text-[9px] tracking-[0.15em] uppercase text-text-muted mb-2 font-courier">
          {message.role === 'assistant'
            ? `Sorca asks — depth ${message.depth}`
            : 'You say'}
        </div>
      )}
      <div
        className={`
          ${nightMode ? 'max-w-full p-8' : 'max-w-[85%] p-6'} relative rounded-lg
          ${
            message.role === 'assistant'
              ? nightMode
                ? 'bg-transparent border-none text-gold-bright font-cinzel text-xl md:text-3xl tracking-[0.05em] leading-relaxed text-center'
                : 'bg-gold-dim border border-gold/20 text-text-main font-cinzel text-sm md:text-base tracking-[0.03em] leading-relaxed rounded-tl-none'
              : nightMode
                ? 'bg-transparent border-none text-void/40 font-cormorant italic text-base text-center'
                : 'bg-raised border border-border text-text-mid font-cormorant italic text-lg md:text-xl leading-relaxed rounded-tr-none'
          }
        `}
        style={nightMode && message.role === 'assistant' ? { textShadow: '0 0 40px rgba(192,57,43,0.3), 0 0 80px rgba(192,57,43,0.1)' } : undefined}
      >
        {message.content}
        {message.role === 'assistant' && message.modalityId && !nightMode && (
          <div className="relative inline-block ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowWhyTooltip(!showWhyTooltip); }}
              className="align-middle text-[8px] text-text-muted/30 hover:text-text-muted/70 transition-colors"
              aria-label="Why is Sorca asking this?"
            >
              ?
            </button>
            {showWhyTooltip && (
              <div className="absolute left-0 top-full mt-1 z-20 w-56 p-2.5 bg-surface border border-border rounded-lg shadow-lg text-[9px] text-text-muted font-courier">
                {MODALITY_CONTEXT[message.modalityId] || `${message.modalityId} mode`}
                {message.depth > 7 && <div className="mt-1 text-amber-400/70">Confrontation depth — surfacing contradictions</div>}
                {message.depth <= 3 && <div className="mt-1">Building rapport and trust</div>}
                {message.depth > 3 && message.depth <= 7 && <div className="mt-1">Exploring patterns and meaning</div>}
              </div>
            )}
          </div>
        )}
      </div>
      {showEmotionPulse && message.role === 'assistant' && message.emotionData?.primary && !nightMode && (
        <button
          onClick={() => setEmotionExpanded(!emotionExpanded)}
          className="mt-1.5 flex items-center gap-1.5 text-[9px] font-courier tracking-wider opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Show emotion analysis"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getEmotionColor(message.emotionData.primary)} bg-current`} />
          <span className={getEmotionColor(message.emotionData.primary)}>{message.emotionData.primary}</span>
          {message.emotionData.secondary && (
            <>
              <span className="text-text-muted">·</span>
              <span className={getEmotionColor(message.emotionData.secondary)}>{message.emotionData.secondary}</span>
            </>
          )}
          {message.emotionData.avoidance && message.emotionData.avoidance.length > 0 && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-amber-400/70">avoidance</span>
            </>
          )}
          {message.emotionData.breakthrough && message.emotionData.breakthrough > 0.5 && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-gold">breakthrough</span>
            </>
          )}
        </button>
      )}
      {emotionExpanded && message.emotionData && !nightMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 p-2.5 bg-surface border border-border rounded text-[10px] font-courier space-y-1 max-w-[85%]"
        >
          {message.emotionData.breakdownRisk !== undefined && message.emotionData.breakdownRisk > 0.3 && (
            <div className="text-amber-400">Distress level: {Math.round(message.emotionData.breakdownRisk * 100)}%</div>
          )}
          {message.emotionData.breakthrough !== undefined && message.emotionData.breakthrough > 0.3 && (
            <div className="text-gold">Breakthrough signal: {Math.round(message.emotionData.breakthrough * 100)}%</div>
          )}
          {message.emotionData.avoidance && message.emotionData.avoidance.length > 0 && (
            <div className="text-amber-400/70">Avoidance patterns: {message.emotionData.avoidance.join(', ')}</div>
          )}
          {message.emotionData.readyForDepth !== undefined && (
            <div className="text-text-muted">Ready for depth: {message.emotionData.readyForDepth ? 'yes' : 'not yet'}</div>
          )}
          {message.modalityId && (
            <div className="text-text-muted">Modality: {message.modalityId}</div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

interface LoadingIndicatorProps {
  depth: number;
  nightMode: boolean;
}

export function LoadingIndicator({ depth, nightMode }: LoadingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col ${nightMode ? 'items-center' : 'items-start'}`}
      role="status"
      aria-label="Sorca is thinking"
    >
      {!nightMode && (
        <div className="text-[9px] tracking-[0.15em] uppercase text-text-muted mb-2 font-courier">
          Sorca is perceiving
        </div>
      )}
      <div className={`${nightMode ? 'p-8 bg-transparent border-none' : 'p-6 bg-gold-dim border border-gold/20 rounded-tl-none'} rounded-lg flex items-center justify-center min-w-[100px] min-h-[60px] gap-3`}>
        {Array.from({ length: Math.min(Math.ceil(depth / 2), 4) }).map((_, idx) => (
          <motion.div
            key={idx}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1 + (depth * 0.05), 0.8] }}
            transition={{ duration: Math.max(0.5, 2 - (depth * 0.1)), repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }}
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: depth > 7 ? '#8b1a2f' : '#c0392b',
              boxShadow: `0 0 ${10 + depth * 2}px ${depth > 7 ? 'rgba(139,26,47,0.6)' : 'rgba(192,57,43,0.6)'}`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
