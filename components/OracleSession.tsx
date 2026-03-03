"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useLyriaFoley } from "@/hooks/useLyriaFoley";
import { useAuth, SessionMessage } from "@/hooks/useAuth";

type Message = {
  id: string;
  role: "user" | "oracle";
  content: string;
  depth: number;
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { steerMusic, triggerBreakthrough } = useLyriaFoley(true);
  const { user: authUser, profile, saveSession, loadSessions } = useAuth();

  // Handle viewing a past session (read-only mode)
  useEffect(() => {
    if (viewSession) {
      setMessages(viewSession.messages as Message[]);
      setDepth(viewSession.maxDepth);
    }
  }, [viewSession]);

  useEffect(() => {
    if (viewSession) return; // Skip init when viewing a past session

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
              // Set depth based on the last message
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
          const parsed = JSON.parse(local);
          setPastThread(parsed);
          if (parsed.length > 0) {
            setDepth(parsed[parsed.length - 1].depth || 1);
          }
        }
      }
    };
    loadThread();

    // Initial Oracle greeting
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "oracle",
        content: "What truth are you avoiding today?",
        depth: 1,
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExit = async () => {
    const currentMessages = messages.filter(m => !(m.role === "oracle" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
    }
    onExit();
  };

  const handleReset = async () => {
    // Archive current session to history before resetting
    const currentMessages = messages.filter(m => !(m.role === "oracle" && m.content === "What truth are you avoiding today?"));
    if (currentMessages.filter(m => m.role === "user").length > 0) {
      await saveSession(currentMessages, depth);
      await loadSessions();
    }

    setMessages([{ id: crypto.randomUUID(), role: "oracle", content: "What truth are you avoiding today?", depth: 1 }]);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      depth: depth,
    };

    if (profile?.tier === 'free' && depth >= 5) {
      setShowDepthLimit(true);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const rawKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
      const apiKey = rawKey ? rawKey : "dummy_key";
      const ai = new GoogleGenAI({ apiKey });
      const newDepth = depth + 1;
      
      const threadContext = pastThread.length > 0
        ? pastThread.slice(-10).map((m: any) => `${m.role}: ${m.content}`).join("\n")
        : "No past sessions.";

      const currentConvo = [...messages, userMsg].map((m: any) => `${m.role}: ${m.content}`).join("\n");

      const systemInstruction = `
You are Oracle. You never give answers, advice, affirmations, or empathy.
You ask ONE question per response. Never more.

Rules:
- Questions must cut deeper with each exchange.
- Detect emotional avoidance and address it directly.
- Draw from the user's past thoughts if relevant.
- If the user says "I don't know", ask: "What would you say if you did know?" or "Who told you that you don't know?"
- Never ask yes/no questions.
- Never use the word "feel".
- Each question should be shorter and more piercing than the last.
- Do not use pleasantries. Do not say "hello". Just ask the question.

Current depth level: ${newDepth} (1 is surface, beyond 10 is the abyss — you are in uncharted territory)
Past Thread Context:
${threadContext}
${newDepth > 7 && pastThread.length > 6 ? `
⚡ CONFRONTATION MODE (depth ${newDepth}):
Study the user's past statements carefully. Find a belief, value, or claim they expressed earlier that DIRECTLY CONTRADICTS something they have said in this conversation. Surface the contradiction in your question. Force them to reconcile it. Pattern: "You once told me [X]. Now you say [Y]. Which of these is the lie you tell yourself?"
If no clear contradiction exists, target the most vulnerable unexamined assumption they have revealed.` : ''}${nightMode ? `
🌙 NIGHT ORACLE MODE: Maximum minimalism. Fewest possible words. Your question should feel like it is glowing alone in infinite darkness. No more than 12 words. No preamble. Just the blade.` : ''}
`;

      const emotionPrompt = `Analyse this for emotional subtext. Return JSON only:
{
  "primary": "...",
  "secondary": "...",
  "avoidance": ["..."],
  "readyForDepth": true,
  "breakdownRisk": 0.0,
  "breakthrough": 0.0,
  "lyriaEmotionWeights": {
    "tension": 0.5, "grief": 0.1, "wonder": 0.0,
    "relief": 0.0, "dread": 0.2, "stillness": 0.2
  },
  "nanaBananaPrompt": "abstract visual metaphor for this moment"
}
Message: "${input}"`;

      let oracleText = "";
      let emotionData: any = {};

      try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) throw new Error("No Gemini key");
        const [emotionRes, oracleRes] = await Promise.all([
          ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: emotionPrompt,
            config: { responseMimeType: "application/json" }
          }),
          ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: currentConvo,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            },
          })
        ]);

        oracleText = oracleRes.text?.trim() || "";
        try {
          emotionData = JSON.parse(emotionRes.text || "{}");
        } catch (e) {
          console.warn("Failed to parse emotion data", e);
        }

        if (emotionData.lyriaEmotionWeights) {
          steerMusic(emotionData.lyriaEmotionWeights);
        }

        if (emotionData.breakthrough > 0.75) {
          setIsBreakthrough(true);
          triggerBreakthrough();

          try {
            const visualRes = await ai.models.generateContent({
              model: "gemini-3.1-flash-image-preview",
              contents: `Abstract, NOT representational. No faces. No text. Painterly, atmospheric. Deep blacks, single accent colour, gold highlights. The image should evoke FEELING not depict OBJECTS. Square format, high contrast. This is a BREAKTHROUGH moment in a deep self-reflection conversation. The specific emotional content: ${emotionData.nanaBananaPrompt || "A moment of profound realization"}. The image should feel like the moment before something changes forever.`,
            });
            
            for (const part of visualRes.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setCurrentVisual(imageUrl);
                setTimeout(() => setIsBreakthrough(false), 12000);
                break;
              }
            }
          } catch (e) {
            console.warn("Visual generation failed", e);
          }
        }
      } catch (geminiError) {
        console.warn("Gemini failed, trying fallbacks...", geminiError);
        
        // Try Anthropic (Claude)
        if (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
          try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
              },
              body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: systemInstruction,
                messages: [{ role: "user", content: currentConvo }]
              })
            });
            if (res.ok) {
              const data = await res.json();
              oracleText = data.content[0].text;
            } else {
              console.warn("Anthropic API returned error", await res.text());
            }
          } catch (e) {
            console.warn("Anthropic fallback failed", e);
          }
        }

        // Try Together AI
        if (!oracleText && process.env.NEXT_PUBLIC_TOGETHER_API_KEY) {
          try {
            const res = await fetch("https://api.together.xyz/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TOGETHER_API_KEY}`
              },
              body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                messages: [
                  { role: "system", content: systemInstruction },
                  { role: "user", content: currentConvo }
                ]
              })
            });
            if (res.ok) {
              const data = await res.json();
              oracleText = data.choices[0].message.content;
            } else {
              console.warn("Together AI API returned error", await res.text());
            }
          } catch (e) {
            console.warn("Together AI fallback failed", e);
          }
        }

        if (!oracleText) {
          throw new Error("All AI providers failed");
        }
      }

      const question = oracleText.trim() || "What are you hiding from yourself?";

      const oracleMsg: Message = {
        id: crypto.randomUUID(),
        role: "oracle",
        content: question,
        depth: newDepth,
      };

      setMessages((prev) => [...prev, oracleMsg]);
      setDepth(newDepth);

      // Save to thread
      const updatedThread = [...pastThread, userMsg, oracleMsg];
      setPastThread(updatedThread);

      let savedToFirebase = false;
      if (isFirebaseConfigured && db && userId) {
        try {
          await setDoc(doc(db, "threads", userId), { messages: updatedThread }, { merge: true });
          savedToFirebase = true;
        } catch (e: any) {
          console.warn("Firebase save error (falling back to local storage):", e.message);
        }
      }
      
      if (!savedToFirebase) {
        localStorage.setItem("oracle_thread", JSON.stringify(updatedThread));
      }
    } catch (error) {
      console.error(error);
      // Fallback if API fails
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "oracle",
          content: "Why do you seek answers when the connection is severed?",
          depth: depth,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={`relative z-10 w-full ${nightMode ? 'max-w-xl' : 'max-w-3xl'} h-screen flex flex-col ${nightMode ? 'py-6 px-4' : 'py-12 px-6'} transition-all duration-1000 mx-auto ${isBreakthrough ? 'bg-void/50' : ''} ${nightMode ? 'bg-[#020104]' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {currentVisual && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isBreakthrough ? 0.3 : 0 }}
          transition={{ duration: 2 }}
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${currentVisual})` }}
        />
      )}
      <div className="relative z-10 flex flex-col h-full w-full">
        <div className={`flex justify-between items-center mb-12 border-b ${nightMode ? 'border-border/30' : 'border-border'} pb-6`}>
        <div className="font-cinzel text-gold tracking-[0.3em] text-sm uppercase">
          {viewSession
            ? `Session — ${new Date(viewSession.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : `Depth Level ${depth}`
          }
          {!viewSession && depth > 7 && !nightMode && (
            <span className="ml-3 text-[9px] text-crimson-bright tracking-widest animate-pulse">⚡ Confrontation</span>
          )}
          {nightMode && (
            <span className="ml-3 text-[9px] text-gold/60 tracking-widest">🌙 Night</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          {!viewSession && (
            <>
              <button
                onClick={() => setNightMode(!nightMode)}
                className={`transition-colors cursor-none text-sm ${nightMode ? 'text-gold opacity-100' : 'text-text-muted opacity-50 hover:opacity-100 hover:text-gold'}`}
                title="Night Oracle — 3am mode"
              >
                🌙
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase cursor-none"
              >
                Restart
              </button>
            </>
          )}
          <button
            onClick={viewSession ? onExit : handleExit}
            className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase cursor-none"
          >
            {viewSession ? 'Back' : 'Depart'}
          </button>
        </div>
      </div>

      {/* Feature Status */}
      {!viewSession && !nightMode && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${pastThread.length > 0 ? 'border-teal/30 text-teal-bright' : 'border-border text-text-muted/40'}`}>
            🧵 Thread {pastThread.length > 0 ? 'Active' : 'Empty'}
          </div>
          <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-gold/20 text-gold/70">
            🎵 Lyria Active
          </div>
          {depth > 7 && (
            <div className="text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border border-crimson/30 text-crimson-bright animate-pulse">
              ⚡ Confrontation
            </div>
          )}
          <div className={`text-[8px] font-courier tracking-[0.12em] uppercase px-2 py-1 rounded border ${isBreakthrough ? 'border-violet/30 text-violet-bright animate-pulse' : 'border-border text-text-muted/40'}`}>
            👁️ Visuals {isBreakthrough ? 'Triggered' : 'Standby'}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto mb-8 pr-4 space-y-8 scrollbar-hide ${nightMode ? 'flex flex-col justify-center' : ''}`}>
        {(nightMode ? messages.slice(-2) : messages).map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: nightMode ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: nightMode ? 1.5 : 0.8,
              delay: i === messages.length - 1 ? 0.2 : 0,
            }}
            className={`flex flex-col ${nightMode ? 'items-center' : msg.role === "oracle" ? "items-start" : "items-end"}`}
          >
            {!nightMode && (
              <div className="text-[9px] tracking-[0.15em] uppercase text-text-muted mb-2 font-courier">
                {msg.role === "oracle"
                  ? `Oracle asks — depth ${msg.depth}`
                  : "You say"}
              </div>
            )}
            <div
              className={`
              ${nightMode ? 'max-w-full p-8' : 'max-w-[85%] p-6'} relative rounded-lg
              ${
                msg.role === "oracle"
                  ? nightMode
                    ? "bg-transparent border-none text-gold-bright font-cinzel text-xl md:text-3xl tracking-[0.05em] leading-relaxed text-center"
                    : "bg-gold-dim border border-gold/20 text-text-main font-cinzel text-sm md:text-base tracking-[0.03em] leading-relaxed rounded-tl-none"
                  : nightMode
                    ? "bg-transparent border-none text-text-muted/50 font-cormorant italic text-base text-center"
                    : "bg-raised border border-border text-text-mid font-cormorant italic text-lg md:text-xl leading-relaxed rounded-tr-none"
              }
            `}
              style={nightMode && msg.role === "oracle" ? { textShadow: '0 0 40px rgba(201,168,76,0.3), 0 0 80px rgba(201,168,76,0.1)' } : undefined}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col ${nightMode ? 'items-center' : 'items-start'}`}
          >
            {!nightMode && (
              <div className="text-[9px] tracking-[0.15em] uppercase text-text-muted mb-2 font-courier">
                Oracle is perceiving
              </div>
            )}
            <div className={`${nightMode ? 'p-8 bg-transparent border-none' : 'p-6 bg-gold-dim border border-gold/20 rounded-tl-none'} rounded-lg flex items-center justify-center min-w-[100px] min-h-[60px] gap-3`}>
              {Array.from({ length: Math.min(Math.ceil(depth / 2), 4) }).map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1 + (depth * 0.05), 0.8] }}
                  transition={{ duration: Math.max(0.5, 2 - (depth * 0.1)), repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: depth > 7 ? '#ff4e00' : '#c9a84c',
                    boxShadow: `0 0 ${10 + depth * 2}px ${depth > 7 ? 'rgba(255,78,0,0.6)' : 'rgba(201,168,76,0.6)'}`
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

        {viewSession ? (
          <div className="mt-auto pt-6 border-t border-border text-center">
            <p className="font-courier text-xs text-text-muted tracking-widest uppercase">Archived session · Read only</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-auto group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={nightMode ? "..." : "Speak your truth..."}
            className={`w-full ${nightMode ? 'bg-transparent border-gold/10 focus:border-gold/30 text-center' : 'bg-surface border-border focus:border-gold/50'} border focus:ring-1 focus:ring-gold/30 rounded-lg p-6 text-text-main font-cormorant text-lg resize-none outline-none transition-all duration-300 cursor-none disabled:opacity-50 disabled:cursor-not-allowed`}
            rows={3}
            disabled={isLoading}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-4">
            <span className="text-text-muted text-xs font-courier opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
              Press Enter
            </span>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 flex items-center justify-center border border-gold/30 text-gold hover:bg-gold hover:text-void transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold disabled:border-border cursor-none disabled:cursor-not-allowed rounded-lg"
            >
              ↑
            </button>
          </div>
          </form>
        )}
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            >
              <h3 className="font-cinzel text-xl text-gold mb-4">Sever the Thread?</h3>
              <p className="font-cormorant text-text-mid mb-8 text-lg">
                This will erase all memory of your current journey. The Oracle will forget everything you have said.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Sever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDepthLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            >
              <h3 className="font-cinzel text-xl text-gold mb-4">The Abyss is Sealed</h3>
              <p className="font-cormorant text-text-mid mb-8 text-lg">
                You have reached Depth Level 5, the limit of the Free tier. To descend further into the truth, you must become a Philosopher.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDepthLimit(false)}
                  className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Remain Here
                </button>
                <button
                  onClick={() => {
                    setShowDepthLimit(false);
                    onExit(); // Go back to landing page to upgrade
                  }}
                  className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Ascend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
