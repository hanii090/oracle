'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stars } from '@/components/Stars';
import { Mic, Clock, AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface VoiceSessionForReview {
  id: string;
  sessionId: string;
  userId: string;
  durationMs: number;
  durationMinutes: number;
  therapyMode: string;
  moodBefore: number | null;
  moodAfter: number | null;
  messageCount: number;
  createdAt: string;
  hasRiskContent: boolean;
  transcript: Array<{ role: string; content: string; timestamp: number }>;
}

export function VoiceReviewPage() {
  const { user, profile, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');

  const [sessions, setSessions] = useState<VoiceSessionForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('Client');

  const isTherapist = profile?.role === 'therapist' || profile?.tier === 'practice';

  const loadClientVoiceSessions = useCallback(async () => {
    if (!clientId) return;
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/therapist/voice-sessions?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setClientName(data.clientName || 'Client');
      }
    } catch (err) {
      console.error('Failed to load voice sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, getIdToken]);

  useEffect(() => {
    if (!authLoading && isTherapist) {
      loadClientVoiceSessions();
    }
  }, [authLoading, isTherapist, loadClientVoiceSessions]);

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isTherapist) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <p className="text-text-muted">Therapist access required</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl bg-surface border border-border hover:border-amber-500/30 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="font-cinzel text-xl text-text-main">Voice Sessions</h1>
            <p className="text-sm text-text-muted">{clientName} • {sessions.length} voice sessions</p>
          </div>
        </div>

        {/* Risk summary */}
        {sessions.some(s => s.hasRiskContent) && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Risk Content Detected</p>
              <p className="text-xs text-red-300/60 mt-1">
                {sessions.filter(s => s.hasRiskContent).length} session(s) contain potential risk indicators. 
                Review transcripts below for context.
              </p>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <Mic className="w-12 h-12 mx-auto mb-4 text-text-muted/30" />
            <p className="text-sm text-text-muted">No voice sessions found for this client</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-surface border rounded-xl overflow-hidden transition-colors ${
                  session.hasRiskContent ? 'border-red-500/30' : 'border-border hover:border-amber-500/20'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  className="w-full p-5 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.hasRiskContent ? 'bg-red-900/20' : 'bg-amber-900/20'
                    }`}>
                      <Mic className={`w-5 h-5 ${session.hasRiskContent ? 'text-red-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-main capitalize">{session.therapyMode} Session</span>
                        {session.hasRiskContent && (
                          <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(session.durationMs)}
                        </span>
                        <span>{session.messageCount} exchanges</span>
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {session.moodBefore !== null && session.moodAfter !== null && (
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-muted">{session.moodBefore}</span>
                          <span className="text-text-muted/50">→</span>
                          <span className={
                            session.moodAfter > session.moodBefore ? 'text-emerald-400' :
                            session.moodAfter < session.moodBefore ? 'text-red-400' : 'text-text-muted'
                          }>{session.moodAfter}</span>
                        </div>
                        <p className="text-[9px] text-text-muted">Mood</p>
                      </div>
                    )}
                    {expandedId === session.id ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded transcript */}
                {expandedId === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-border"
                  >
                    <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-cinzel text-text-muted tracking-widest uppercase">Full Transcript</h3>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted/50">
                          <Shield className="w-3 h-3" />
                          <span>Shared with client consent</span>
                        </div>
                      </div>
                      {session.transcript.map((entry, i) => (
                        <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            entry.role === 'user'
                              ? 'bg-emerald-900/15 text-emerald-200/80 border border-emerald-800/20'
                              : 'bg-amber-900/10 text-amber-200/70 border border-amber-800/10 italic'
                          }`}>
                            <p>{entry.content}</p>
                            <p className="text-[9px] text-text-muted/40 mt-1">
                              {new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
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
    </main>
  );
}
