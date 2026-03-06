'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Stars } from '@/components/Stars';
import { TherapistIcon, HomeworkIcon, BookIcon, SettingsIcon, AlertIcon, CalendarIcon, ExportIcon } from '@/components/icons';
import { PatternAlertPanel, PatternAlertBadge } from '@/components/session/PatternAlertPanel';

interface Client {
  id: string;
  displayName: string;
  email: string | null;
  nextSession: string | null;
  sessionDay: string | null;
  permissions: {
    shareWeekSummary?: boolean;
    shareHomeworkProgress?: boolean;
    sharePatternAlerts?: boolean;
    shareMoodData?: boolean;
  };
  activeHomework: number;
  homeworkCompletionRate: number | null;
  weekSummary: {
    createdAt: string;
    themes: string[];
    moodTrend: string | null;
  } | null;
  consentedAt: string;
}

interface Alert {
  id: string;
  clientId: string;
  clientName: string;
  type: 'distress' | 'pattern' | 'milestone';
  message: string;
  createdAt: string;
}

interface WeekAtGlance {
  practiceMoodTrend: string;
  moodBreakdown: { improving: number; stable: number; declining: number; fluctuating: number };
  averageHomeworkCompletion: number | null;
  topThemes: Array<{ theme: string; count: number }>;
  clientsNeedingAttention: Array<{ id: string; name: string; reason: string }>;
  totalAlerts: number;
  activeClients: number;
}

interface DashboardData {
  clients: Client[];
  totalClients: number;
  upcomingSessions: Client[];
  recentAlerts: Alert[];
  weekAtGlance?: WeekAtGlance;
}

export function TherapistDashboard() {
  const { user, profile, profileLoaded, isTherapist, loading: authLoading, getIdToken, logOut } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [sessionPrep, setSessionPrep] = useState<{ clientName: string; prepBrief: string; data: Record<string, unknown> } | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const loadSessionPrep = async (clientId: string) => {
    setPrepLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/session-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionPrep(data);
      }
    } catch (e) {
      console.error('Failed to load session prep:', e);
    } finally {
      setPrepLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Failed to load dashboard (${res.status})`);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    // Wait for auth to fully load before making redirect decisions
    if (authLoading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
    
    // Wait for profile to load before making therapist decision
    if (!profileLoaded) return;
    
    // Redirect non-therapists to user dashboard
    if (!isTherapist) {
      router.push('/user-dashboard');
      return;
    }
    
    // Load dashboard for therapists
    loadDashboard();
  }, [user, isTherapist, profileLoaded, authLoading, router, loadDashboard]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isTherapist) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="w-16 h-16 bg-crimson/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-cinzel text-xl text-text-main mb-2">Dashboard Error</h2>
          <p className="text-sm text-text-muted mb-6">{error}</p>
          <button
            onClick={() => loadDashboard()}
            className="px-6 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors font-cinzel text-xs tracking-widest uppercase"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientEmail: inviteEmail,
          clientName: inviteName || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteLink(data.invite.inviteLink);
      }
    } catch (e) {
      console.error('Failed to create invite:', e);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    setInviteLink(null);
    setInviteCopied(false);
    loadDashboard();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-2xl text-text-main mb-1">Practice Dashboard</h1>
            <p className="text-sm text-text-muted">
              {data?.totalClients || 0} active clients
            </p>
          </div>
          <div className="flex items-center gap-4">
            <PatternAlertBadge onClick={() => setShowAlertPanel(true)} />
            <a
              href="/"
              className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
            >
              ← Back to Sorca
            </a>
            <button
              onClick={async () => { await logOut(); router.push('/'); }}
              className="text-xs text-text-muted hover:text-crimson font-cinzel tracking-widest transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Week at a Glance */}
        {data?.weekAtGlance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-teal-900/20 to-violet-900/20 border border-teal-500/30 rounded-lg p-6 mb-6"
          >
            <h2 className="font-cinzel text-sm text-teal-400 tracking-wider uppercase mb-4">
              Week at a Glance
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Mood Trend */}
              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">
                  {data.weekAtGlance.practiceMoodTrend === 'improving' ? '📈' :
                   data.weekAtGlance.practiceMoodTrend === 'declining' ? '📉' :
                   data.weekAtGlance.practiceMoodTrend === 'stable' ? '➡️' : '📊'}
                </div>
                <p className="text-xs text-text-muted">Practice Mood</p>
                <p className="text-sm text-text-main capitalize">{data.weekAtGlance.practiceMoodTrend}</p>
              </div>

              {/* Homework Completion */}
              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-cinzel text-emerald-400">
                  {data.weekAtGlance.averageHomeworkCompletion ?? '—'}%
                </div>
                <p className="text-xs text-text-muted">Avg Homework</p>
              </div>

              {/* Active Clients */}
              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-cinzel text-blue-400">
                  {data.weekAtGlance.activeClients}/{data.totalClients}
                </div>
                <p className="text-xs text-text-muted">Active This Week</p>
              </div>

              {/* Alerts */}
              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-cinzel text-amber-400">
                  {data.weekAtGlance.totalAlerts}
                </div>
                <p className="text-xs text-text-muted">Alerts</p>
              </div>
            </div>

            {/* Theme Cloud & Needs Attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Themes */}
              {data.weekAtGlance.topThemes.length > 0 && (
                <div className="bg-surface/30 rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Common Themes</p>
                  <div className="flex flex-wrap gap-1">
                    {data.weekAtGlance.topThemes.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded"
                        style={{ fontSize: `${Math.max(10, 12 + t.count)}px` }}
                      >
                        {t.theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Needing Attention */}
              {data.weekAtGlance.clientsNeedingAttention.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-2">Needs Attention</p>
                  <div className="space-y-1">
                    {data.weekAtGlance.clientsNeedingAttention.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-text-main">{c.name}</span>
                        <span className="text-text-muted">{c.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upcoming Sessions & Alerts */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-lg p-6"
            >
              <h2 className="font-cinzel text-sm text-teal-400 tracking-wider uppercase mb-4">
                Upcoming Sessions
              </h2>
              {data?.upcomingSessions && data.upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingSessions.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-raised rounded-lg cursor-pointer hover:bg-gold/5 transition-colors"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div>
                        <p className="text-sm text-text-main">{client.displayName}</p>
                        <p className="text-[10px] text-text-muted">
                          {client.nextSession ? formatDate(client.nextSession) : 'Not scheduled'}
                        </p>
                      </div>
                      {client.nextSession && (
                        <span className="text-xs text-teal-400 font-cinzel">
                          {formatTime(client.nextSession)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No upcoming sessions this week</p>
              )}
            </motion.div>

            {/* Pattern Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-lg p-6"
            >
              <h2 className="font-cinzel text-sm text-amber-400 tracking-wider uppercase mb-4">
                Recent Alerts
              </h2>
              {data?.recentAlerts && data.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {data.recentAlerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-400 text-xs">
                          {alert.type === 'distress' ? '⚠️' : alert.type === 'milestone' ? '🎯' : '📊'}
                        </span>
                        <span className="text-xs text-text-main">{alert.clientName}</span>
                      </div>
                      <p className="text-[10px] text-text-muted">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No recent alerts</p>
              )}
            </motion.div>
          </div>

          {/* Right Column - Client List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-sm text-text-main tracking-wider uppercase">
                Your Clients
              </h2>
              <span className="text-xs text-text-muted">
                {data?.clients?.length || 0} with active consent
              </span>
            </div>

            {data?.clients && data.clients.length > 0 ? (
              <div className="space-y-4">
                {data.clients.map(client => (
                  <div
                    key={client.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'border-teal-500 bg-teal-900/10'
                        : 'border-border hover:border-teal-500/30'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-cinzel text-sm text-text-main">{client.displayName}</h3>
                          {client.nextSession && new Date(client.nextSession) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); loadSessionPrep(client.id); }}
                              className="text-[9px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded hover:bg-teal-500/30 transition-colors"
                            >
                              {prepLoading ? '...' : 'Session Prep'}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted mb-2">
                          Consented {new Date(client.consentedAt).toLocaleDateString()}
                        </p>

                        {/* Permissions badges */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {client.permissions.shareWeekSummary && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Summary</span>
                          )}
                          {client.permissions.shareHomeworkProgress && (
                            <span className="text-[9px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">Homework</span>
                          )}
                          {client.permissions.sharePatternAlerts && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Alerts</span>
                          )}
                          {client.permissions.shareMoodData && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Mood</span>
                          )}
                        </div>

                        {/* Week summary themes */}
                        {client.weekSummary && (
                          <div className="bg-raised p-2 rounded">
                            <p className="text-[9px] text-text-muted mb-1">This week&apos;s themes:</p>
                            <p className="text-xs text-text-mid">
                              {client.weekSummary.themes.join(', ') || 'No themes identified'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {client.homeworkCompletionRate !== null && (
                          <div className="mb-2">
                            <p className="text-2xl font-cinzel text-teal-400">
                              {client.homeworkCompletionRate}%
                            </p>
                            <p className="text-[9px] text-text-muted">Homework</p>
                          </div>
                        )}
                        {client.activeHomework > 0 && (
                          <p className="text-[10px] text-text-muted">
                            {client.activeHomework} active task{client.activeHomework > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TherapistIcon size={48} className="mx-auto mb-4 text-text-muted/50" />
                <h3 className="font-cinzel text-sm text-text-main mb-2">No clients yet</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                  When your clients grant you consent in Sorca, they&apos;ll appear here. 
                  Share the link to your practice and invite them to connect.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-teal-500 text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal-400"
                >
                  Invite Your First Client
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <a
            href="/dashboard/outcomes"
            className="bg-surface border border-border rounded-lg p-4 hover:border-teal-500/30 transition-colors group"
          >
            <svg className="w-6 h-6 mb-2 text-teal-400/70 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-teal-400 transition-colors">
              Outcome Measures
            </h3>
            <p className="text-[10px] text-text-muted">PHQ-9 & GAD-7 tracking</p>
          </a>

          <a
            href="/dashboard/homework"
            className="bg-surface border border-border rounded-lg p-4 hover:border-violet-500/30 transition-colors group"
          >
            <HomeworkIcon size={24} className="mb-2 text-violet-400/70 group-hover:text-violet-400" />
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-violet-400 transition-colors">
              Assign Homework
            </h3>
            <p className="text-[10px] text-text-muted">Set conversational homework</p>
          </a>

          <a
            href="/dashboard/summaries"
            className="bg-surface border border-border rounded-lg p-4 hover:border-blue-500/30 transition-colors group"
          >
            <BookIcon size={24} className="mb-2 text-blue-400/70 group-hover:text-blue-400" />
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-blue-400 transition-colors">
              Week Summaries
            </h3>
            <p className="text-[10px] text-text-muted">Review client reflections</p>
          </a>

          <a
            href="/dashboard/settings"
            className="bg-surface border border-border rounded-lg p-4 hover:border-gold/30 transition-colors group"
          >
            <SettingsIcon size={24} className="mb-2 text-gold/70 group-hover:text-gold" />
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-gold transition-colors">
              Practice Settings
            </h3>
            <p className="text-[10px] text-text-muted">Manage your practice</p>
          </a>
        </motion.div>

        {/* Session Prep Modal */}
        {sessionPrep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={() => setSessionPrep(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-teal-500/30 rounded-lg p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cinzel text-lg text-teal-400">Session Prep: {sessionPrep.clientName}</h2>
                <button onClick={() => setSessionPrep(null)} className="text-text-muted hover:text-gold">
                  ✕
                </button>
              </div>
              <div className="bg-raised rounded-lg p-4 mb-6">
                <p className="font-cormorant text-base text-text-main leading-relaxed whitespace-pre-wrap">
                  {sessionPrep.prepBrief}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-raised rounded-lg p-3">
                  <p className="text-2xl font-cinzel text-teal-400">{String(sessionPrep.data?.sessionCount ?? 0)}</p>
                  <p className="text-[10px] text-text-muted">Sessions this week</p>
                </div>
                <div className="bg-raised rounded-lg p-3">
                  <p className="text-2xl font-cinzel text-teal-400">{String(sessionPrep.data?.alertCount ?? 0)}</p>
                  <p className="text-[10px] text-text-muted">Alerts this week</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Pattern Alert Panel */}
      <PatternAlertPanel 
        isOpen={showAlertPanel} 
        onClose={() => setShowAlertPanel(false)} 
      />

      {/* Invite Client Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={closeInviteModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-teal-500/30 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg text-teal-400">Invite Client</h2>
              <button onClick={closeInviteModal} className="text-text-muted hover:text-gold">✕</button>
            </div>

            {inviteLink ? (
              <div>
                <p className="text-sm text-text-mid mb-4">
                  Share this link with your client to connect:
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-raised border border-border rounded px-3 py-2 text-xs text-text-main"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-3 py-2 bg-teal-500 text-void rounded hover:bg-teal-400 text-xs font-cinzel"
                  >
                    {inviteCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="w-full py-2 border border-border text-text-muted font-cinzel text-xs tracking-widest rounded-lg hover:border-teal-500/30"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Client email address"
                  className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal-500/50 focus:outline-none"
                />
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Client name (optional)"
                  className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal-500/50 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateInvite}
                    disabled={inviteSubmitting || !inviteEmail.trim()}
                    className="flex-1 py-2 bg-teal-500 text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteSubmitting ? 'Creating...' : 'Create Invite'}
                  </button>
                  <button
                    onClick={closeInviteModal}
                    className="px-4 py-2 border border-border text-text-muted font-cinzel text-xs tracking-widest rounded-lg hover:border-teal-500/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
