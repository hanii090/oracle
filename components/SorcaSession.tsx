"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useLyriaFoley } from "@/hooks/useLyriaFoley";
import { useAuth, SessionMessage } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

// Extracted components (#8 — break monolith into focused components)
import { SessionHeader } from "@/components/session/SessionHeader";
import { ChatMessage, LoadingIndicator, type Message } from "@/components/session/ChatMessage";
import { ChatInput } from "@/components/session/ChatInput";
import { FeatureStatus } from "@/components/session/FeatureStatus";
import { ResetModal } from "@/components/session/ResetModal";
import { DepthLimitModal } from "@/components/session/DepthLimitModal";
import { BreakthroughVisual } from "@/components/session/BreakthroughVisual";
import { VoiceSorca } from '@/components/VoiceSorca';
import { SessionExport } from "@/components/SessionExport";
import { SilenceScore } from "@/components/session/SilenceScore";

// New onboarding / UX components
import { WelcomeModal } from "@/components/session/WelcomeModal";
import { HelpPanel } from "@/components/session/HelpPanel";
import { NightBanner } from "@/components/session/NightBanner";
import { ShareCard } from "@/components/session/ShareCard";
import { DepthToast } from "@/components/session/DepthToast";
import AvoidedQuestionNotification from "@/components/session/AvoidedQuestionNotification";
import { EndOfLifeToggle, MemoryPortraitOverlay, ThreadArchiveModal, EolSessionTools } from "@/components/session/EndOfLifeMode";

export function SorcaSession({ onExit, viewSession }: { onExit: () => void; viewSession?: { messages: SessionMessage[]; maxDepth: number; createdAt: string } | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [depth, setDepth] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [pastThread, setPastThread] = useState<Message[]>([]);
  const [currentVisual, setCurrentVisual] = useState<string | null>(null);
  const [isBreakthrough, setIsBreakthrough] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDepthLimit, setShowDepthLimit] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [lastOracleText, setLastOracleText] = useState<string | undefined>();
  const [showShareCard, setShowShareCard] = useState(false);
  const [avoidedReminder, setAvoidedReminder] = useState<{
    question: string;
    daysSinceAvoided: number;
    message: string;
    deflectionType: string;
  } | null>(null);
  const [silenceData, setSilenceData] = useState<{ totalSpeechMs: number; totalSilenceMs: number; pauses: { durationMs: number; timestamp: number }[] } | null>(null);
  const [silenceScore, setSilenceScore] = useState<{ score: number; quality: string; trend: string } | null>(null);
  const [personalKey, setPersonalKey] = useState<{ key: string; mode: string; emotion: string } | null>(null);
  const [ambientPortrait, setAmbientPortrait] = useState<{ description: string; palette: string[] } | null>(null);
  const [showPortrait, setShowPortrait] = useState(false);

  // End of Life mode state
  const [eolMode, setEolMode] = useState(false);
  const [memoryPortrait, setMemoryPortrait] = useState<{
    id: string; title: string; essence: string; coreValues: string[];
    unsaidWords: string; legacyWish: string; keyQuotes: string[];
    toThoseLeft: string; palette: string[]; generatedAt: string;
  } | null>(null);
  const [showMemoryPortrait, setShowMemoryPortrait] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isCreatingArchive, setIsCreatingArchive] = useState(false);
  const [archiveResult, setArchiveResult] = useState<{ token: string; shareUrl: string; totalSessions: number } | null>(null);
  const isFirstMessage = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { steerMusic, triggerBreakthrough } = useLyriaFoley(true);
  const { user: authUser, profile, saveSession, loadSessions, getIdToken } = useAuth();
  const {
    showWelcome,
    showNightBanner,
    showHelp,
    streak,
    dismissWelcome,
    showNightExplanation,
    dismissNightBanner,
    toggleHelp,
    dismissHelp,
    recordSession,
  } = useOnboarding();

  // #22 Night Oracle auto-detection (midnight–5am) — paid tiers only
  useEffect(() => {
    if (profile?.tier === 'free') return;
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      setNightMode(true);
      showNightExplanation();
    }
  }, [showNightExplanation, profile?.tier]);

  // Handle viewing a past session (read-only mode)
  useEffect(() => {
    if (viewSession) {
      setMessages(viewSession.messages as Message[]);
      setDepth(viewSession.maxDepth);
    }
  }, [viewSession]);

  useEffect(() => {
    if (viewSession) return;

    const uid = authUser?.uid || localStorage.getItem("sorca_user_id") || crypto.randomUUID();
    if (!authUser) {
      localStorage.setItem("sorca_user_id", uid);
    }
    setUserId(uid);

    const loadThread = async () => {
      let loadedFromFirebase = false;
      if (isFirebaseConfigured && db && uid) {
        try {
          const docRef = doc(db, "threads", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.messages && data.messages.length > 0) {
              // Normalize old 'oracle' role to 'assistant' for backward compatibility
              const normalizedMessages = data.messages.map((m: Message) => ({
                ...m,
                role: (m.role as string) === 'oracle' ? 'assistant' as const : m.role,
              }));
              setPastThread(normalizedMessages);
              const lastDepth = normalizedMessages[normalizedMessages.length - 1].depth;
              if (lastDepth) setDepth(lastDepth);
              loadedFromFirebase = true;
            }
          }
        } catch (e) {
          console.error("Firebase load error", e);
        }
      }

      if (!loadedFromFirebase) {
        const local = localStorage.getItem("sorca_thread");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setPastThread(parsed);
            if (parsed.length > 0) {
              setDepth(parsed[parsed.length - 1].depth || 1);
            }
          } catch { /* ignore corrupt data */ }
        }
      }
    };
    loadThread();

    const greeting = "What truth are you avoiding today?";
    setMessages([{ id: crypto.randomUUID(), role: "assistant", content: greeting, depth: 1 }]);
    setLastOracleText(greeting);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EOL mode toggle handler
  const handleToggleEol = useCallback(() => {
    if (profile?.tier !== 'pro') return;
    const entering = !eolMode;
    setEolMode(entering);
    if (entering) {
      const eolGreeting = "What do you want them to remember about you?";
      setMessages([{ id: crypto.randomUUID(), role: "assistant", content: eolGreeting, depth: 1 }]);
      setLastOracleText(eolGreeting);
      setDepth(1);
      setPastThread([]);
    }
  }, [eolMode, profile?.tier]);

  // Generate Memory Portrait handler
  const handleGenerateMemoryPortrait = useCallback(async () => {
    const currentMessages = messages.filter(m => m.role !== 'assistant' || m.content !== "What do you want them to remember about you?");
    if (currentMessages.length < 6) return;
    setIsGeneratingPortrait(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/memory-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionMessages: currentMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemoryPortrait(data.portrait);
        setShowMemoryPortrait(true);
      }
    } catch { /* non-critical */ } finally {
      setIsGeneratingPortrait(false);
    }
  }, [messages, getIdToken]);

  // Create Thread Archive handler
  const handleCreateArchive = useCallback(async (recipientName: string, personalNote: string) => {
    setIsCreatingArchive(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/thread-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'create', recipientName, personalNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setArchiveResult(data.archive);
      }
    } catch { /* non-critical */ } finally {
      setIsCreatingArchive(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExit = useCallback(async () => {
    const currentMessages = messages.filter(m => !(m.role === "assistant" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
      recordSession();

      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Run post-session analyses in parallel (non-blocking)
      const postSessionTasks: Promise<void>[] = [];

      // Feature 05: Avoided question analysis for paid users
      if (profile?.tier !== 'free' && currentMessages.length >= 4) {
        postSessionTasks.push(
          fetch('/api/avoided', {
            method: 'POST',
            headers,
            body: JSON.stringify({ sessionMessages: currentMessages }),
          }).then(async res => {
            if (res.ok) {
              const data = await res.json();
              if (data.weeklyReminder) setAvoidedReminder(data.weeklyReminder);
            }
          }).catch(() => {})
        );
      }

      // Feature 02: Question DNA analysis
      if (profile?.tier !== 'free' && currentMessages.length >= 3) {
        postSessionTasks.push(
          fetch('/api/question-dna', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sessionMessages: currentMessages.map(m => ({ role: m.role, content: m.content })),
            }),
          }).then(() => {}).catch(() => {})
        );
      }

      // Feature 04: Belief extraction
      if (profile?.tier !== 'free' && currentMessages.length >= 3) {
        postSessionTasks.push(
          fetch('/api/beliefs', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sessionMessages: currentMessages.map(m => ({ role: m.role, content: m.content })),
            }),
          }).then(() => {}).catch(() => {})
        );
      }

      // Feature 10: Silence Score (only if voice was used and we have data)
      if (silenceData && silenceData.totalSpeechMs > 0) {
        postSessionTasks.push(
          fetch('/api/silence-score', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              totalSpeechMs: silenceData.totalSpeechMs,
              totalSilenceMs: silenceData.totalSilenceMs,
              pauses: silenceData.pauses,
              messageCount: currentMessages.length,
              depth,
            }),
          }).then(async res => {
            if (res.ok) {
              const data = await res.json();
              setSilenceScore(data);
            }
          }).catch(() => {})
        );
      }

      // Feature 09: Ambient Portrait generation
      if (profile?.tier === 'pro' && currentMessages.length >= 4) {
        postSessionTasks.push(
          fetch('/api/ambient-portrait', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sessionMessages: currentMessages.map(m => ({ role: m.role, content: m.content })),
              depth,
            }),
          }).then(async res => {
            if (res.ok) {
              const data = await res.json();
              setAmbientPortrait(data.portrait);
              setShowPortrait(true);
            }
          }).catch(() => {})
        );
      }

      await Promise.allSettled(postSessionTasks);

      // Show share card if they went deep enough
      if (depth >= 3) {
        setShowShareCard(true);
        return; // Don't exit yet, let them share first
      }
    }
    onExit();
  }, [messages, depth, saveSession, loadSessions, onExit, recordSession, profile, getIdToken, silenceData]);

  const handleReset = useCallback(async () => {
    const currentMessages = messages.filter(m => !(m.role === "assistant" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
      recordSession();
    }

    const greeting = "What truth are you avoiding today?";
    setMessages([{ id: crypto.randomUUID(), role: "assistant", content: greeting, depth: 1 }]);
    setLastOracleText(greeting);
    setPastThread([]);
    setDepth(1);
    setShowResetConfirm(false);

    if (isFirebaseConfigured && db && userId) {
      try {
        await deleteDoc(doc(db, "threads", userId));
      } catch (e) {
        console.error("Firebase delete error", e);
      }
    }
    localStorage.removeItem("sorca_thread");
  }, [messages, depth, saveSession, loadSessions, userId, recordSession]);

  // #4 FIX: All AI calls now go through the server-side proxy.
  // No API keys are exposed to the client.
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      depth,
    };

    if (profile?.tier === "free" && depth >= 5) {
      setShowDepthLimit(true);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Feature 07: Assign Personal Key on first message
    if (isFirstMessage.current && profile?.tier !== 'free') {
      isFirstMessage.current = false;
      try {
        const token = await getIdToken();
        const keyRes = await fetch('/api/personal-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'assign',
            firstMessage: input,
          }),
        });
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          setPersonalKey(keyData);
        }
      } catch {
        // Non-critical — continue without personal key
      }
    }

    try {
      const newDepth = depth + 1;

      // POST to server-side AI proxy (#4 — no client-side API keys)
      // Route through EOL API when End of Life mode is active
      const token = await getIdToken();
      const apiEndpoint = eolMode ? "/api/end-of-life" : "/api/sorca";
      const apiBody = eolMode
        ? {
            message: input,
            conversationHistory: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            threadContext: pastThread.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            depth: newDepth,
          }
        : {
            message: input,
            conversationHistory: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            threadContext: pastThread.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            depth: newDepth,
            nightMode,
            tier: profile?.tier || "free",
          };
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(apiBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const question = data.question || "What are you hiding from yourself?";
      const emotionData = data.emotionData || {};

      // Handle crisis response — show resources instead of continuing the session
      if (data.crisisResources) {
        const crisisMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: question + "\n\n" + data.crisisResources.join("\n"),
          depth,
        };
        setMessages((prev) => [...prev, crisisMsg]);
        setIsLoading(false);
        return;
      }

      // Steer Lyria music with emotion weights
      if (emotionData.lyriaEmotionWeights) {
        steerMusic(emotionData.lyriaEmotionWeights);
      }

      // Handle breakthrough visual
      if (emotionData.breakthrough > 0.75) {
        setIsBreakthrough(true);
        triggerBreakthrough();

        if (data.visual) {
          setCurrentVisual(data.visual);
          setTimeout(() => setIsBreakthrough(false), 12000);
        } else {
          setTimeout(() => setIsBreakthrough(false), 4000);
        }
      }

      const oracleMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: question,
        depth: newDepth,
      };

      setMessages((prev) => [...prev, oracleMsg]);
      setLastOracleText(question);
      setDepth(newDepth);

      // Save to thread
      const updatedThread = [...pastThread, userMsg, oracleMsg];
      setPastThread(updatedThread);

      let savedToFirebase = false;
      if (isFirebaseConfigured && db && userId) {
        try {
          await setDoc(doc(db, "threads", userId), { messages: updatedThread }, { merge: true });
          savedToFirebase = true;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          console.warn("Firebase save error (falling back to local storage):", msg);
        }
      }

      if (!savedToFirebase) {
        localStorage.setItem("sorca_thread", JSON.stringify(updatedThread));
      }

      // Auto-save to session history after each exchange so it appears immediately
      const allMessages = [...messages, userMsg, oracleMsg].filter(
        m => !(m.role === "assistant" && m.content === "What truth are you avoiding today?")
      );
      if (allMessages.filter(m => m.role === "user").length > 0) {
        saveSession(allMessages, newDepth).then(() => loadSessions()).catch(() => {});
      }
    } catch (error) {
      console.error("Sorca API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Why do you seek answers when the connection is severed?",
          depth,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, depth, profile, messages, pastThread, nightMode, eolMode, steerMusic, triggerBreakthrough, userId, getIdToken, saveSession, loadSessions]);

  // Voice transcript handler
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  // Feature 03 & 10: Silence detection + data tracking
  const handleSilenceDetected = useCallback(() => {
    // The VoiceSorca component shows "Take your time" — we can log analytics here
  }, []);

  const handleSilenceData = useCallback((data: { totalSpeechMs: number; totalSilenceMs: number; pauses: { durationMs: number; timestamp: number }[] }) => {
    setSilenceData(data);
  }, []);

  const displayMessages = nightMode ? messages.slice(-2) : messages;

  return (
    <motion.div
      className={`relative z-10 w-full ${nightMode ? "max-w-xl" : "max-w-3xl"} h-[100dvh] flex flex-col ${nightMode ? "py-6 px-4" : "py-12 px-6"} transition-all duration-1000 mx-auto ${isBreakthrough ? "bg-ink/20" : ""} ${nightMode ? "bg-ink text-void" : ""} ${eolMode ? "bg-gradient-to-b from-amber-950/5 to-transparent" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      role="region"
      aria-label="Sorca session"
    >
      <BreakthroughVisual imageUrl={currentVisual} isActive={isBreakthrough} />

      <div className="relative z-10 flex flex-col h-full w-full min-h-0">
        <SessionHeader
          depth={depth}
          nightMode={nightMode}
          isViewingPast={!!viewSession}
          viewSessionDate={viewSession?.createdAt}
          streak={streak.currentStreak}
          tier={profile?.tier || 'free'}
          onToggleNight={() => {
            if (profile?.tier === 'free') return; // Night Sorca is paid-only
            setNightMode(!nightMode);
            if (!nightMode) showNightExplanation();
          }}
          onRestart={() => setShowResetConfirm(true)}
          onExit={viewSession ? onExit : handleExit}
          onHelp={toggleHelp}
        />

        {/* Feature Status + Session Tools */}
        {!viewSession && !nightMode && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FeatureStatus
                pastThreadLength={pastThread.length}
                depth={depth}
                isBreakthrough={isBreakthrough}
                tier={profile?.tier || 'free'}
              />
              <EndOfLifeToggle
                isActive={eolMode}
                onToggle={handleToggleEol}
                isPro={profile?.tier === 'pro'}
              />
            </div>
            <div className="flex items-center gap-2">
              {eolMode && (
                <EolSessionTools
                  onGeneratePortrait={handleGenerateMemoryPortrait}
                  onOpenArchive={() => setShowArchiveModal(true)}
                  isGeneratingPortrait={isGeneratingPortrait}
                  messageCount={messages.length}
                />
              )}
              <VoiceSorca
                onTranscript={handleVoiceTranscript}
                oracleText={lastOracleText}
                enabled={profile?.tier !== "free"}
                onSilenceDetected={handleSilenceDetected}
                onSilenceData={handleSilenceData}
              />
              <SessionExport messages={messages} depth={depth} allSessions={undefined} />
              {silenceScore && (
                <SilenceScore score={silenceScore.score} quality={silenceScore.quality} trend={silenceScore.trend} />
              )}
              {personalKey && (
                <span className="font-courier text-[9px] text-gold/60 tracking-widest uppercase" title={`Your key: ${personalKey.key} ${personalKey.mode}`}>
                  ♫ {personalKey.key}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Message area */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto mb-8 pr-4 space-y-8 ${nightMode ? "flex flex-col justify-center" : ""}`}
          role="log"
          aria-label="Conversation history"
          aria-live="polite"
        >
          {displayMessages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              nightMode={nightMode}
              isLast={i === displayMessages.length - 1}
              index={i}
              totalMessages={displayMessages.length}
            />
          ))}
          {isLoading && <LoadingIndicator depth={depth} nightMode={nightMode} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {viewSession ? (
          <div className="mt-auto pt-6 border-t border-border text-center">
            <div className="flex items-center justify-center gap-4">
              <p className="font-courier text-xs text-text-muted tracking-widest uppercase">Archived session · Read only</p>
              <SessionExport messages={messages} depth={depth} />
            </div>
          </div>
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            nightMode={nightMode}
          />
        )}
      </div>

      <ResetModal
        show={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
      />

      <DepthLimitModal
        show={showDepthLimit}
        onClose={() => setShowDepthLimit(false)}
        onUpgrade={() => {
          setShowDepthLimit(false);
          onExit();
        }}
      />

      {/* Onboarding & UX overlays */}
      <WelcomeModal show={showWelcome && !viewSession} onDismiss={dismissWelcome} />
      <HelpPanel show={showHelp} onClose={dismissHelp} />
      <NightBanner show={showNightBanner} onDismiss={dismissNightBanner} />
      <DepthToast depth={depth} tier={profile?.tier || 'free'} />
      <ShareCard
        show={showShareCard}
        depth={depth}
        messageCount={messages.length}
        onClose={() => { setShowShareCard(false); onExit(); }}
      />
      <AvoidedQuestionNotification
        reminder={avoidedReminder}
        onDismiss={() => setAvoidedReminder(null)}
        onExplore={(question) => {
          setAvoidedReminder(null);
          setInput(question);
        }}
      />

      {/* End of Life: Memory Portrait overlay */}
      <MemoryPortraitOverlay
        portrait={memoryPortrait}
        show={showMemoryPortrait}
        onClose={() => setShowMemoryPortrait(false)}
      />

      {/* End of Life: Thread Archive modal */}
      <ThreadArchiveModal
        show={showArchiveModal}
        onClose={() => { setShowArchiveModal(false); setArchiveResult(null); }}
        onCreateArchive={handleCreateArchive}
        isCreating={isCreatingArchive}
        archiveResult={archiveResult}
      />

      {/* Feature 09: Ambient Portrait overlay */}
      {showPortrait && ambientPortrait && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 backdrop-blur-md"
          onClick={() => { setShowPortrait(false); }}
        >
          <div className="max-w-lg mx-auto p-8 text-center">
            <h3 className="font-cinzel text-xl text-gold mb-4">Your Ambient Portrait</h3>
            <p className="font-cormorant text-lg text-void/80 leading-relaxed italic mb-6">
              &ldquo;{ambientPortrait.description}&rdquo;
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {ambientPortrait.palette.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border border-void/20"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <p className="font-courier text-[10px] text-void/40 tracking-widest uppercase">
              Tap anywhere to close
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
