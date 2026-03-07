'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Message, EmotionData } from './ChatMessage';

interface SessionInsightsCardProps {
  messages: Message[];
  depth: number;
  onClose: () => void;
  onExit: () => void;
}

interface SessionInsight {
  emotionalArc: string[];
  dominantEmotion: string;
  avoidanceTopics: string[];
  breakthroughMoments: number;
  distressPeaks: number;
  modalitiesUsed: string[];
  sessionDepth: number;
  exchangeCount: number;
}

function analyzeSession(messages: Message[]): SessionInsight {
  const sorcaMessages = messages.filter(m => m.role === 'assistant' && m.emotionData);
  const emotionCounts: Record<string, number> = {};
  const avoidanceSet = new Set<string>();
  let breakthroughs = 0;
  let distressPeaks = 0;
  const emotionalArc: string[] = [];
  const modalities = new Set<string>();

  for (const msg of sorcaMessages) {
    const ed = msg.emotionData as EmotionData;
    if (ed.primary) {
      emotionCounts[ed.primary] = (emotionCounts[ed.primary] || 0) + 1;
      emotionalArc.push(ed.primary);
    }
    if (ed.avoidance) {
      ed.avoidance.forEach(a => avoidanceSet.add(a));
    }
    if (ed.breakthrough && ed.breakthrough > 0.5) {
      breakthroughs++;
    }
    if (ed.breakdownRisk && ed.breakdownRisk > 0.5) {
      distressPeaks++;
    }
    if (msg.modalityId) {
      modalities.add(msg.modalityId);
    }
  }

  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  return {
    emotionalArc,
    dominantEmotion,
    avoidanceTopics: Array.from(avoidanceSet),
    breakthroughMoments: breakthroughs,
    distressPeaks,
    modalitiesUsed: Array.from(modalities),
    sessionDepth: messages[messages.length - 1]?.depth || 0,
    exchangeCount: messages.filter(m => m.role === 'user').length,
  };
}

export function SessionInsightsCard({ messages, depth, onClose, onExit }: SessionInsightsCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const insights = analyzeSession(messages);
  const hasEmotionData = messages.some(m => m.emotionData?.primary);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cinzel text-lg text-gold tracking-wider">Session Insights</h2>
          <button
            onClick={() => { setDismissed(true); onExit(); }}
            className="text-text-muted hover:text-text-main text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-raised border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-cinzel text-gold">{insights.sessionDepth}</div>
            <div className="text-[9px] text-text-muted font-courier tracking-wider">DEPTH</div>
          </div>
          <div className="bg-raised border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-cinzel text-text-main">{insights.exchangeCount}</div>
            <div className="text-[9px] text-text-muted font-courier tracking-wider">EXCHANGES</div>
          </div>
          <div className="bg-raised border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-cinzel text-emerald-400">{insights.breakthroughMoments}</div>
            <div className="text-[9px] text-text-muted font-courier tracking-wider">BREAKTHROUGHS</div>
          </div>
        </div>

        {hasEmotionData && (
          <>
            {/* Emotional Arc */}
            {insights.emotionalArc.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[10px] text-text-muted font-courier tracking-wider uppercase mb-2">Emotional Journey</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  {insights.emotionalArc.map((emotion, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-xs text-text-mid font-cormorant italic">{emotion}</span>
                      {i < insights.emotionalArc.length - 1 && (
                        <span className="text-text-muted/40 text-[8px]">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dominant Emotion */}
            <div className="mb-4">
              <h3 className="text-[10px] text-text-muted font-courier tracking-wider uppercase mb-2">Dominant Theme</h3>
              <p className="text-sm text-text-main font-cormorant italic capitalize">{insights.dominantEmotion}</p>
            </div>

            {/* Avoidance */}
            {insights.avoidanceTopics.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[10px] text-text-muted font-courier tracking-wider uppercase mb-2">Avoidance Detected</h3>
                <div className="flex flex-wrap gap-1.5">
                  {insights.avoidanceTopics.map((topic, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] text-text-muted mt-1.5">Consider exploring these in your next session.</p>
              </div>
            )}

            {/* Distress Warning */}
            {insights.distressPeaks > 0 && (
              <div className="mb-4 p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-400">
                  {insights.distressPeaks} moment{insights.distressPeaks > 1 ? 's' : ''} of elevated distress detected.
                  {' '}Remember: Samaritans <strong>116 123</strong> (24/7, free).
                </p>
              </div>
            )}
          </>
        )}

        {!hasEmotionData && (
          <div className="mb-4 p-3 bg-surface border border-border rounded-lg">
            <p className="text-xs text-text-muted text-center font-cormorant italic">
              Session insights become richer with paid tiers, which include emotion analysis.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setDismissed(true); onExit(); }}
            className="flex-1 py-3 bg-gold text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/80 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
