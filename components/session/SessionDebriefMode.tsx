'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useTherapy } from '@/hooks/useTherapy';

interface DebriefMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SessionDebriefModeProps {
  onClose: () => void;
  onComplete: (keyInsight: string) => void;
}

export function SessionDebriefMode({ onClose, onComplete }: SessionDebriefModeProps) {
  const { getIdToken } = useAuth();
  const { therapyProfile } = useTherapy();
  const [messages, setMessages] = useState<DebriefMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start with the opening question
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: "What's the one thing you heard today that you don't want to forget?"
    }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await getIdToken();
      const response = await fetch('/api/session-debrief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          debriefHistory: messages,
          therapySessionDate: therapyProfile?.nextSessionDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.question }]);
      
      if (data.isClosing) {
        setIsClosing(true);
        // Extract the key insight (user's first substantive response)
        const keyInsight = messages.find(m => m.role === 'user')?.content || userMessage;
        setTimeout(() => onComplete(keyInsight), 3000);
      }
    } catch (error) {
      console.error('Debrief error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Let's hold onto what you shared. This matters." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/98 flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <span className="text-teal-400" aria-hidden="true">🛋️</span>
            </div>
            <div>
              <h1 className="font-cinzel text-sm text-text-main tracking-wide">
                Session Debrief
              </h1>
              <p className="text-[10px] text-text-muted">
                Anchoring your therapy session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-gold transition-colors text-xs font-cinzel tracking-widest"
            aria-label="Exit debrief"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gold/10 border border-gold/30 text-text-main'
                      : 'bg-raised border border-border text-text-mid'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-raised border border-border rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gold/50 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-gold/50 rounded-full animate-pulse delay-75" />
                  <span className="w-2 h-2 bg-gold/50 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!isClosing ? (
        <div className="flex-shrink-0 border-t border-border/50 bg-surface/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share what stayed with you..."
                disabled={isLoading}
                className="flex-1 bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-t border-teal-500/30 bg-teal-900/10"
        >
          <div className="max-w-2xl mx-auto px-4 py-6 text-center">
            <p className="text-sm text-teal-400 font-cinzel tracking-wide mb-2">
              Insight Anchored
            </p>
            <p className="text-xs text-text-muted">
              This will be woven into your Thread. Returning to main session...
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function SessionDebriefPrompt({ 
  onStart, 
  onDismiss 
}: { 
  onStart: () => void; 
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md mx-4"
    >
      <div className="bg-surface border border-teal-500/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">🛋️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel text-sm text-teal-400 tracking-wide mb-1">
              Just back from therapy?
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-3">
              Let&apos;s anchor the most important thing before it fades. 
              This takes 2-3 minutes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onStart}
                className="px-4 py-2 bg-teal-500/20 border border-teal-500/50 text-teal-400 font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-teal-500/30 transition-colors"
              >
                Start Debrief
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-text-muted font-cinzel text-[10px] tracking-widest uppercase hover:text-text-mid transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
