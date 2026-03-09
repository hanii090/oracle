'use client';

import { motion } from 'motion/react';
import { Tier } from '@/hooks/useAuth';
import { PATIENT_PLANS, THERAPIST_PLAN, TRIAL_DAYS, type PatientPlan } from '@/lib/pricing-config';

interface PricingSectionProps {
  currentTier?: Tier;
  onUpgrade: (tier: Tier) => void;
}

// ── Patient Plan Card ──────────────────────────────────────────────

function PatientPlanCard({
  plan,
  currentTier,
  onUpgrade,
}: {
  plan: PatientPlan;
  currentTier?: Tier;
  onUpgrade: (tier: Tier) => void;
}) {
  const isCurrent = currentTier === plan.tier;
  const isPopular = plan.popular;
  const isFree = plan.price === null;

  return (
    <div
      className={`p-6 sm:p-12 border relative rounded-lg transition-all duration-300 flex flex-col ${
        isPopular
          ? 'bg-raised border-gold/30 hover:border-gold hover:shadow-[0_8px_30px_rgba(192,57,43,0.12)] transform hover:-translate-y-1'
          : 'bg-surface border-border hover:border-gold/30 hover:shadow-[0_8px_30px_rgba(192,57,43,0.05)]'
      }`}
      role="article"
      aria-label={`${plan.label} plan${isPopular ? ' - most popular' : ''}`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gold text-void font-cinzel text-[9px] tracking-[0.15em] px-4 py-1 rounded-b-md">
          Most Popular
        </div>
      )}

      <div className={`font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3 ${isPopular ? 'mt-2' : ''}`}>
        {plan.label}
      </div>

      {isFree ? (
        <div className="font-cinzel text-3xl sm:text-5xl font-black text-text-main leading-none mb-1">Free</div>
      ) : (
        <div className="font-cinzel text-3xl sm:text-5xl font-black text-text-main leading-none mb-1">
          <sup className="text-xl text-gold">{plan.currency}</sup>
          {plan.price}
        </div>
      )}

      <div className="text-xs text-text-muted mb-10">{plan.subtitle}</div>

      <ul className="space-y-4 flex-1" aria-label={`${plan.label} features`}>
        {plan.features.map((feat, i) => (
          <li
            key={i}
            className={`text-sm pl-5 relative ${
              feat.highlight ? 'text-gold font-medium' : 'text-text-mid'
            }`}
          >
            <span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>
            {feat.name}
          </li>
        ))}

        {plan.lockedFeatures?.map((locked, i) => (
          <li
            key={`locked-${i}`}
            className="text-sm text-text-muted pl-5 relative flex items-center gap-2"
          >
            <span className="absolute left-0 top-1.5 text-[6px] text-text-muted" aria-hidden="true">◆</span>
            <span aria-label={`${locked.name} - ${locked.badge} only`}>{locked.name}</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-gold/10 text-gold/60 rounded font-courier tracking-wider">
              {locked.badge}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isCurrent ? onUpgrade(plan.tier) : undefined}
        disabled={isCurrent || (isFree && !!currentTier)}
        className={`mt-8 w-full py-3 font-cinzel text-xs tracking-widest uppercase rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? 'bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void'
            : 'border border-border text-text-muted hover:border-gold hover:text-gold'
        }`}
        aria-label={
          isCurrent
            ? `Current plan: ${plan.label}`
            : isFree
              ? 'Get started free — sign in'
              : `Upgrade to ${plan.label} for ${plan.currency}${plan.price} per month`
        }
      >
        {isCurrent ? plan.ctaCurrent : plan.cta}
      </button>
    </div>
  );
}

// ── Main PricingSection ────────────────────────────────────────────

export function PricingSection({ currentTier, onUpgrade }: PricingSectionProps) {
  const therapist = THERAPIST_PLAN;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-20 mb-12 sm:mb-20"
      aria-labelledby="pricing-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        III · Pricing
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="pricing-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        Choose Your <em className="font-cormorant italic font-light text-gold">Plan</em>
      </h2>
      <p className="font-cormorant text-lg text-text-muted mb-16 max-w-2xl">
        Whether you&apos;re in therapy or supporting patients, Sorca has a plan for you. All paid
        plans include a{' '}
        <strong className="text-gold">{TRIAL_DAYS}-day free trial</strong>, voice sessions, UK data
        hosting, and GDPR compliance.
      </p>

      {/* Patient Plans — rendered from PATIENT_PLANS config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {PATIENT_PLANS.map((plan) => (
          <PatientPlanCard
            key={plan.tier}
            plan={plan}
            currentTier={currentTier}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* Clinical Practice — Full Width */}
      <div
        className="mt-6 bg-gradient-to-r from-teal/5 via-surface to-teal/5 p-5 sm:p-8 md:p-12 border border-teal/30 rounded-lg hover:border-teal transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(42,107,107,0.08)] relative"
        role="article"
        aria-label="Clinical Practice plan"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-teal text-void font-cinzel text-[9px] tracking-[0.15em] px-4 py-1 rounded-b-md">
          For Therapists &amp; Coaches
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left — Pricing */}
          <div className="text-center md:text-left">
            <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-teal mb-3 mt-2">
              {therapist.label}
            </div>
            <div className="font-cinzel text-3xl sm:text-5xl font-black text-text-main leading-none mb-1">
              <sup className="text-xl text-teal">{therapist.currency}</sup>
              {therapist.price}
            </div>
            <div className="text-xs text-text-muted mb-4">{therapist.subtitle}</div>
            <a
              href={therapist.ctaHref}
              className="inline-block px-8 py-3 bg-teal/10 border border-teal text-teal font-cinzel text-xs tracking-widest uppercase rounded hover:bg-teal hover:text-void transition-colors"
              aria-label={`Learn more about ${therapist.label} plan`}
            >
              {therapist.cta}
            </a>
          </div>

          {/* Right — Feature grid (from config) */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {therapist.features.map((feat, i) => (
                <div key={i} className="text-center p-3 bg-teal/5 rounded-lg border border-teal/10">
                  <div className="font-cinzel text-xs text-teal mb-1">{feat.title}</div>
                  <div className="text-[10px] text-text-muted">{feat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}