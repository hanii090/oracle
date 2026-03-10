'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { VoiceTranscriptEntry, VoiceSessionData } from '@/lib/elevenlabs-client';
import { ELEVENLABS_CONFIG } from '@/lib/elevenlabs-client';

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'ended';

interface UseElevenLabsVoiceOptions {
  onTranscriptUpdate?: (transcript: VoiceTranscriptEntry[]) => void;
  onStatusChange?: (status: VoiceStatus) => void;
  onSessionEnd?: (data: VoiceSessionData) => void;
  onError?: (error: string) => void;
  therapyMode?: string;
  userId?: string;
}

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions = {}) {
  const {
    onTranscriptUpdate,
    onStatusChange,
    onError,
    onSessionEnd,
    therapyMode = 'socratic',
    userId,
  } = options;

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  const sessionStartRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const transcriptRef = useRef<VoiceTranscriptEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const getTokenRef = useRef<(() => Promise<string | null>) | null>(null);

  // Stable refs for callbacks — synced via useEffect (React 19 forbids ref writes during render)
  const onStatusChangeRef = useRef(onStatusChange);
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const onErrorRef = useRef(onError);
  const onSessionEndRef = useRef(onSessionEnd);
  const userIdRef = useRef(userId);
  const therapyModeRef = useRef(therapyMode);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onTranscriptUpdateRef.current = onTranscriptUpdate;
    onErrorRef.current = onError;
    onSessionEndRef.current = onSessionEnd;
    userIdRef.current = userId;
    therapyModeRef.current = therapyMode;
  });

  // Status change handler (stable — uses refs)
  const updateStatus = useCallback((newStatus: VoiceStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  // Handle session end — save data to backend (stable — uses refs)
  const handleSessionEnd = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const durationMs = Date.now() - sessionStartRef.current;
    if (durationMs < 5000 || transcriptRef.current.length === 0) {
      setStatus('idle');
      onStatusChangeRef.current?.('idle');
      return; // Don't save very short sessions
    }

    const sessionData: VoiceSessionData = {
      sessionId: sessionIdRef.current,
      userId: userIdRef.current || '',
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
      durationMs,
      transcript: transcriptRef.current,
      therapyMode: therapyModeRef.current,
      voiceMinutesUsed: Math.ceil(durationMs / 60000),
    };

    // Save session to backend
    try {
      const token = getTokenRef.current ? await getTokenRef.current() : null;
      if (token) {
        await fetch('/api/voice-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });
      }
    } catch (err) {
      console.error('Failed to save voice session:', err);
    }

    onSessionEndRef.current?.(sessionData);
    setStatus('ended');
    onStatusChangeRef.current?.('ended');
  }, []);

  // End session and save data (stable — depends only on stable refs)
  // NOTE: endSession is defined after conversation below; use endSessionRef for the timer.
  const endSessionRef = useRef<(() => Promise<void>) | null>(null);

  // Conversation hook from ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      updateStatus('connected');
    },
    onDisconnect: () => {
      handleSessionEnd();
    },
    onMessage: (message: { source: string; message: string }) => {
      const entry: VoiceTranscriptEntry = {
        role: message.source === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: Date.now(),
      };
      transcriptRef.current = [...transcriptRef.current, entry];
      setTranscript([...transcriptRef.current]);
      onTranscriptUpdateRef.current?.(transcriptRef.current);
    },
    onError: (error: Error | string) => {
      const msg = typeof error === 'string' ? error : error.message;
      console.error('ElevenLabs error:', msg);
      updateStatus('error');
      onErrorRef.current?.(msg);
    },
  });

  // Now that conversation is declared, define endSession
  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // May already be disconnected
    }
    await handleSessionEnd();
  }, [conversation, handleSessionEnd]);

  // Keep ref up-to-date for the timer effect (sync via useEffect, not render)
  useEffect(() => {
    endSessionRef.current = endSession;
  });

  // Volume monitoring
  useEffect(() => {
    if (status === 'connected' || status === 'speaking' || status === 'listening') {
      const interval = setInterval(() => {
        if (conversation.isSpeaking) {
          updateStatus('speaking');
        } else {
          updateStatus('listening');
        }
        setVolumeLevel(conversation.isSpeaking ? 0.7 : 0.1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status, conversation.isSpeaking, updateStatus]);

  // Session duration timer
  useEffect(() => {
    if (status === 'connected' || status === 'speaking' || status === 'listening') {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        setSessionDuration(elapsed);

        // Auto-end at max duration
        if (elapsed * 1000 >= ELEVENLABS_CONFIG.conversation.maxDurationMs) {
          endSessionRef.current?.();
        }
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [status]);

  // Get signed URL from our API
  const getSignedUrl = useCallback(async (): Promise<{ signedUrl: string; minutesRemaining: number | null } | null> => {
    try {
      const token = getTokenRef.current ? await getTokenRef.current() : null;
      if (!token) {
        onErrorRef.current?.('Not authenticated. Please sign in.');
        return null;
      }

      const res = await fetch('/api/elevenlabs-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        onErrorRef.current?.(data.error || 'Failed to start voice session');
        return null;
      }

      return {
        signedUrl: data.signedUrl,
        minutesRemaining: data.minutesRemaining,
      };
    } catch (err) {
      onErrorRef.current?.('Network error. Please check your connection.');
      return null;
    }
  }, []);

  // Check microphone permission before starting
  const checkMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onErrorRef.current?.('Your browser does not support voice sessions. Please use Chrome, Safari, or Edge.');
        return false;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream — we just needed the permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        onErrorRef.current?.('Microphone access denied. Please allow microphone in your browser settings and try again.');
      } else if (name === 'NotFoundError') {
        onErrorRef.current?.('No microphone found. Please connect a microphone and try again.');
      } else {
        onErrorRef.current?.('Could not access microphone. Please check your device settings.');
      }
      return false;
    }
  }, []);

  // Start a voice session
  const startSession = useCallback(async (getIdToken: () => Promise<string | null>, overrides?: {
    systemPrompt?: string;
    firstMessage?: string;
  }) => {
    try {
      getTokenRef.current = getIdToken;
      updateStatus('connecting');
      
      sessionIdRef.current = `voice_${Date.now()}_${crypto.randomUUID()}`;
      sessionStartRef.current = Date.now();
      transcriptRef.current = [];
      setTranscript([]);
      setSessionDuration(0);

      // Pre-check microphone permission
      const hasMic = await checkMicrophoneAccess();
      if (!hasMic) {
        updateStatus('error');
        return false;
      }

      const tokenData = await getSignedUrl();
      if (!tokenData) {
        updateStatus('error');
        return false;
      }

      setMinutesRemaining(tokenData.minutesRemaining);

      // Start ElevenLabs conversation with signed URL
      await conversation.startSession({
        signedUrl: tokenData.signedUrl,
        overrides: overrides ? {
          agent: {
            prompt: {
              prompt: overrides.systemPrompt,
            },
            firstMessage: overrides.firstMessage,
          },
        } : undefined,
      });

      return true;
    } catch (err) {
      console.error('Failed to start voice session:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateStatus('error');
      onErrorRef.current?.(
        msg.includes('Permission') || msg.includes('microphone')
          ? 'Microphone access is required for voice sessions. Please enable it in your browser settings.'
          : msg.includes('WebSocket') || msg.includes('connect')
          ? 'Could not connect to voice server. Please check your internet connection and try again.'
          : `Voice session failed: ${msg}`
      );
      return false;
    }
  }, [conversation, getSignedUrl, updateStatus, checkMicrophoneAccess]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      conversation.setVolume({ volume: 0 });
    } else {
      conversation.setVolume({ volume: 0.8 });
    }
  }, [isMuted, conversation]);

  return {
    // State
    status,
    transcript,
    isMuted,
    volumeLevel,
    sessionDuration,
    minutesRemaining,
    isConnected: status === 'connected' || status === 'speaking' || status === 'listening',
    isSpeaking: status === 'speaking',
    isListening: status === 'listening',

    // Actions
    startSession,
    endSession,
    toggleMute,
  };
}
