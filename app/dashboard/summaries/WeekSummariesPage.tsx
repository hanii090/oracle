'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Stars } from '@/components/Stars';
import { BookIcon, ChevronIcon } from '@/components/icons';

interface Client {
  id: string;
  displayName: string;
}

interface WeekSummary {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  themes: string[];
  emotionalTrend: string;
  keyInsights: string[];
  moodTrend: string | null;
  createdAt: string;
}

export function WeekSummariesPage() {
  const { user, isTherapist, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [summaries, setSummaries] = useState<WeekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  const loadSummaries = useCallback(async (clientId: string) => {
    setLoadingSummaries(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/week-summary?clientId=${clientId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries || []);
      }
    } catch (e) {
      console.error('Failed to load summaries:', e);
    } finally {
      setLoadingSummaries(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (!authLoading && user && !isTherapist) {
      router.push('/');
      return;
    }
    if (user && isTherapist) {
      loadClients();
    }
  }, [user, isTherapist, authLoading, router, loadClients]);

  useEffect(() => {
    if (selectedClient) {
      loadSummaries(selectedClient.id);
    }
  }, [selectedClient, loadSummaries]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookIcon size={24} className="text-blue-400" />
            <div>
              <h1 className="font-cinzel text-2xl text-text-main">Week Summaries</h1>
              <p className="text-sm text-text-muted">AI-generated weekly reflections for your clients</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
          >
            ← Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="font-cinzel text-xs text-text-muted tracking-widest uppercase mb-4">
                Clients
              </h2>
              {clients.length === 0 ? (
                <p className="text-sm text-text-muted">No clients with summary consent</p>
              ) : (
                <div className="space-y-2">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedClient?.id === client.id
                          ? 'bg-blue-500/10 border border-blue-500/50'
                          : 'bg-raised border border-border hover:border-blue-500/30'
                      }`}
                    >
                      <div className="font-cinzel text-sm text-text-main">
                        {client.displayName}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summaries */}
          <div className="lg:col-span-3">
            {!selectedClient ? (
              <div className="bg-surface border border-border rounded-lg p-12 text-center">
                <BookIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                <p className="text-sm text-text-muted">Select a client to view their week summaries</p>
              </div>
            ) : loadingSummaries ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : summaries.length === 0 ? (
              <div className="bg-surface border border-border rounded-lg p-12 text-center">
                <BookIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                <h3 className="font-cinzel text-sm text-text-main mb-2">No summaries yet</h3>
                <p className="text-xs text-text-muted">
                  Summaries are generated weekly based on {selectedClient.displayName}'s sessions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map(summary => (
                  <motion.div
                    key={summary.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === summary.id ? null : summary.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-raised transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-cinzel text-sm text-text-main">
                          {formatWeekRange(summary.weekStart, summary.weekEnd)}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {summary.themes.slice(0, 3).map((theme, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                              {theme}
                            </span>
                          ))}
                          {summary.moodTrend && (
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              summary.moodTrend === 'improving' ? 'bg-emerald-500/10 text-emerald-400' :
                              summary.moodTrend === 'declining' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {summary.moodTrend}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronIcon 
                        size={20} 
                        direction={expandedId === summary.id ? 'down' : 'right'}
                        className="text-text-muted"
                      />
                    </button>

                    {expandedId === summary.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border p-4 space-y-4"
                      >
                        <div>
                          <h4 className="text-[10px] font-cinzel text-text-muted tracking-widest uppercase mb-2">
                            Summary
                          </h4>
                          <p className="text-sm text-text-mid leading-relaxed">
                            {summary.summary}
                          </p>
                        </div>

                        {summary.keyInsights && summary.keyInsights.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-cinzel text-text-muted tracking-widest uppercase mb-2">
                              Key Insights
                            </h4>
                            <ul className="space-y-2">
                              {summary.keyInsights.map((insight, i) => (
                                <li key={i} className="flex gap-2 text-sm text-text-mid">
                                  <span className="text-blue-400">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2 text-[10px] text-text-muted">
                          Generated {formatDate(summary.createdAt)}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
