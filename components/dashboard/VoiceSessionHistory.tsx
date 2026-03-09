'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Mic, Clock, TrendingUp, TrendingDown, Minus, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { getVoiceUsageStatus, formatVoiceUsage, getUpgradeSuggestion } from '@/lib/voice-usage';
import type { Tier } from '@/hooks/useAuth';

interface VoiceSession {
  id: string;
  sessionId: string;
  durationMs: number;
  durationMinutes: number;
  therapyMode: string;
  moodBefore: number | null;
  moodAfter: number | null;
  messageCount: number;
  createdAt: string;
  hasRiskContent: boolean;
  transcript?: Array<{ role: string; content: string; timestamp: number }>;
}

interface VoiceSessionHistoryProps {
  getIdToken: () => Promise<string | null>;
  tier: string;
}

export function VoiceSessionHistory({ getIdToken, tier }: VoiceSessionHistoryProps) {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [usage, setUsage] = useState<{ minutesUsed: number; sessionCount: number }>({ minutesUsed: 0, sessionCount: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/voice-session?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setUsage(data.usage || { minutesUsed: 0, sessionCount: 0 });
      }
    } catch (err) {
      console.error('Failed to load voice sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const usageStatus = getVoiceUsageStatus(tier as Tier, usage.minutesUsed);
  const upgradeSuggestion = getUpgradeSuggestion(tier as Tier, usage.minutesUsed);

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-raised border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-light text-amber-400">{usage.sessionCount}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Sessions</p>
        </div>
        <div className="bg-raised border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-light text-amber-400">{usage.minutesUsed}m</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Minutes Used</p>
        </div>
        <div className="bg-raised border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-light text-amber-400">
            {usageStatus.minutesRemaining !== null ? `${usageStatus.minutesRemaining}m` : '∞'}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Remaining</p>
        </div>
      </div>

      {/* Usage progress bar */}
      {usageStatus.minutesLimit !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>{formatVoiceUsage(usageStatus)}</span>
            <span>{Math.round(usageStatus.percentUsed)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${usageStatus.percentUsed > 80 ? 'bg-red-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, usageStatus.percentUsed)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {upgradeSuggestion && (
            <p className="text-[10px] text-amber-500/60">{upgradeSuggestion}</p>
          )}
        </div>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 mx-auto mb-4 text-text-muted/30" />
          <p className="text-sm text-text-muted">No voice sessions yet</p>
          <p className="text-xs text-text-muted/60 mt-1">Start a voice session to talk with Sorca in real-time</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-cinzel text-xs text-text-muted tracking-widest uppercase">Recent Sessions</h3>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-raised border border-border rounded-xl overflow-hidden hover:border-amber-500/20 transition-colors"
            >
              <button
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                className="w-full p-4 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-900/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-main capitalize">{session.therapyMode}</span>
                      {session.hasRiskContent && (
                        <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[9px] rounded">⚠️ Risk</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(session.durationMs)}
                      </span>
                      <span className="text-[10px] text-text-muted">{session.messageCount} exchanges</span>
                      <span className="text-[10px] text-text-muted">{formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mood change */}
                  {session.moodBefore !== null && session.moodAfter !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-text-muted">{session.moodBefore}</span>
                      <span className="text-text-muted/50">→</span>
                      <span className={
                        session.moodAfter > session.moodBefore ? 'text-emerald-400' :
                        session.moodAfter < session.moodBefore ? 'text-red-400' : 'text-text-muted'
                      }>
                        {session.moodAfter}
                      </span>
                      {session.moodAfter > session.moodBefore && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      {session.moodAfter < session.moodBefore && <TrendingDown className="w-3 h-3 text-red-400" />}
                      {session.moodAfter === session.moodBefore && <Minus className="w-3 h-3 text-text-muted" />}
                    </div>
                  )}
                  {expandedId === session.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded transcript preview */}
              {expandedId === session.id && session.transcript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                    {session.transcript.map((entry, i) => (
                      <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                          entry.role === 'user'
                            ? 'bg-emerald-900/20 text-emerald-200/80'
                            : 'bg-amber-900/10 text-amber-200/70 italic'
                        }`}>
                          {entry.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
