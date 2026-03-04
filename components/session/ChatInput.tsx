'use client';

import { useRef, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  nightMode: boolean;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, nightMode, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  return (
    <form onSubmit={onSubmit} className="relative mt-auto group" role="form" aria-label="Send message to Sorca">
      <label htmlFor="sorca-input" className="sr-only">Your message to Sorca</label>
      <textarea
        ref={textareaRef}
        id="sorca-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
        placeholder={nightMode ? '...' : 'Speak your truth...'}
        className={`w-full ${nightMode ? 'bg-transparent border-gold/10 focus:border-gold/30 text-center' : 'bg-surface border-border focus:border-gold/50'} border focus:ring-1 focus:ring-gold/30 rounded-lg p-6 text-text-main font-cormorant text-lg resize-none outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
        rows={3}
        disabled={isLoading || disabled}
        aria-describedby="input-hint"
      />
      <div className="absolute bottom-4 right-4 flex items-center gap-4">
        <span id="input-hint" className="text-text-muted text-xs font-courier opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
          Press Enter
        </span>
        <button
          type="submit"
          disabled={isLoading || !value.trim() || disabled}
          className="w-8 h-8 flex items-center justify-center border border-gold/30 text-gold hover:bg-gold hover:text-void transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold disabled:border-border disabled:cursor-not-allowed rounded-lg"
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
    </form>
  );
}
