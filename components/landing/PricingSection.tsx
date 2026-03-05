'use client';

import { motion } from 'motion/react';
import { Tier } from '@/hooks/useAuth';

interface PricingSectionProps {
  currentTier?: Tier;
  onUpgrade: (tier: Tier) => void;
}

export function PricingSection({ currentTier, onUpgrade }: PricingSectionProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20 mb-20"
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
        Whether you're in therapy or supporting patients, Sorca has a plan for you. All plans include UK data hosting and GDPR compliance.
      </p>
      
      {/* Top 3 tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Seeker */}
        <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(192,57,43,0.05)] flex flex-col" role="article" aria-label="Seeker plan">
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Patient Free</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1">Free</div>
          <div className="text-xs text-text-muted mb-10">Forever free · No card required</div>
          <ul className="space-y-4 flex-1" aria-label="Patient Free features">
            {['Daily mood check-ins', 'PHQ-9 & GAD-7 tracking', 'Grounding exercises', 'Crisis contacts (UK)', 'Basic session history'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
            {[
              { name: 'Homework companion', lock: true },
              { name: 'Relapse prevention plan', lock: true },
              { name: 'Psychoeducation library', lock: true }
            ].map((item, i) => (
              <li key={`disabled-${i}`} className="text-sm text-text-muted pl-5 relative flex items-center gap-2">
                <span className="absolute left-0 top-1.5 text-[6px] text-text-muted" aria-hidden="true">◆</span>
                <span aria-label={`${item.name} - Patient Plus only`}>{item.name}</span>
                {item.lock && <span className="text-[8px] px-1.5 py-0.5 bg-gold/10 text-gold/60 rounded font-courier tracking-wider">PLUS</span>}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => onUpgrade('free')}
            disabled={currentTier === 'free'}
            className="mt-8 w-full py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={currentTier === 'free' ? 'Current plan: Seeker' : 'Select Seeker plan'}
          >
            {currentTier === 'free' ? 'Current Tier' : 'Select'}
          </button>
        </div>

        {/* Philosopher */}
        <div className="bg-raised p-12 border border-gold/30 relative rounded-lg hover:border-gold hover:shadow-[0_8px_30px_rgba(192,57,43,0.12)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col" role="article" aria-label="Philosopher plan - most popular">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gold text-void font-cinzel text-[9px] tracking-[0.15em] px-4 py-1 rounded-b-md">Most Popular</div>
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3 mt-2">Patient Plus</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>9</div>
          <div className="text-xs text-text-muted mb-10">per month · or £79/year</div>
          <ul className="space-y-4 flex-1" aria-label="Patient Plus features">
            {['Everything in Free', 'AI homework companion', 'Relapse prevention toolkit', 'Psychoeducation library', 'Week summaries', 'Therapist data sharing', 'Priority support'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
          </ul>
          <button 
            onClick={() => onUpgrade('philosopher')}
            disabled={currentTier === 'philosopher'}
            className="mt-8 w-full py-3 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded hover:bg-gold hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={currentTier === 'philosopher' ? 'Current plan: Patient Plus' : 'Upgrade to Patient Plus for £9 per month'}
          >
            {currentTier === 'philosopher' ? 'Current Plan' : 'Upgrade'}
          </button>
        </div>

        {/* Oracle Pro */}
        <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(192,57,43,0.05)] flex flex-col" role="article" aria-label="Sorca Pro plan">
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Patient Pro</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>19</div>
          <div className="text-xs text-text-muted mb-10">per month · full support</div>
          <ul className="space-y-4 flex-1" aria-label="Patient Pro features">
            {['Everything in Plus', 'Voice sessions', 'Shared sessions with partner/family', 'GP letter generation', 'Full data export (GDPR)', 'Priority clinical support'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
          </ul>
          <button 
            onClick={() => onUpgrade('pro')}
            disabled={currentTier === 'pro'}
            className="mt-8 w-full py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={currentTier === 'pro' ? 'Current plan: Patient Pro' : 'Upgrade to Patient Pro for £19 per month'}
          >
            {currentTier === 'pro' ? 'Current Tier' : 'Upgrade'}
          </button>
        </div>

      </div>

      {/* Clinical Practice - Full Width */}
      <div className="mt-6 bg-gradient-to-r from-teal-900/20 via-surface to-teal-900/20 p-8 md:p-12 border border-teal-500/30 rounded-lg hover:border-teal-500 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(20,184,166,0.08)] relative" role="article" aria-label="Clinical Practice plan">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-teal-500 text-void font-cinzel text-[9px] tracking-[0.15em] px-4 py-1 rounded-b-md">For Therapists & Coaches</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left - Pricing */}
          <div className="text-center md:text-left">
            <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-teal-400 mb-3 mt-2">Clinical Practice</div>
            <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-teal-400">£</sup>59</div>
            <div className="text-xs text-text-muted mb-4">per therapist / month</div>
            <a 
              href="/for-therapists"
              className="inline-block px-8 py-3 bg-teal-500/10 border border-teal-500 text-teal-400 font-cinzel text-xs tracking-widest uppercase rounded hover:bg-teal-500 hover:text-void transition-colors"
              aria-label="Learn more about Clinical Practice plan"
            >
              Learn More
            </a>
          </div>
          
          {/* Middle - Features */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'PHQ-9 & GAD-7', desc: 'NHS-standard outcome tracking' },
                { title: 'Session Notes', desc: 'Clinical documentation' },
                { title: 'Stepped Care', desc: 'Step 1-3 pathway support' },
                { title: 'Risk Assessment', desc: 'Safeguarding tools' },
                { title: 'GP Letters', desc: 'Auto-generated correspondence' },
                { title: '10 Patients', desc: 'Included in subscription' },
                { title: 'IAPT Compliant', desc: 'NHS data standards' },
                { title: 'UK Data Hosting', desc: 'GDPR + NHS DSP aligned' },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 bg-teal-500/5 rounded-lg border border-teal-500/10">
                  <div className="font-cinzel text-xs text-teal-400 mb-1">{item.title}</div>
                  <div className="text-[10px] text-text-muted">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
