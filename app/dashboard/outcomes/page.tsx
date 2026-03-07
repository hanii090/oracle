'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { getPHQ9Severity, getGAD7Severity, IAPT_THRESHOLDS } from '@/lib/iapt-dataset';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface OutcomeMeasure {
  id: string;
  userId: string;
  type: 'PHQ9' | 'GAD7' | 'WSAS';
  scores: number[];
  total: number;
  severity: string;
  timestamp: string;
  isInitial: boolean;
}

interface ClientOutcomes {
  client: Client;
  measures: OutcomeMeasure[];
  recovery?: {
    recovered: boolean;
    reliablyImproved: boolean;
    reliablyDeteriorated: boolean;
  };
}

export default function OutcomesDashboardPage() {
  const { user, loading, getIdToken, isTherapist } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOutcomes, setClientOutcomes] = useState<ClientOutcomes | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);

  // Practice-wide stats
  const [practiceStats, setPracticeStats] = useState<{
    totalClients: number;
    recoveryRate: number;
    reliableImprovementRate: number;
    averagePHQ9Change: number;
    averageGAD7Change: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isTherapist) {
      router.push('/user-dashboard');
    }
  }, [user, loading, isTherapist, router]);

  const loadClients = useCallback(async () => {
    if (!user) return;
    setLoadingClients(true);
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
      setLoadingClients(false);
    }
  }, [user, getIdToken]);

  const loadClientOutcomes = useCallback(async (clientId: string) => {
    if (!user) return;
    setLoadingOutcomes(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/outcome-measures?clientId=${clientId}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const client = clients.find(c => c.id === clientId);
        if (client) {
          setClientOutcomes({
            client,
            measures: data.measures || [],
            recovery: data.recovery,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load outcomes:', e);
    } finally {
      setLoadingOutcomes(false);
    }
  }, [user, getIdToken, clients]);

  useEffect(() => {
    if (user && isTherapist) {
      loadClients();
    }
  }, [user, isTherapist, loadClients]);

  useEffect(() => {
    if (selectedClient) {
      loadClientOutcomes(selectedClient.id);
    }
  }, [selectedClient, loadClientOutcomes]);

  // Calculate practice-wide stats
  useEffect(() => {
    // This would ideally come from a dedicated API endpoint
    // For now, we'll show placeholder stats
    if (clients.length > 0) {
      setPracticeStats({
        totalClients: clients.length,
        recoveryRate: 52, // Placeholder - would calculate from actual data
        reliableImprovementRate: 68,
        averagePHQ9Change: -4.2,
        averageGAD7Change: -3.8,
      });
    }
  }, [clients]);

  const renderScoreChart = (measures: OutcomeMeasure[], type: 'PHQ9' | 'GAD7') => {
    const filtered = measures
      .filter(m => m.type === type)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-text-muted text-sm">
          No {type} data recorded
        </div>
      );
    }

    const maxScore = type === 'PHQ9' ? 27 : 21;
    const caseness = type === 'PHQ9' ? IAPT_THRESHOLDS.PHQ9_CASENESS : IAPT_THRESHOLDS.GAD7_CASENESS;
    const color = type === 'PHQ9' ? 'blue' : 'violet';

    return (
      <div className="relative h-48">
        {/* Caseness threshold line */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-editorial-gold/50"
          style={{ bottom: `${(caseness / maxScore) * 100}%` }}
        >
          <span className="absolute right-0 -top-3 text-[9px] text-editorial-gold">
            Clinical threshold ({caseness})
          </span>
        </div>

        {/* Chart */}
        <div className="flex items-end justify-between h-full gap-2 pt-6">
          {filtered.map((measure, i) => {
            const height = (measure.total / maxScore) * 100;
            const isAboveCaseness = measure.total >= caseness;
            
            return (
              <div key={measure.id} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all ${
                    isAboveCaseness 
                      ? `bg-${color}-500` 
                      : `bg-${color}-500/50`
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${measure.total} - ${measure.severity}`}
                />
                <div className="text-[9px] text-text-muted mt-1 text-center">
                  {new Date(measure.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading || loadingClients) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/dashboard" className="text-xs text-text-muted hover:text-teal mb-2 inline-block">
              ← Back to Dashboard
            </a>
            <h1 className="font-cinzel text-2xl text-text-main">Outcome Measures</h1>
            <p className="text-sm text-text-muted">Track PHQ-9 and GAD-7 scores across your practice</p>
          </div>
        </div>

        {/* Practice Stats */}
        {practiceStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-surface border border-border rounded-lg p-4 text-center">
              <div className="font-cinzel text-2xl text-teal">{practiceStats.totalClients}</div>
              <div className="text-xs text-text-muted">Active Clients</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 text-center">
              <div className="font-cinzel text-2xl text-teal">{practiceStats.recoveryRate}%</div>
              <div className="text-xs text-text-muted">Recovery Rate</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 text-center">
              <div className="font-cinzel text-2xl text-violet">{practiceStats.reliableImprovementRate}%</div>
              <div className="text-xs text-text-muted">Reliable Improvement</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 text-center">
              <div className="font-cinzel text-2xl text-violet">{practiceStats.averagePHQ9Change}</div>
              <div className="text-xs text-text-muted">Avg PHQ-9 Change</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 text-center">
              <div className="font-cinzel text-2xl text-violet">{practiceStats.averageGAD7Change}</div>
              <div className="text-xs text-text-muted">Avg GAD-7 Change</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="font-cinzel text-sm text-text-main mb-4">Clients</h2>
            <div className="space-y-2">
              {clients.length === 0 ? (
                <p className="text-sm text-text-muted">No clients with outcome data</p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-teal/10 border border-teal/30'
                        : 'hover:bg-raised border border-transparent'
                    }`}
                  >
                    <div className="font-cinzel text-sm text-text-main">{client.name}</div>
                    <div className="text-xs text-text-muted">{client.email}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Client Outcomes */}
          <div className="lg:col-span-3">
            {!selectedClient ? (
              <div className="bg-surface border border-border rounded-lg p-12 text-center">
                <p className="text-text-muted">Select a client to view their outcome measures</p>
              </div>
            ) : loadingOutcomes ? (
              <div className="bg-surface border border-border rounded-lg p-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientOutcomes ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Client Header */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-cinzel text-lg text-text-main">{clientOutcomes.client.name}</h2>
                      <p className="text-sm text-text-muted">{clientOutcomes.client.email}</p>
                    </div>
                    {clientOutcomes.recovery && (
                      <div className={`px-4 py-2 rounded-lg ${
                        clientOutcomes.recovery.recovered
                          ? 'bg-teal/10 border border-teal/30'
                          : clientOutcomes.recovery.reliablyImproved
                          ? 'bg-violet/10 border border-violet/30'
                          : clientOutcomes.recovery.reliablyDeteriorated
                          ? 'bg-crimson/10 border border-crimson/30'
                          : 'bg-editorial-gold/10 border border-editorial-gold/30'
                      }`}>
                        <span className={`text-sm font-cinzel ${
                          clientOutcomes.recovery.recovered
                            ? 'text-teal'
                            : clientOutcomes.recovery.reliablyImproved
                            ? 'text-violet'
                            : clientOutcomes.recovery.reliablyDeteriorated
                            ? 'text-crimson'
                            : 'text-editorial-gold'
                        }`}>
                          {clientOutcomes.recovery.recovered
                            ? '✓ Recovered'
                            : clientOutcomes.recovery.reliablyImproved
                            ? '↑ Reliably Improved'
                            : clientOutcomes.recovery.reliablyDeteriorated
                            ? '↓ Deteriorated'
                            : '→ No Reliable Change'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PHQ-9 Chart */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-cinzel text-sm text-violet">PHQ-9 (Depression)</h3>
                      <p className="text-xs text-text-muted">Patient Health Questionnaire</p>
                    </div>
                    {clientOutcomes.measures.filter(m => m.type === 'PHQ9').length > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-cinzel text-violet">
                          {clientOutcomes.measures.filter(m => m.type === 'PHQ9')[0]?.total}
                        </div>
                        <div className="text-xs text-text-muted">
                          {clientOutcomes.measures.filter(m => m.type === 'PHQ9')[0]?.severity}
                        </div>
                      </div>
                    )}
                  </div>
                  {renderScoreChart(clientOutcomes.measures, 'PHQ9')}
                </div>

                {/* GAD-7 Chart */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-cinzel text-sm text-violet">GAD-7 (Anxiety)</h3>
                      <p className="text-xs text-text-muted">Generalised Anxiety Disorder Scale</p>
                    </div>
                    {clientOutcomes.measures.filter(m => m.type === 'GAD7').length > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-cinzel text-violet">
                          {clientOutcomes.measures.filter(m => m.type === 'GAD7')[0]?.total}
                        </div>
                        <div className="text-xs text-text-muted">
                          {clientOutcomes.measures.filter(m => m.type === 'GAD7')[0]?.severity}
                        </div>
                      </div>
                    )}
                  </div>
                  {renderScoreChart(clientOutcomes.measures, 'GAD7')}
                </div>

                {/* Score History Table */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="font-cinzel text-sm text-text-main mb-4">Score History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-text-muted font-normal">Date</th>
                          <th className="text-left py-2 text-text-muted font-normal">Measure</th>
                          <th className="text-left py-2 text-text-muted font-normal">Score</th>
                          <th className="text-left py-2 text-text-muted font-normal">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientOutcomes.measures.map((measure) => (
                          <tr key={measure.id} className="border-b border-border/50">
                            <td className="py-2 text-text-mid">
                              {new Date(measure.timestamp).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                measure.type === 'PHQ9' 
                                  ? 'bg-violet/10 text-violet' 
                                  : 'bg-violet/10 text-violet'
                              }`}>
                                {measure.type}
                              </span>
                            </td>
                            <td className="py-2 text-text-main font-cinzel">{measure.total}</td>
                            <td className="py-2 text-text-mid">{measure.severity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-surface border border-border rounded-lg p-12 text-center">
                <p className="text-text-muted">No outcome data for this client</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
