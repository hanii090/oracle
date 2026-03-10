'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useElevenLabsVoice, type VoiceStatus } from '@/hooks/useElevenLabsVoice';
import { buildVoiceSystemPrompt, buildFirstMessage, ELEVENLABS_CONFIG } from '@/lib/elevenlabs-client';
import type { VoiceTranscriptEntry, VoiceSessionData } from '@/lib/elevenlabs-client';
import { hasVoiceAccess, voiceAllowanceLabel } from '@/lib/pricing-config';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, ChevronDown, MessageSquare, Clock, Shield, Lock } from 'lucide-react';

interface VoiceCoachProps {
  isOpen: boolean;
  onClose: () => void;
  getIdToken: () => Promise<string | null>;
  userId: string;
  userName?: string;
  tier: string;
  therapyMode?: string;
  sessionContext?: string;
  returningUser?: boolean;
  lastSessionTheme?: string;
  onSessionComplete?: (data: VoiceSessionData) => void;
  onUpgrade?: () => void;
}

// ── Animated Orb ───────────────────────────────────────────────────
function VoiceOrb({ status, volumeLevel }: { status: VoiceStatus; volumeLevel: number }) {
  const scale = status === 'speaking' ? 1 + volumeLevel * 0.4 : status === 'listening' ? 1.05 : 1;

  const colorMap: Record<VoiceStatus, string> = {
    idle: 'from-zinc-700 to-zinc-800',
    connecting: 'from-amber-900/60 to-amber-800/40',
    connected: 'from-amber-700/50 to-orange-800/40',
    speaking: 'from-amber-500/60 to-orange-600/50',
    listening: 'from-emerald-700/50 to-teal-800/40',
    error: 'from-red-800/60 to-red-900/40',
    ended: 'from-zinc-700 to-zinc-800',
  };

  const glowMap: Record<VoiceStatus, string> = {
    idle: 'shadow-none',
    connecting: 'shadow-amber-900/20',
    connected: 'shadow-amber-700/30',
    speaking: 'shadow-amber-500/50',
    listening: 'shadow-emerald-600/40',
    error: 'shadow-red-700/40',
    ended: 'shadow-none',
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      {(status === 'speaking' || status === 'listening') && (
        <>
          <motion.div
            className={`absolute w-48 h-48 rounded-full bg-gradient-to-r ${colorMap[status]} opacity-20`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute w-40 h-40 rounded-full bg-gradient-to-r ${colorMap[status]} opacity-30`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${colorMap[status]} shadow-2xl ${glowMap[status]} backdrop-blur-sm border border-white/5`}
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/5 to-transparent" />

        {/* Status indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === 'connecting' && (
            <motion.div
              className="w-3 h-3 rounded-full bg-amber-400/80"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {status === 'speaking' && (
            <div className="flex gap-1 items-end h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-amber-300/70 rounded-full"
                  animate={{ height: [8, 24 + (i * 2.3), 8] }}
                  transition={{ duration: 0.4 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}
          {status === 'listening' && (
            <motion.div
              className="w-4 h-4 rounded-full bg-emerald-400/60"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Mood Quick-Select ──────────────────────────────────────────────
function MoodSelector({ onSelect }: { onSelect: (mood: number) => void }) {
  const moods = [
    { value: 1, emoji: '😢', label: 'Awful' },
    { value: 3, emoji: '😔', label: 'Low' },
    { value: 5, emoji: '😐', label: 'Okay' },
    { value: 7, emoji: '🙂', label: 'Good' },
    { value: 9, emoji: '😊', label: 'Great' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <p className="text-sm text-white/60 font-light">How are you feeling right now?</p>
      <div className="flex gap-3">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onSelect(mood.value)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-[10px] text-white/40">{mood.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Transcript Panel ───────────────────────────────────────────────
function TranscriptPanel({
  transcript,
  isOpen,
  onToggle,
}: {
  transcript: VoiceTranscriptEntry[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isOpen]);

  return (
    <div className={`absolute bottom-24 left-0 right-0 transition-all duration-300 ${isOpen ? 'h-64' : 'h-0'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="h-full mx-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-xs text-white/50 font-medium tracking-wide uppercase">Live Transcript</span>
              <button onClick={onToggle} className="text-white/30 hover:text-white/60">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={scrollRef} className="p-4 overflow-y-auto h-[calc(100%-44px)] space-y-3">
              {transcript.map((entry, i) => (
                <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    entry.role === 'user'
                      ? 'bg-emerald-900/30 text-emerald-100/90'
                      : 'bg-amber-900/20 text-amber-100/80'
                  }`}>
                    {entry.content}
                  </div>
                </div>
              ))}
              {transcript.length === 0 && (
                <p className="text-center text-white/30 text-sm italic">Transcript will appear here as you talk...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Format time ────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Pre-computed particle positions (avoids Math.random in render) ──
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 13) % 100),
  top: ((i * 53 + 7) % 100),
  duration: 4 + (i % 5) * 0.8,
  delay: (i % 7) * 0.4,
}));

// ── Main Voice Coach Component ─────────────────────────────────────
export function VoiceCoach({
  isOpen,
  onClose,
  getIdToken,
  userId,
  userName,
  tier,
  therapyMode = 'socratic',
  sessionContext,
  returningUser = false,
  lastSessionTheme,
  onSessionComplete,
  onUpgrade,
}: VoiceCoachProps) {
  // Tier gate — show upgrade screen if user has no voice access
  const canAccessVoice = hasVoiceAccess(tier as 'free' | 'philosopher' | 'pro' | 'practice');

  const [phase, setPhase] = useState<'mood-check' | 'session' | 'post-session'>('mood-check');
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<VoiceSessionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning' as const;
    if (h >= 22 || h < 5) return 'night' as const;
    return 'evening' as const;
  })();

  const {
    status,
    transcript,
    isMuted,
    volumeLevel,
    sessionDuration,
    minutesRemaining,
    isConnected,
    startSession,
    endSession,
    toggleMute,
  } = useElevenLabsVoice({
    therapyMode,
    userId,
    onStatusChange: (s) => {
      if (s === 'ended') {
        setPhase('post-session');
      }
    },
    onSessionEnd: (data) => {
      setSessionSummary(data);
      onSessionComplete?.(data);
    },
    onError: (err) => {
      console.error('Voice error:', err);
      setErrorMessage(err);
    },
  });

  // Start session after mood check
  const handleMoodSelect = useCallback(async (mood: number) => {
    setMoodBefore(mood);
    setPhase('session');

    const isCrisisMode = false; // Could be determined by previous session data
    const systemPrompt = buildVoiceSystemPrompt({
      therapyMode,
      userName,
      sessionContext,
      timeOfDay,
      isCrisisMode,
    });

    const firstMessage = buildFirstMessage({
      userName,
      timeOfDay,
      returningUser,
      lastSessionTheme,
    });

    await startSession(getIdToken, {
      systemPrompt,
      firstMessage,
    });
  }, [therapyMode, userName, sessionContext, timeOfDay, returningUser, lastSessionTheme, startSession, getIdToken]);

  // Skip mood check and start directly
  const handleSkipMood = useCallback(async () => {
    setPhase('session');

    const systemPrompt = buildVoiceSystemPrompt({
      therapyMode,
      userName,
      sessionContext,
      timeOfDay,
      isCrisisMode: false,
    });

    const firstMessage = buildFirstMessage({
      userName,
      timeOfDay,
      returningUser,
      lastSessionTheme,
    });

    await startSession(getIdToken, { systemPrompt, firstMessage });
  }, [therapyMode, userName, sessionContext, timeOfDay, returningUser, lastSessionTheme, startSession, getIdToken]);

  // Handle close
  const handleClose = useCallback(async () => {
    if (isConnected) {
      await endSession();
    }
    setPhase('mood-check');
    setMoodBefore(null);
    setMoodAfter(null);
    setSessionSummary(null);
    onClose();
  }, [isConnected, endSession, onClose]);

  // Post-session mood
  const handlePostMood = useCallback((mood: number) => {
    setMoodAfter(mood);
    // Session already saved; this is just for local display
  }, []);

  if (!isOpen) return null;

  // If user doesn't have voice access, show upgrade gate
  if (!canAccessVoice) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 max-w-sm mx-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-900/20 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400/60" />
            </div>
            <h3 className="text-xl font-light text-white/90">Voice Sessions</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Talk to Sorca in real-time voice sessions. Upgrade to unlock {voiceAllowanceLabel('philosopher')}.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { onClose(); onUpgrade?.(); }}
                className="flex-1 py-3 rounded-xl bg-amber-900/30 hover:bg-amber-900/40 border border-amber-500/30 text-amber-200/80 text-sm font-medium transition-colors"
              >
                Upgrade
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />

        {/* Subtle ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-amber-500/10"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-safe">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center">
              <span className="text-sm">✦</span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-white/90">Sorca Voice</h2>
              <p className="text-[10px] text-white/40 capitalize">{therapyMode} mode</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Session timer */}
            {isConnected && (
              <div className="flex items-center gap-1.5 text-white/40">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">{formatTime(sessionDuration)}</span>
              </div>
            )}

            {/* Minutes remaining */}
            {minutesRemaining !== null && (
              <div className="text-[10px] text-amber-500/60 font-mono">
                {minutesRemaining}m left
              </div>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {/* Phase: Mood Check */}
            {phase === 'mood-check' && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8"
              >
                <VoiceOrb status="idle" volumeLevel={0} />
                <MoodSelector onSelect={handleMoodSelect} />
                <button
                  onClick={handleSkipMood}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Skip check-in →
                </button>
              </motion.div>
            )}

            {/* Phase: Active Session */}
            {phase === 'session' && (
              <motion.div
                key="session"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-6"
              >
                <VoiceOrb status={status} volumeLevel={volumeLevel} />

                {/* Status text */}
                <motion.p
                  key={status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-white/50 font-light"
                >
                  {status === 'connecting' && 'Connecting...'}
                  {status === 'speaking' && 'Sorca is speaking...'}
                  {status === 'listening' && 'Listening to you...'}
                  {status === 'connected' && 'Ready — start talking'}
                  {status === 'error' && (errorMessage || 'Connection failed. Tap the phone to retry.')}
                </motion.p>

                {/* Retry hint for error state */}
                {status === 'error' && (
                  <button
                    onClick={() => { setErrorMessage(null); handleSkipMood(); }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-900/30"
                  >
                    Retry Connection
                  </button>
                )}

                {/* Last transcript message (live caption) */}
                {transcript.length > 0 && (
                  <motion.div
                    key={transcript.length}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm text-center"
                  >
                    <p className={`text-sm font-light ${
                      transcript[transcript.length - 1].role === 'assistant'
                        ? 'text-amber-200/70 italic'
                        : 'text-white/60'
                    }`}>
                      &ldquo;{transcript[transcript.length - 1].content}&rdquo;
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Phase: Post-Session */}
            {phase === 'post-session' && (
              <motion.div
                key="post"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 max-w-sm"
              >
                <VoiceOrb status="ended" volumeLevel={0} />

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-light text-white/90">Session Complete</h3>
                  {sessionSummary && (
                    <p className="text-sm text-white/40">
                      {formatTime(Math.floor(sessionSummary.durationMs / 1000))} • {sessionSummary.transcript.length} exchanges
                    </p>
                  )}
                </div>

                {!moodAfter ? (
                  <div className="space-y-3">
                    <p className="text-sm text-white/50 text-center">How do you feel now?</p>
                    <MoodSelector onSelect={handlePostMood} />
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {/* Mood change indicator */}
                    {moodBefore !== null && (
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <span className="text-white/40">Before: {moodBefore}/10</span>
                        <span className="text-white/20">→</span>
                        <span className={moodAfter > moodBefore ? 'text-emerald-400/80' : moodAfter < moodBefore ? 'text-amber-400/80' : 'text-white/40'}>
                          After: {moodAfter}/10
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          setPhase('mood-check');
                          setMoodBefore(null);
                          setMoodAfter(null);
                          setSessionSummary(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-amber-900/20 hover:bg-amber-900/30 text-amber-200/80 text-sm transition-colors"
                      >
                        New Session
                      </button>
                    </div>
                  </div>
                )}

                {/* Transcript saved notice */}
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  <Shield className="w-3 h-3" />
                  <span>Transcript auto-saved to your private space</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcript panel */}
        {phase === 'session' && (
          <TranscriptPanel
            transcript={transcript}
            isOpen={showTranscript}
            onToggle={() => setShowTranscript(!showTranscript)}
          />
        )}

        {/* Bottom controls */}
        {phase === 'session' && (
          <div className="relative z-10 pb-safe">
            <div className="flex items-center justify-center gap-6 p-6">
              {/* Transcript toggle */}
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  showTranscript ? 'bg-white/15 text-white/80' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
                aria-label="Toggle transcript"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Main call button */}
              {!isConnected && status !== 'connecting' ? (
                <button
                  onClick={handleSkipMood}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-colors"
                  aria-label="Start voice session"
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-900/30 transition-colors"
                  aria-label="End voice session"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-900/30 text-red-400' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
