'use client';

import { motion } from 'motion/react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  depth: number;
};

interface ChatMessageProps {
  message: Message;
  nightMode: boolean;
  isLast: boolean;
  index: number;
  totalMessages: number;
}

export function ChatMessage({ message, nightMode, isLast, index }: ChatMessageProps) {
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
      </div>
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
