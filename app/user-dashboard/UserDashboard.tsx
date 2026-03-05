'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth, SessionSummary } from '@/hooks/useAuth';
import { useTherapy } from '@/hooks/useTherapy';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Stars } from '@/components/Stars';
import { SessionIcon, HomeworkIcon, BookIcon, AnchorIcon, ConsentIcon, ChevronIcon, CalendarIcon, ChartIcon, CapsuleIcon, GiftIcon, SettingsIcon } from '@/components/icons';
import { TimeCapsule } from '@/components/landing/TimeCapsule';
import { QuestionGift } from '@/components/landing/QuestionGift';
import { ExcavationReportSection } from '@/components/landing/ExcavationReport';
import { AccountSettings } from '@/components/AccountSettings';
import { HomeworkJourney } from '@/components/homework/HomeworkJourney';
import { Footer } from '@/components/landing/Footer';

interface WeekSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  themes: string[];
  createdAt: string;
}

interface JourneyDay {
  theme: string;
  question: string;
  followUp: string;
  grounding?: string;
}

interface CheckIn {
  dayNumber: number;
  response: string;
  timestamp: string;
}

interface HomeworkAssignment {
  id: string;
  topic: string;
  description: string;
  status: 'active' | 'completed' | 'expired';
  completedDays: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  journeyPlan?: Record<string, JourneyDay>;
  openingMessage?: string;
  closingMessage?: string;
  checkIns: CheckIn[];
  createdAt: string;
}

interface CopingAnchor {
  id: string;
  name: string;
  technique: string;
  createdAt: string;
}

export function UserDashboard() {
  const { user, profile, loading: authLoading, sessions, loadSessions, getIdToken } = useAuth();
  const { therapyProfile, isInTherapy } = useTherapy();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'sessions' | 'summaries' | 'homework' | 'anchors' | 'consent'>('sessions');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [summaries, setSummaries] = useState<WeekSummary[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [anchors, setAnchors] = useState<CopingAnchor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const token = await getIdToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Load week summaries
      const summaryRes = await fetch('/api/week-summary', { headers });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummaries(data.summaries || []);
      }

      // Load homework
      const homeworkRes = await fetch('/api/homework', { headers });
      if (homeworkRes.ok) {
        const data = await homeworkRes.json();
        setHomework(data.assignments || []);
      }

      // Load coping anchors
      const anchorRes = await fetch('/api/coping-anchor', { headers });
      if (anchorRes.ok) {
        const data = await anchorRes.json();
        setAnchors(data.anchors || []);
      }

      // Load sessions
      await loadSessions();
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken, loadSessions]);

  const loadHomework = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const homeworkRes = await fetch('/api/homework', { headers });
      if (homeworkRes.ok) {
        const data = await homeworkRes.json();
        setHomework(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load homework:', e);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const tabs = [
    { id: 'sessions', label: 'Sessions', Icon: SessionIcon, count: sessions?.length || 0 },
    { id: 'summaries', label: 'Week Summaries', Icon: BookIcon, count: summaries.length },
    { id: 'homework', label: 'Homework', Icon: HomeworkIcon, count: homework.filter(h => h.status === 'active').length },
    { id: 'anchors', label: 'Coping Anchors', Icon: AnchorIcon, count: anchors.length },
    { id: 'consent', label: 'Consent', Icon: ConsentIcon, count: null },
  ] as const;

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-2xl text-text-main mb-1">Your Dashboard</h1>
            <p className="text-sm text-text-muted">
              {profile?.tier} tier · {sessions?.length || 0} sessions
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isInTherapy && therapyProfile?.nextSessionDate && (
              <div className="flex items-center gap-2 text-xs text-teal-400">
                <CalendarIcon size={16} />
                <span>Next session: {formatDate(therapyProfile.nextSessionDate)}</span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-surface border border-border hover:border-gold/30 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={18} className="text-text-muted hover:text-gold" />
            </button>
            <Link
              href="/"
              className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
            >
              ← Back to Sorca
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-cinzel text-xs tracking-widest whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-gold/10 border border-gold/30 text-gold'
                  : 'bg-surface border border-border text-text-muted hover:border-gold/20'
              }`}
            >
              <Icon size={16} />
              {label}
              {count !== null && count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gold/20 text-gold text-[9px] rounded">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-surface border border-border rounded-lg p-6"
        >
          {activeTab === 'sessions' && (
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
                Session History
              </h2>
              {!sessions || sessions.length === 0 ? (
                <div className="text-center py-12">
                  <SessionIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No sessions yet. Start your first session to begin.</p>
                  <Link href="/" className="inline-block mt-4 px-6 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/10">
                    Start Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sessions.map((session: SessionSummary) => (
                    <div
                      key={session.id}
                      className="p-4 bg-raised border border-border rounded-lg hover:border-gold/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/?view=${session.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-cinzel text-sm text-text-main">
                          Depth {session.maxDepth}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-mid line-clamp-2">
                        {session.preview}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'summaries' && (
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
                Week Summaries
              </h2>
              {summaries.length === 0 ? (
                <div className="text-center py-12">
                  <BookIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No week summaries yet. They&apos;re generated weekly based on your sessions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summaries.map((summary) => (
                    <div key={summary.id} className="p-4 bg-raised border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-cinzel text-sm text-text-main">
                          {formatWeekRange(summary.weekStart, summary.weekEnd)}
                        </span>
                      </div>
                      <p className="text-xs text-text-mid mb-2">{summary.summary}</p>
                      <div className="flex flex-wrap gap-1">
                        {summary.themes.map((theme, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'homework' && (
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
                Homework Assignments
              </h2>
              {homework.length === 0 ? (
                <div className="text-center py-12">
                  <HomeworkIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No homework assigned yet.</p>
                  {!isInTherapy && (
                    <p className="text-xs text-text-muted mt-2">Connect with a therapist to receive homework.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active homework with journey - show interactive component */}
                  {homework.filter(hw => hw.status === 'active' && hw.journeyPlan).map((hw) => (
                    <HomeworkJourney
                      key={hw.id}
                      assignment={hw}
                      onCheckInComplete={() => loadHomework()}
                    />
                  ))}

                  {/* Active homework without journey - show simple card */}
                  {homework.filter(hw => hw.status === 'active' && !hw.journeyPlan).map((hw) => (
                    <div key={hw.id} className="p-4 bg-raised border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-cinzel text-sm text-text-main">{hw.topic}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                          active
                        </span>
                      </div>
                      <p className="text-xs text-text-mid mb-2">{hw.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${(hw.completedDays / hw.durationDays) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-text-muted">
                          {hw.completedDays}/{hw.durationDays} days
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Completed/expired homework */}
                  {homework.filter(hw => hw.status !== 'active').length > 0 && (
                    <details className="group">
                      <summary className="text-xs text-text-muted cursor-pointer hover:text-text-mid">
                        Past homework ({homework.filter(hw => hw.status !== 'active').length})
                      </summary>
                      <div className="mt-3 space-y-2">
                        {homework.filter(hw => hw.status !== 'active').map((hw) => (
                          <div key={hw.id} className="p-3 bg-surface/50 border border-border rounded-lg opacity-70">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-cinzel text-xs text-text-main">{hw.topic}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded ${
                                hw.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-text-muted/10 text-text-muted'
                              }`}>
                                {hw.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-muted">
                              {hw.completedDays}/{hw.durationDays} days completed
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'anchors' && (
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
                Coping Anchors
              </h2>
              {anchors.length === 0 ? (
                <div className="text-center py-12">
                  <AnchorIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                  <p className="text-sm text-text-muted mb-3">No coping anchors saved yet.</p>
                  <div className="text-xs text-text-muted/70 max-w-md mx-auto space-y-2 mb-6">
                    <p><strong>How to save anchors:</strong></p>
                    <p>1. During a session, click the ⚓ anchor button when you feel grounded</p>
                    <p>2. Or manually add techniques your therapist has taught you</p>
                  </div>
                  <Link
                    href="/?anchor=true"
                    className="inline-block px-6 py-3 border border-teal-500 text-teal-400 font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal-500/10"
                  >
                    Add Your First Anchor
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {anchors.map((anchor) => (
                    <div key={anchor.id} className="p-4 bg-raised border border-border rounded-lg">
                      <h3 className="font-cinzel text-sm text-teal-400 mb-2">{anchor.name}</h3>
                      <p className="text-xs text-text-mid">{anchor.technique}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeTab === 'consent' && (
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
                Therapist Consent
              </h2>
              <div className="text-center py-8">
                <ConsentIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                <p className="text-sm text-text-muted mb-4">
                  Manage who can see your Sorca data.
                </p>
                <Link
                  href="/?consent=true"
                  className="inline-block px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/10"
                >
                  Manage Consent
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/?start=true"
            className="bg-surface border border-border rounded-lg p-4 hover:border-gold/30 transition-colors group text-center"
          >
            <SessionIcon size={24} className="mx-auto mb-2 text-gold/70 group-hover:text-gold" />
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-gold transition-colors">
              New Session
            </h3>
            <p className="text-[10px] text-text-muted">Start a new Sorca session</p>
          </Link>

          {isInTherapy && (
            <Link
              href="/?homework=true"
              className="bg-surface border border-border rounded-lg p-4 hover:border-violet-500/30 transition-colors group text-center"
            >
              <HomeworkIcon size={24} className="mx-auto mb-2 text-violet-400/70 group-hover:text-violet-400" />
              <h3 className="font-cinzel text-sm text-text-main group-hover:text-violet-400 transition-colors">
                Do Homework
              </h3>
              <p className="text-[10px] text-text-muted">Complete your therapy homework</p>
            </Link>
          )}

          <Link
            href="/?anchor=true"
            className="bg-surface border border-border rounded-lg p-4 hover:border-teal-500/30 transition-colors group text-center"
          >
            <AnchorIcon size={24} className="mx-auto mb-2 text-teal-400/70 group-hover:text-teal-400" />
            <h3 className="font-cinzel text-sm text-text-main group-hover:text-teal-400 transition-colors">
              Grounding
            </h3>
            <p className="text-[10px] text-text-muted">Access your coping anchors</p>
          </Link>
        </div>

        {/* Analytics & Insights Section */}
        <div className="mt-8">
          <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
            Insights & Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Excavation Report Card */}
            <button
              onClick={() => profile?.tier !== 'free' && setShowReportModal(true)}
              disabled={profile?.tier === 'free'}
              className={`bg-surface border border-border rounded-lg p-5 text-left transition-colors ${
                profile?.tier === 'free' ? 'opacity-60 cursor-not-allowed' : 'hover:border-gold/30 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <ChartIcon size={20} className="text-gold/70" />
                <h3 className="font-cinzel text-sm text-text-main">Excavation Report</h3>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Monthly insights into your patterns, breakthroughs, and growth areas.
              </p>
              {profile?.tier === 'free' ? (
                <span className="text-[10px] text-gold/60">Upgrade to Philosopher</span>
              ) : (
                <span className="text-[10px] text-gold">View Full Report →</span>
              )}
            </button>

            {/* Time Capsule Card */}
            <button
              onClick={() => profile?.tier !== 'free' && setShowCapsuleModal(true)}
              disabled={profile?.tier === 'free'}
              className={`bg-surface border border-border rounded-lg p-5 text-left transition-colors ${
                profile?.tier === 'free' ? 'opacity-60 cursor-not-allowed' : 'hover:border-violet-500/30 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <CapsuleIcon size={20} className="text-violet-400/70" />
                <h3 className="font-cinzel text-sm text-text-main">Time Capsule</h3>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Send messages to your future self. Receive them when you need them most.
              </p>
              {profile?.tier === 'free' ? (
                <span className="text-[10px] text-violet-400/60">Upgrade to Philosopher</span>
              ) : (
                <span className="text-[10px] text-violet-400">Create Capsule →</span>
              )}
            </button>

            {/* Question Gift Card */}
            <button
              onClick={() => profile?.tier !== 'free' && setShowGiftModal(true)}
              disabled={profile?.tier === 'free'}
              className={`bg-surface border border-border rounded-lg p-5 text-left transition-colors ${
                profile?.tier === 'free' ? 'opacity-60 cursor-not-allowed' : 'hover:border-teal-500/30 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <GiftIcon size={20} className="text-teal-400/70" />
                <h3 className="font-cinzel text-sm text-text-main">Question Gift</h3>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Gift a powerful question to someone you care about.
              </p>
              {profile?.tier === 'free' ? (
                <span className="text-[10px] text-teal-400/60">Upgrade to Philosopher</span>
              ) : (
                <span className="text-[10px] text-teal-400">Send Gift →</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Account Settings Modal */}
      {showSettings && (
        <AccountSettings onClose={() => setShowSettings(false)} />
      )}

      {/* Excavation Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-lg text-text-main">Excavation Report</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>
            <ExcavationReportSection />
          </motion.div>
        </div>
      )}

      {/* Time Capsule Modal */}
      {showCapsuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-lg text-text-main">Time Capsule</h2>
              <button
                onClick={() => setShowCapsuleModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>
            <TimeCapsule />
          </motion.div>
        </div>
      )}

      {/* Question Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-lg text-text-main">Question Gift</h2>
              <button
                onClick={() => setShowGiftModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>
            <QuestionGift />
          </motion.div>
        </div>
      )}
    </main>
  );
}
