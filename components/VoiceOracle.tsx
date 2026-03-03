'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceOracleProps {
  onTranscript: (text: string) => void;
  oracleText?: string;
  enabled: boolean;
}

/**
 * Voice Oracle — Web Speech API for voice input and SpeechSynthesis for TTS output.
 * Progressive: only shows if browser supports the APIs.
 */
export function VoiceOracle({ onTranscript, oracleText, enabled }: VoiceOracleProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check support synchronously via lazy initializer (avoids setState in effect)
  const isSupported = useRef(false);
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    isSupported.current = !!SpeechRecognition && 'speechSynthesis' in window;
  }, []);

  // Speak Oracle's questions
  useEffect(() => {
    if (!enabled || !oracleText || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(oracleText);
    utterance.rate = 0.85;
    utterance.pitch = 0.8;
    utterance.volume = 0.7;

    // Try to use a deeper/more mysterious voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Daniel') || v.name.includes('Samantha') || v.lang === 'en-GB');
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);

    return () => {
      speechSynthesis.cancel();
    };
  }, [oracleText, enabled]);

  const toggleListening = useCallback(() => {
    if (!isSupported.current) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onTranscript]);

  if (!enabled) {
    return (
      <div className="relative group">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted/30 cursor-not-allowed"
          aria-label="Voice Oracle — upgrade to Philosopher to unlock"
          title="Voice Oracle — Philosopher tier"
          disabled
        >
          🎙️
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          <div className="bg-deep border border-gold/20 rounded-lg px-3 py-2 text-[10px] font-courier text-gold tracking-wide whitespace-nowrap shadow-xl">
            🔒 Voice Oracle — Upgrade to unlock
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleListening}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-300 ${
          isListening
            ? 'border-crimson-bright text-crimson-bright bg-crimson/10 animate-pulse'
            : 'border-gold/30 text-gold hover:bg-gold/10'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        aria-pressed={isListening}
        title="Voice input"
      >
        🎙️
      </button>
      {isSpeaking && (
        <span className="text-[8px] font-courier text-gold/50 tracking-widest uppercase animate-pulse" aria-live="polite">
          Speaking...
        </span>
      )}
    </div>
  );
}
