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
        Choose Your <em className="font-cormorant italic font-light text-gold">Depth</em>
      </h2>
      <p className="font-cormorant text-lg text-text-muted mb-16 max-w-2xl">
        Every tier unlocks deeper self-discovery. Start free, go as deep as you dare.
      </p>
      
      {/* Top 3 tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Seeker */}
        <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(192,57,43,0.05)] flex flex-col" role="article" aria-label="Seeker plan">
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Seeker</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1">Free</div>
          <div className="text-xs text-text-muted mb-10">Forever free · No card required</div>
          <ul className="space-y-4 flex-1" aria-label="Seeker features">
            {['5 sessions per month', 'Basic Thread (last 30 days)', 'Up to depth level 5', 'Sacred question tracking'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
            {[
              { name: 'Voice Sorca', lock: true },
              { name: 'Excavation Reports', lock: true },
              { name: 'Full Thread history', lock: true }
            ].map((item, i) => (
              <li key={`disabled-${i}`} className="text-sm text-text-muted pl-5 relative flex items-center gap-2">
                <span className="absolute left-0 top-1.5 text-[6px] text-text-muted" aria-hidden="true">◆</span>
                <span aria-label={`${item.name} - Philosopher tier only`}>{item.name}</span>
                {item.lock && <span className="text-[8px] px-1.5 py-0.5 bg-gold/10 text-gold/60 rounded font-courier tracking-wider">PHILOSOPHER</span>}
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
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3 mt-2">Philosopher</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>12</div>
          <div className="text-xs text-text-muted mb-10">per month · or £99/year</div>
          <ul className="space-y-4 flex-1" aria-label="Philosopher features">
            {['Unlimited sessions', 'Full Thread — entire history', 'All depth levels (to the abyss)', 'Voice Sorca with emotion detection', 'Night Sorca mode', 'Monthly Excavation Reports', 'Confrontation feature'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
          </ul>
          <button 
            onClick={() => onUpgrade('philosopher')}
            disabled={currentTier === 'philosopher'}
            className="mt-8 w-full py-3 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded hover:bg-gold hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={currentTier === 'philosopher' ? 'Current plan: Philosopher' : 'Upgrade to Philosopher plan for £12 per month'}
          >
            {currentTier === 'philosopher' ? 'Current Tier' : 'Upgrade'}
          </button>
        </div>

        {/* Oracle Pro */}
        <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(192,57,43,0.05)] flex flex-col" role="article" aria-label="Sorca Pro plan">
          <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Sorca Pro</div>
          <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>49</div>
          <div className="text-xs text-text-muted mb-10">per month · deepest tier</div>
          <ul className="space-y-4 flex-1" aria-label="Sorca Pro features">
            {['Everything in Philosopher', 'Ambient Portraits per session', 'Shared Sessions with others', '🕯️ Sorca for End of Life', 'Visual Memory Portraits', 'Permanent Thread Archive for family'].map((item, i) => (
              <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold" aria-hidden="true">◆</span>{item}</li>
            ))}
          </ul>
          <button 
            onClick={() => onUpgrade('pro')}
            disabled={currentTier === 'pro'}
            className="mt-8 w-full py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={currentTier === 'pro' ? 'Current plan: Sorca Pro' : 'Upgrade to Sorca Pro plan for £49 per month'}
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
                { title: 'Dashboard', desc: 'See your clients\' week at a glance' },
                { title: 'Homework Tool', desc: 'Assign & track completion' },
                { title: 'Pattern Alerts', desc: 'Early awareness of shifts' },
                { title: 'Week Summary', desc: 'Shared view with clients' },
                { title: 'Safe Mode', desc: 'Grounding when needed' },
                { title: '10 Clients', desc: 'Included in subscription' },
                { title: 'GDPR Ready', desc: 'Consent flow + audit log' },
                { title: 'Priority Support', desc: 'Clinical team access' },
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
