'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Stars } from '@/components/Stars';
import { Footer } from '@/components/landing/Footer';
import { ChartIcon, HomeworkIcon, BellIcon, BookIcon, SafeIcon, ConsentIcon, WarningIcon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

const THERAPIST_FEATURES: { Icon: ComponentType<IconProps>; title: string; desc: string }[] = [
  {
    Icon: ChartIcon,
    title: 'Therapist Dashboard',
    desc: 'See your clients\' week at a glance. Themes, mood trends, homework completion — all consent-gated and GDPR compliant.',
  },
  {
    Icon: HomeworkIcon,
    title: 'Homework Assignment',
    desc: 'Set homework in 2 minutes after session. Sorca converts it into a 7-day conversational journey. See completion before the next session.',
  },
  {
    Icon: BellIcon,
    title: 'Pattern Alerts',
    desc: 'When Sorca detects escalating distress language or significant belief shifts, you get a gentle note — not an alarm. Early awareness.',
  },
  {
    Icon: BookIcon,
    title: 'Session Prep Brief',
    desc: '15 minutes before your client arrives: what they processed this week, unresolved questions, mood trend, suggested opening.',
  },
  {
    Icon: BookIcon,
    title: 'Week Summary',
    desc: 'Every Sunday, a one-page digest lands in your dashboard. Plain language, not clinical jargon. Both you and your client read it.',
  },
  {
    Icon: SafeIcon,
    title: 'Safe Messaging Mode',
    desc: 'Flag high-risk clients. Sorca enters grounding mode automatically — no depth escalation, crisis resources visible.',
  },
];

const COMPLIANCE_ITEMS: { Icon: ComponentType<IconProps>; title: string; desc: string }[] = [
  { Icon: ConsentIcon, title: 'GDPR Compliant', desc: 'Explicit opt-in consent. Patient controls what\'s shared. Revocable anytime.' },
  { Icon: BookIcon, title: 'ICO Registered', desc: 'Registered as data processor with UK Information Commissioner\'s Office.' },
  { Icon: WarningIcon, title: 'Not Therapy', desc: 'Clear disclaimers throughout. Sorca deepens reflection — it does not treat.' },
  { Icon: ChartIcon, title: 'Audit Trail', desc: 'Complete log of consent changes for regulatory compliance.' },
];

const PRICING = {
  price: '£59',
  period: 'per therapist / month',
  includes: [
    'Therapist Dashboard',
    'Homework Assignment Tool',
    'Pattern Alerts',
    'Session Prep Brief',
    'Week Summary (shared)',
    'Safe Messaging Mode controls',
    '10 client accounts (Philosopher tier)',
    'GDPR consent flow + audit log',
    'Discharge Archive at therapy end',
    'Priority clinical support',
  ],
};

export function ForTherapistsContent() {
  const { user, loading, signIn, logOut, getIdToken, isTherapist } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credentials, setCredentials] = useState({
    registrationBody: '',
    registrationNumber: '',
    practiceName: '',
  });
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const REGISTRATION_BODIES = [
    { value: 'HCPC', label: 'HCPC (Health and Care Professions Council)' },
    { value: 'BACP', label: 'BACP (British Association for Counselling and Psychotherapy)' },
    { value: 'UKCP', label: 'UKCP (UK Council for Psychotherapy)' },
    { value: 'BPS', label: 'BPS (British Psychological Society)' },
    { value: 'NCS', label: 'NCS (National Counselling Society)' },
    { value: 'BABCP', label: 'BABCP (British Association for Behavioural and Cognitive Psychotherapies)' },
    { value: 'OTHER', label: 'Other Professional Body' },
  ];

  const handleStartTrial = async () => {
    if (!user) {
      await signIn();
      return;
    }
    // Show credential verification modal
    setShowCredentialModal(true);
  };

  const handleSubmitCredentials = async () => {
    if (!credentials.registrationBody || !credentials.registrationNumber) {
      setCredentialError('Please provide your registration details');
      return;
    }

    setCheckoutLoading(true);
    setCredentialError(null);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tier: 'practice',
          trial: true,
          therapistCredentials: {
            registrationBody: credentials.registrationBody,
            registrationNumber: credentials.registrationNumber,
            practiceName: credentials.practiceName || undefined,
          },
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        const data = await res.json();
        setCredentialError(data.error || 'Failed to start checkout');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      setCredentialError('Unable to connect to payment service');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-void">
      <Stars />

      {/* Header with Login */}
      <header className="w-full max-w-6xl px-6 py-6 flex justify-between items-center absolute top-0 z-50">
        <a href="/" className="font-cinzel text-teal-400 tracking-[0.3em] text-xs uppercase">
          Sorca
        </a>
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              isTherapist ? (
                <div className="flex items-center gap-4">
                  <a
                    href="/dashboard"
                    className="text-teal-400 hover:text-teal-300 transition-colors font-cinzel text-xs tracking-widest uppercase"
                  >
                    Practice Dashboard
                  </a>
                  <button
                    onClick={() => logOut()}
                    className="text-text-muted hover:text-teal-400 transition-colors font-courier text-xs tracking-widest uppercase"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-muted">
                    Signed in as {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                  <button
                    onClick={() => logOut()}
                    className="text-text-muted hover:text-teal-400 transition-colors font-courier text-xs tracking-widest uppercase"
                  >
                    Sign Out
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => signIn()}
                className="text-teal-400 hover:text-teal-300 transition-colors font-cinzel text-xs tracking-widest uppercase"
              >
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="w-full max-w-6xl px-6 pt-32 pb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-teal-400 font-cinzel text-[10px] tracking-widest uppercase">
              For Clinical Practices
            </span>
          </div>

          <h1 className="font-cinzel font-semibold text-4xl md:text-6xl text-text-main mb-6 leading-tight">
            The Context You <em className="font-cormorant italic font-light text-teal-400">Wish</em> You Had
          </h1>

          <p className="text-lg text-text-mid leading-relaxed max-w-2xl mx-auto mb-8">
            Therapy is one hour a week. The other 167 hours, your clients are processing alone. 
            Sorca lives in that gap — and gives you visibility into it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleStartTrial}
              disabled={checkoutLoading}
              className="px-8 py-4 bg-teal-500 text-void font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? 'Loading...' : user ? 'Start 14-Day Free Trial' : 'Sign In to Start Trial'}
            </button>
            <a
              href="#features"
              className="px-8 py-4 border border-teal-500/50 text-teal-400 font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-teal-500/10 transition-colors"
            >
              See Features
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-surface border border-teal-500/20 rounded-lg p-6 text-center">
              <div className="font-cinzel text-4xl text-teal-400 mb-1">75%</div>
              <div className="text-xs text-text-muted">Homework completion with AI</div>
            </div>
            <div className="bg-surface border border-teal-500/20 rounded-lg p-6 text-center">
              <div className="font-cinzel text-4xl text-teal-400 mb-1">20-30%</div>
              <div className="text-xs text-text-muted">Standard worksheet rate</div>
            </div>
            <div className="bg-surface border border-teal-500/20 rounded-lg p-6 text-center">
              <div className="font-cinzel text-4xl text-teal-400 mb-1">2 min</div>
              <div className="text-xs text-text-muted">To assign homework</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Evidence */}
      <section className="w-full max-w-4xl px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface border border-teal-500/30 rounded-lg p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center">
              <BookIcon size={28} className="text-teal-400" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg text-teal-400 mb-3">
                Peer-Reviewed Evidence · NHS UK · 2025
              </h2>
              <p className="text-text-mid leading-relaxed mb-3">
                &quot;A study of 244 NHS patients in group-based CBT found that patients using an AI tool between sessions showed 
                <strong className="text-text-main"> higher recovery rates, greater attendance, and far higher homework completion</strong> than 
                those using standard worksheets. The mechanism: personalized, conversational engagement beats static handouts.&quot;
              </p>
              <p className="text-sm text-text-muted italic">
                Habicht et al., Journal of Medical Internet Research, March 2025
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="w-full max-w-6xl px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-teal-400 mb-5 flex items-center gap-4">
            Therapist Features
            <div className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
          </div>

          <h2 className="font-cinzel font-semibold text-3xl md:text-4xl text-text-main mb-12">
            What You Get Before Each Session
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {THERAPIST_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-lg p-6 hover:border-teal-500/30 transition-colors"
              >
                <feature.Icon size={32} className="mb-4 text-teal-400" />
                <h3 className="font-cinzel text-sm text-text-main mb-2">{feature.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* What Sorca is NOT */}
      <section className="w-full max-w-4xl px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-red-900/10 border border-red-500/20 rounded-lg p-8"
        >
          <h2 className="font-cinzel text-lg text-red-400 mb-4 text-center">
            What Sorca Will Never Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Claim to be a therapist or provide therapy',
              'Attempt to diagnose conditions',
              'Provide crisis counselling (signposts instead)',
              'Replace the therapeutic relationship',
              'Allow surveillance without explicit consent',
              'Train on client data',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-mid">
                <span className="text-red-400">✕</span>
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted text-center mt-6">
            These are not just ethical guardrails — they are regulatory requirements. 
            The UK&apos;s Care Quality Commission and ICO are watching this space.
          </p>
        </motion.div>
      </section>

      {/* Compliance */}
      <section className="w-full max-w-6xl px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-teal-400 mb-5 flex items-center gap-4">
            Compliance & Trust
            <div className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
          </div>

          <h2 className="font-cinzel font-semibold text-3xl text-text-main mb-12">
            Built for Clinical Use
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPLIANCE_ITEMS.map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-6 text-center">
                <item.Icon size={32} className="mx-auto mb-4 text-teal-400" />
                <h3 className="font-cinzel text-sm text-text-main mb-2">{item.title}</h3>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="w-full max-w-2xl px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface border border-teal-500/30 rounded-lg p-10 text-center"
        >
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-teal-400 mb-3">
            Clinical Practice
          </div>
          <div className="font-cinzel text-6xl font-black text-text-main mb-2">
            <sup className="text-2xl text-teal-400">£</sup>59
          </div>
          <div className="text-sm text-text-muted mb-8">{PRICING.period}</div>

          <ul className="space-y-3 text-left max-w-sm mx-auto mb-8">
            {PRICING.includes.map((item, i) => (
              <li key={i} className="text-sm text-text-mid flex items-center gap-2">
                <span className="text-teal-400">◆</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={handleStartTrial}
            disabled={checkoutLoading}
            className="w-full py-4 bg-teal-500 text-void font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {checkoutLoading ? 'Loading...' : user ? 'Start 14-Day Free Trial' : 'Sign In to Start Trial'}
          </button>

          <p className="text-xs text-text-muted mt-4">
            No credit card required. Full access to all features.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-4xl px-6 py-20 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-cinzel font-semibold text-3xl text-text-main mb-4">
            Stop Asking &quot;How Was Your Week?&quot;
          </h2>
          <p className="text-lg text-text-mid mb-8">
            You already know. Sorca told you.
          </p>
          <button
            onClick={handleStartTrial}
            disabled={checkoutLoading}
            className="px-10 py-4 bg-teal-500 text-void font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {checkoutLoading ? 'Loading...' : 'Get Started Free'}
          </button>
        </motion.div>
      </section>

      <Footer />

      {/* Credential Verification Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-void border border-teal-500/30 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="font-cinzel text-lg text-teal-400 tracking-widest mb-2">
              Professional Verification
            </h2>
            <p className="text-sm text-text-muted mb-6">
              To ensure Sorca is used appropriately, we require professional registration details. 
              Your credentials will be verified before full access is granted.
            </p>

            {credentialError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-400">{credentialError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                  Registration Body *
                </label>
                <select
                  value={credentials.registrationBody}
                  onChange={(e) => setCredentials({ ...credentials, registrationBody: e.target.value })}
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Select your registration body...</option>
                  {REGISTRATION_BODIES.map((body) => (
                    <option key={body.value} value={body.value}>{body.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={credentials.registrationNumber}
                  onChange={(e) => setCredentials({ ...credentials, registrationNumber: e.target.value })}
                  placeholder="e.g., PYL12345"
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                  Practice Name (optional)
                </label>
                <input
                  type="text"
                  value={credentials.practiceName}
                  onChange={(e) => setCredentials({ ...credentials, practiceName: e.target.value })}
                  placeholder="e.g., Mindful Therapy London"
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-teal-500/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCredentials}
                disabled={checkoutLoading || !credentials.registrationBody || !credentials.registrationNumber}
                className="flex-1 py-3 bg-teal-500 text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? 'Processing...' : 'Continue to Trial'}
              </button>
            </div>

            <p className="text-[10px] text-text-muted text-center mt-4">
              We may contact your registration body to verify your credentials.
            </p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
