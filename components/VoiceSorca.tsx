'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceSorcaProps {
  onTranscript: (text: string) => void;
  sorcaText?: string;
  enabled: boolean;
  onSilenceDetected?: () => void;
  onSilenceData?: (data: { totalSpeechMs: number; totalSilenceMs: number; pauses: { durationMs: number; timestamp: number }[] }) => void;
}

/**
 * Voice Sorca — Web Speech API for voice input and SpeechSynthesis for TTS output.
 * Progressive: only shows if browser supports the APIs.
 *
 * Features 03 & 10: Silence Detection + Silence Score tracking.
 * Uses AudioContext AnalyserNode to detect pauses ≥4 seconds mid-answer.
 */
export function VoiceSorca({ onTranscript, sorcaText, enabled, onSilenceDetected, onSilenceData }: VoiceSorcaProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceMessage, setSilenceMessage] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Silence detection state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number>(0);
  const isSilentRef = useRef(false);
  const silenceThreshold = 4000; // 4 seconds
  const silenceAnimFrame = useRef<number>(0);
  const totalSpeechMsRef = useRef(0);
  const totalSilenceMsRef = useRef(0);
  const pausesRef = useRef<{ durationMs: number; timestamp: number }[]>([]);
  const lastTickRef = useRef(0);
  const hasTriggeredSilenceRef = useRef(false);

  // Check support synchronously via lazy initializer (avoids setState in effect)
  const isSupported = useRef(false);
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    isSupported.current = !!SpeechRecognition && 'speechSynthesis' in window;
  }, []);

  // Speak Sorca's questions
  useEffect(() => {
    if (!enabled || !sorcaText || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(sorcaText);
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
  }, [sorcaText, enabled]);

  // Silence detection loop using AudioContext AnalyserNode
  const startSilenceDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      silenceStartRef.current = 0;
      isSilentRef.current = false;
      totalSpeechMsRef.current = 0;
      totalSilenceMsRef.current = 0;
      pausesRef.current = [];
      lastTickRef.current = Date.now();
      hasTriggeredSilenceRef.current = false;

      const dataArray = new Uint8Array(analyser.fftSize);

      const detect = () => {
        if (!analyserRef.current) return;
        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const isSilent = rms < 0.02; // Silence threshold

        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        if (isSilent) {
          totalSilenceMsRef.current += delta;
          if (!isSilentRef.current) {
            isSilentRef.current = true;
            silenceStartRef.current = now;
          } else {
            const silenceDuration = now - silenceStartRef.current;
            // Feature 03: Silence Detector — after 4+ seconds, show "Take your time"
            if (silenceDuration >= silenceThreshold && !hasTriggeredSilenceRef.current) {
              hasTriggeredSilenceRef.current = true;
              setSilenceMessage(true);
              onSilenceDetected?.();
              setTimeout(() => setSilenceMessage(false), 5000);
            }
          }
        } else {
          totalSpeechMsRef.current += delta;
          if (isSilentRef.current) {
            const pauseDuration = now - silenceStartRef.current;
            if (pauseDuration > 500) {
              pausesRef.current.push({ durationMs: pauseDuration, timestamp: silenceStartRef.current });
            }
            isSilentRef.current = false;
            hasTriggeredSilenceRef.current = false;
          }
        }

        silenceAnimFrame.current = requestAnimationFrame(detect);
      };

      detect();
    } catch {
      // Microphone access denied or unavailable
    }
  }, [onSilenceDetected]);

  const stopSilenceDetection = useCallback(() => {
    if (silenceAnimFrame.current) cancelAnimationFrame(silenceAnimFrame.current);
    analyserRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    // Report silence data for Silence Score (Feature 10)
    if (totalSpeechMsRef.current > 0 || totalSilenceMsRef.current > 0) {
      onSilenceData?.({
        totalSpeechMs: totalSpeechMsRef.current,
        totalSilenceMs: totalSilenceMsRef.current,
        pauses: pausesRef.current,
      });
    }
  }, [onSilenceData]);

  const toggleListening = useCallback(() => {
    if (!isSupported.current) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopSilenceDetection();
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
      stopSilenceDetection();
    };

    recognition.onerror = () => {
      setIsListening(false);
      stopSilenceDetection();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopSilenceDetection();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    startSilenceDetection();
  }, [isListening, onTranscript, startSilenceDetection, stopSilenceDetection]);

  if (!enabled) {
    return (
      <div className="relative group">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted/30 cursor-not-allowed"
          aria-label="Voice Sorca — upgrade to Philosopher to unlock"
          title="Voice Sorca — Philosopher tier"
          disabled
        >
          🎙️
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          <div className="bg-deep border border-gold/20 rounded-lg px-3 py-2 text-[10px] font-courier text-gold tracking-wide whitespace-nowrap shadow-xl">
            🔒 Voice Sorca — Upgrade to unlock
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
      {/* Feature 03: Silence Detector — "Take your time" message */}
      {silenceMessage && (
        <span className="text-[10px] font-cormorant italic text-gold animate-pulse" aria-live="polite">
          Take your time.
        </span>
      )}
    </div>
  );
}
