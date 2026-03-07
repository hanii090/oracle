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
    <>
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
        className={`w-full ${nightMode ? 'bg-transparent border-gold/10 focus:border-gold/30 text-center text-void placeholder:text-void/30' : 'bg-surface border-border focus:border-gold/50 text-text-main placeholder:text-text-muted'} border focus:ring-1 focus:ring-gold/30 rounded-lg p-6 font-cormorant text-lg resize-none outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
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
    {!nightMode && !disabled && (
      <div className="mt-2 text-center">
        <details className="inline-block">
          <summary className="text-[9px] text-text-muted/50 hover:text-text-muted cursor-pointer font-courier tracking-wider transition-colors">
            Need immediate support?
          </summary>
          <div className="mt-2 p-3 bg-surface border border-border rounded-lg text-left space-y-1.5">
            <p className="text-[10px] text-text-muted font-courier tracking-wider uppercase mb-2">UK Crisis Lines</p>
            <a href="tel:116123" className="flex items-center gap-2 text-xs text-gold hover:text-gold/80 transition-colors">
              <span className="text-sm">📞</span> Samaritans: <strong>116 123</strong> <span className="text-text-muted">(24/7, free)</span>
            </a>
            <a href="sms:85258&body=SHOUT" className="flex items-center gap-2 text-xs text-gold hover:text-gold/80 transition-colors">
              <span className="text-sm">💬</span> Crisis Text Line: Text <strong>SHOUT</strong> to <strong>85258</strong>
            </a>
            <a href="tel:08006895555" className="flex items-center gap-2 text-xs text-text-mid hover:text-text-main transition-colors">
              <span className="text-sm">📞</span> SANEline: <strong>0800 689 5555</strong> <span className="text-text-muted">(4:30pm–10:30pm)</span>
            </a>
            <a href="tel:116123" className="flex items-center gap-2 text-xs text-text-mid hover:text-text-main transition-colors">
              <span className="text-sm">📞</span> Campaign Against Living Miserably: <strong>0800 58 58 58</strong> <span className="text-text-muted">(5pm–midnight)</span>
            </a>
            <p className="text-[9px] text-text-muted/60 mt-2 pt-2 border-t border-border">
              If you are in immediate danger, call <strong>999</strong>.
            </p>
          </div>
        </details>
      </div>
    )}
    </>
  );
}
