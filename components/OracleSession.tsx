"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useLyriaFoley } from "@/hooks/useLyriaFoley";
import { useAuth, SessionMessage } from "@/hooks/useAuth";

// Extracted components (#8 — break monolith into focused components)
import { SessionHeader } from "@/components/session/SessionHeader";
import { ChatMessage, LoadingIndicator, type Message } from "@/components/session/ChatMessage";
import { ChatInput } from "@/components/session/ChatInput";
import { FeatureStatus } from "@/components/session/FeatureStatus";
import { ResetModal } from "@/components/session/ResetModal";
import { DepthLimitModal } from "@/components/session/DepthLimitModal";
import { BreakthroughVisual } from "@/components/session/BreakthroughVisual";
import { VoiceOracle } from "@/components/VoiceOracle";
import { SessionExport } from "@/components/SessionExport";

export function OracleSession({ onExit, viewSession }: { onExit: () => void; viewSession?: { messages: SessionMessage[]; maxDepth: number; createdAt: string } | null }) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { steerMusic, triggerBreakthrough } = useLyriaFoley(true);
  const { user: authUser, profile, saveSession, loadSessions, getIdToken } = useAuth();

  // #22 Night Oracle auto-detection (midnight–5am)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      setNightMode(true);
    }
  }, []);

  // Handle viewing a past session (read-only mode)
  useEffect(() => {
    if (viewSession) {
      setMessages(viewSession.messages as Message[]);
      setDepth(viewSession.maxDepth);
    }
  }, [viewSession]);

  useEffect(() => {
    if (viewSession) return;

    const uid = authUser?.uid || localStorage.getItem("oracle_user_id") || crypto.randomUUID();
    if (!authUser) {
      localStorage.setItem("oracle_user_id", uid);
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
              setPastThread(data.messages);
              const lastDepth = data.messages[data.messages.length - 1].depth;
              if (lastDepth) setDepth(lastDepth);
              loadedFromFirebase = true;
            }
          }
        } catch (e) {
          console.error("Firebase load error", e);
        }
      }

      if (!loadedFromFirebase) {
        const local = localStorage.getItem("oracle_thread");
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
    setMessages([{ id: crypto.randomUUID(), role: "oracle", content: greeting, depth: 1 }]);
    setLastOracleText(greeting);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExit = useCallback(async () => {
    const currentMessages = messages.filter(m => !(m.role === "oracle" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
    }
    onExit();
  }, [messages, depth, saveSession, loadSessions, onExit]);

  const handleReset = useCallback(async () => {
    const currentMessages = messages.filter(m => !(m.role === "oracle" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
    }

    const greeting = "What truth are you avoiding today?";
    setMessages([{ id: crypto.randomUUID(), role: "oracle", content: greeting, depth: 1 }]);
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
    localStorage.removeItem("oracle_thread");
  }, [messages, depth, saveSession, loadSessions, userId]);

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

    try {
      const newDepth = depth + 1;

      // POST to server-side AI proxy (#4 — no client-side API keys)
      const token = await getIdToken();
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
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
        }),
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
          role: "oracle",
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
        role: "oracle",
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
        localStorage.setItem("oracle_thread", JSON.stringify(updatedThread));
      }
    } catch (error) {
      console.error("Oracle API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "oracle",
          content: "Why do you seek answers when the connection is severed?",
          depth,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, depth, profile, messages, pastThread, nightMode, steerMusic, triggerBreakthrough, userId, getIdToken]);

  // Voice transcript handler
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const displayMessages = nightMode ? messages.slice(-2) : messages;

  return (
    <motion.div
      className={`relative z-10 w-full ${nightMode ? "max-w-xl" : "max-w-3xl"} h-[100dvh] flex flex-col ${nightMode ? "py-6 px-4" : "py-12 px-6"} transition-all duration-1000 mx-auto ${isBreakthrough ? "bg-void/50" : ""} ${nightMode ? "bg-[#020104]" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      role="region"
      aria-label="Oracle session"
    >
      <BreakthroughVisual imageUrl={currentVisual} isActive={isBreakthrough} />

      <div className="relative z-10 flex flex-col h-full w-full min-h-0">
        <SessionHeader
          depth={depth}
          nightMode={nightMode}
          isViewingPast={!!viewSession}
          viewSessionDate={viewSession?.createdAt}
          onToggleNight={() => setNightMode(!nightMode)}
          onRestart={() => setShowResetConfirm(true)}
          onExit={viewSession ? onExit : handleExit}
        />

        {/* Feature Status + Session Tools */}
        {!viewSession && !nightMode && (
          <div className="flex items-center justify-between mb-4">
            <FeatureStatus
              pastThreadLength={pastThread.length}
              depth={depth}
              isBreakthrough={isBreakthrough}
            />
            <div className="flex items-center gap-2">
              <VoiceOracle
                onTranscript={handleVoiceTranscript}
                oracleText={lastOracleText}
                enabled={profile?.tier !== "free"}
              />
              <SessionExport messages={messages} depth={depth} />
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
    </motion.div>
  );
}
