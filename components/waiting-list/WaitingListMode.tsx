'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { WaitlistIcon } from '@/components/icons/WaitlistIcon';

interface WaitingListProfile {
  userId: string;
  referralReason: string;
  referralReasonOther?: string;
  waitingSince: string | null;
  gpName: string | null;
  gpPractice: string | null;
  nhsArea: string | null;
  weeklyCheckInEnabled: boolean;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  readinessBrief: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CheckIn {
  id: string;
  weekNumber: number;
  responses: Array<{ question: string; answer: string }>;
  moodScore: number | null;
  createdAt: string;
}

interface WeekTheme {
  theme: string;
  questions: string[];
}

const REFERRAL_REASONS = [
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'grief', label: 'Grief & Loss' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'relationship', label: 'Relationship Issues' },
  { value: 'ocd', label: 'OCD' },
  { value: 'ptsd', label: 'PTSD' },
  { value: 'other', label: 'Other' },
];

export function WaitingListMode() {
  const { user, getIdToken } = useAuth();
  const [profile, setProfile] = useState<WaitingListProfile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [themes, setThemes] = useState<WeekTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'onboarding' | 'dashboard' | 'checkin' | 'brief'>('onboarding');

  // Onboarding state
  const [reason, setReason] = useState('anxiety');
  const [reasonOther, setReasonOther] = useState('');
  const [waitingSince, setWaitingSince] = useState('');
  const [saving, setSaving] = useState(false);

  // Check-in state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [moodScore, setMoodScore] = useState<number>(5);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Brief state
  const [brief, setBrief] = useState<string | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/waiting-list', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setCheckIns(data.checkIns || []);
        setThemes(data.themes || []);
        if (data.profile) {
          setStep('dashboard');
          setReason(data.profile.referralReason);
        }
      }
    } catch (e) {
      console.error('Failed to load waiting list data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          referralReason: reason,
          referralReasonOther: reason === 'other' ? reasonOther : undefined,
          waitingSince: waitingSince || undefined,
          weeklyCheckInEnabled: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setStep('dashboard');
        await loadData();
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const currentWeekNumber = profile ? (profile.totalCheckIns || 0) + 1 : 1;
  const currentTheme = themes[(currentWeekNumber - 1) % themes.length];

  const startCheckIn = () => {
    if (!currentTheme) return;
    setCurrentQuestionIdx(0);
    setAnswers(Array(currentTheme.questions.length).fill(''));
    setMoodScore(5);
    setStep('checkin');
  };

  const handleSubmitCheckIn = async () => {
    if (!currentTheme) return;
    setSubmittingCheckIn(true);
    try {
      const token = await getIdToken();
      const responses = currentTheme.questions.map((q, i) => ({
        question: q,
        answer: answers[i] || '',
      })).filter(r => r.answer.trim().length > 0);

      const res = await fetch('/api/waiting-list?action=checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'checkin',
          weekNumber: currentWeekNumber,
          responses,
          moodScore,
        }),
      });
      if (res.ok) {
        await loadData();
        setStep('dashboard');
      }
    } catch (e) {
      console.error('Failed to submit check-in:', e);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/waiting-list?action=readiness-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'readiness-brief' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
        setStep('brief');
      }
    } catch (e) {
      console.error('Failed to generate brief:', e);
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleCopyBrief = () => {
    if (brief) {
      navigator.clipboard.writeText(brief);
    }
  };

  const handlePrintBrief = () => {
    if (brief) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Readiness Brief — Sorca</title>
          <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.7;color:#333;}
          h1{font-size:18px;margin-bottom:24px;}p{margin-bottom:12px;}</style></head>
          <body><h1>Readiness Brief for First Appointment</h1>
          ${brief.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('')}
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Onboarding step
  if (step === 'onboarding') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <WaitlistIcon size={48} className="mx-auto mb-4 text-teal" />
          <h2 className="font-cinzel text-xl text-text-main mb-2">
            You&apos;re on the List
          </h2>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            While you wait for NHS Talking Therapies, let&apos;s use this time well. 
            Sorca will guide you through weekly Socratic check-ins tailored to your needs.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-xs text-text-muted font-cinzel tracking-wider uppercase mb-2">
              What were you referred for?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REFERRAL_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`p-3 rounded-lg border text-sm text-left transition-all ${
                    reason === r.value
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-border text-text-mid hover:border-teal/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {reason === 'other' && (
              <input
                type="text"
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
                placeholder="Please describe..."
                className="mt-2 w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs text-text-muted font-cinzel tracking-wider uppercase mb-2">
              When were you referred? (optional)
            </label>
            <input
              type="month"
              value={waitingSince}
              onChange={(e) => setWaitingSince(e.target.value)}
              className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:border-teal/50 focus:outline-none"
            />
          </div>

          <div className="bg-teal/5 border border-teal/20 rounded-lg p-3">
            <p className="text-[11px] text-text-mid leading-relaxed">
              <strong className="text-teal">How this works:</strong> Each week, Sorca will offer you 3 reflective questions themed around your referral reason. 
              Your responses build towards a &quot;readiness brief&quot; — a summary you can bring to your first appointment. 
              This is not therapy. It&apos;s a way to explore your thoughts so you arrive prepared.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 bg-teal text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Setting up...' : 'Start My Waiting List Journey'}
          </button>
        </div>

        <p className="text-[10px] text-text-muted text-center mt-4">
          Sorca is not therapy and does not provide clinical advice. If you are in crisis, contact Samaritans (116 123) or text Shout (85258).
        </p>
      </motion.div>
    );
  }

  // Check-in step
  if (step === 'checkin' && currentTheme) {
    const question = currentTheme.questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === currentTheme.questions.length - 1;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setStep('dashboard')}
            className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
          >
            ← Back
          </button>
          <div className="text-right">
            <p className="text-[10px] text-text-muted">Week {currentWeekNumber} Check-in</p>
            <p className="text-xs text-teal font-cinzel">{currentTheme.theme}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {currentTheme.questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < currentQuestionIdx ? 'bg-teal' :
                i === currentQuestionIdx ? 'bg-teal/60' :
                'bg-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <p className="text-base text-text-main font-cormorant leading-relaxed mb-6 italic">
              &ldquo;{question}&rdquo;
            </p>

            <textarea
              value={answers[currentQuestionIdx] || ''}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[currentQuestionIdx] = e.target.value;
                setAnswers(newAnswers);
              }}
              placeholder="Take your time. Write as much or as little as feels right..."
              rows={5}
              className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none resize-none"
              maxLength={2000}
            />

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                disabled={currentQuestionIdx === 0}
                className="text-xs text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {isLastQuestion ? (
                <div className="space-y-3 text-right">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-muted">Mood today:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodScore}
                      onChange={(e) => setMoodScore(parseInt(e.target.value))}
                      className="w-24 accent-teal"
                    />
                    <span className="text-xs text-teal w-5 text-center">{moodScore}</span>
                  </div>
                  <button
                    onClick={handleSubmitCheckIn}
                    disabled={submittingCheckIn || answers.every(a => !a.trim())}
                    className="px-6 py-2 bg-teal text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal/90 disabled:opacity-50"
                  >
                    {submittingCheckIn ? 'Saving...' : 'Complete Check-in'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  className="text-xs text-teal hover:text-teal/80 font-cinzel tracking-widest"
                >
                  Next →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // Readiness brief step
  if (step === 'brief' && brief) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setStep('dashboard')}
            className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
          >
            ← Back
          </button>
          <h2 className="font-cinzel text-sm text-teal tracking-wider">Readiness Brief</h2>
        </div>

        <div className="bg-surface border border-teal/30 rounded-lg p-6 mb-4">
          <pre className="text-sm text-text-main font-cormorant whitespace-pre-wrap leading-relaxed">
            {brief}
          </pre>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyBrief}
            className="flex-1 py-2.5 border border-teal/30 text-teal font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal/10 transition-colors"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={handlePrintBrief}
            className="flex-1 py-2.5 bg-teal text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal/90 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>

        <p className="text-[10px] text-text-muted text-center mt-4">
          This is a patient-held record, not clinical documentation. Bring it to your first appointment to help your therapist understand where you are.
        </p>
      </motion.div>
    );
  }

  // Dashboard step
  const canCheckInToday = !profile?.lastCheckInDate ||
    new Date(profile.lastCheckInDate).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0];

  const waitingWeeks = profile?.waitingSince
    ? Math.floor((Date.now() - new Date(profile.waitingSince).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header card */}
      <div className="bg-gradient-to-r from-teal/5 to-teal/10 border border-teal/20 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <WaitlistIcon size={24} className="text-teal mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-cinzel text-sm text-teal tracking-wider mb-1">NHS Waiting List Mode</h3>
            <p className="text-xs text-text-mid">
              {waitingWeeks !== null && waitingWeeks > 0
                ? `You've been waiting approximately ${waitingWeeks} week${waitingWeeks > 1 ? 's' : ''}. `
                : ''}
              {profile?.totalCheckIns || 0} check-in{(profile?.totalCheckIns || 0) !== 1 ? 's' : ''} completed.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] px-2 py-1 bg-teal/10 text-teal rounded font-cinzel">
              {REFERRAL_REASONS.find(r => r.value === profile?.referralReason)?.label || 'General'}
            </span>
          </div>
        </div>
      </div>

      {/* This week's theme */}
      {currentTheme && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Week {currentWeekNumber} Theme</p>
              <p className="text-sm text-text-main font-cinzel">{currentTheme.theme}</p>
            </div>
            {canCheckInToday && (
              <button
                onClick={startCheckIn}
                className="px-4 py-2 bg-teal text-void font-cinzel text-[10px] tracking-widest rounded-lg hover:bg-teal/90 transition-colors"
              >
                Start Check-in
              </button>
            )}
            {!canCheckInToday && (
              <span className="text-[10px] text-text-muted">Completed today ✓</span>
            )}
          </div>
          <div className="space-y-1.5">
            {currentTheme.questions.map((q, i) => (
              <p key={i} className="text-xs text-text-muted italic">&ldquo;{q}&rdquo;</p>
            ))}
          </div>
        </div>
      )}

      {/* Readiness Brief */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-cinzel text-sm text-text-main mb-1">Readiness Brief</h4>
            <p className="text-[10px] text-text-muted">
              {(profile?.totalCheckIns || 0) >= 2
                ? 'Generate a summary to bring to your first appointment'
                : 'Complete at least 2 check-ins to generate your brief'}
            </p>
          </div>
          <button
            onClick={handleGenerateBrief}
            disabled={(profile?.totalCheckIns || 0) < 2 || generatingBrief}
            className="px-4 py-2 border border-teal/30 text-teal font-cinzel text-[10px] tracking-widest rounded-lg hover:bg-teal/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generatingBrief ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
      </div>

      {/* Past check-ins */}
      {checkIns.length > 0 && (
        <details className="group">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-mid font-cinzel tracking-wider">
            Past Check-ins ({checkIns.length})
          </summary>
          <div className="mt-3 space-y-2">
            {checkIns.slice(0, 8).map(ci => (
              <div key={ci.id} className="bg-surface/50 border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-main font-cinzel">Week {ci.weekNumber}</span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(ci.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {ci.moodScore && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-teal/10 text-teal rounded">
                    Mood: {ci.moodScore}/10
                  </span>
                )}
                {ci.responses.length > 0 && (
                  <p className="text-[10px] text-text-muted mt-1 line-clamp-2">
                    {ci.responses[0].answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Resources */}
      <div className="bg-raised border border-border rounded-lg p-4">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">While you wait</p>
        <div className="flex flex-wrap gap-2">
          <a href="https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/" target="_blank" rel="noopener noreferrer" className="text-[9px] px-2 py-1 bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors">
            NHS Talking Therapies
          </a>
          <a href="https://www.nhs.uk/mental-health/self-help/" target="_blank" rel="noopener noreferrer" className="text-[9px] px-2 py-1 bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors">
            NHS Self-Help
          </a>
          <a href="https://web.ntw.nhs.uk/selfhelp/" target="_blank" rel="noopener noreferrer" className="text-[9px] px-2 py-1 bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors">
            CBT Self-Help Guides
          </a>
          <a href="https://www.mind.org.uk/information-support/" target="_blank" rel="noopener noreferrer" className="text-[9px] px-2 py-1 bg-teal/10 text-teal rounded hover:bg-teal/20 transition-colors">
            Mind UK
          </a>
        </div>
      </div>

      <p className="text-[10px] text-text-muted text-center">
        Sorca is not therapy. If you are in crisis, contact Samaritans (116 123) or text Shout (85258).
      </p>
    </motion.div>
  );
}
