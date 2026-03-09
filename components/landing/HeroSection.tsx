'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { Tier, type SessionSummary } from '@/hooks/useAuth';

interface HeroSectionProps {
  user: { uid: string } | null;
  profile: { tier: Tier; sessionsThisMonth: number } | null;
  loading: boolean;
  hasKey: boolean | null;
  onStart: () => void;
  onSignIn: () => void;
  onLogOut: () => void;
}

export function HeroSection({ user, profile, loading, hasKey, onStart, onSignIn, onLogOut }: HeroSectionProps) {
  return (
    <>
      {/* HEADER / AUTH */}
      <header className="w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center absolute top-0 z-50">
        <div className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase">
          Sorca
        </div>
        <div className="flex items-center gap-6">
          {!loading && (
            user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block text-xs font-courier text-text-muted uppercase tracking-widest">
                  {profile?.tier} Tier <span className="text-gold opacity-50 mx-2" aria-hidden="true">|</span> {profile?.tier === 'free' ? `${profile.sessionsThisMonth}/5 Sessions` : '∞ Sessions'}
                </div>
                <button
                  onClick={onLogOut}
                  className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
                  aria-label="Sign out"
                >
                  Depart
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase border border-text-muted/30 px-4 py-2 rounded hover:border-gold/50"
                aria-label="Sign in with Google"
              >
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-4xl mx-auto py-16 sm:py-20 relative" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,57,43,0.04)_0%,transparent_60%)] pointer-events-none" aria-hidden="true" />
        
        <div className="font-cinzel text-[11px] tracking-[0.4em] uppercase text-gold mb-6 relative z-10">
          Voice-First AI Therapy Support · UK Based
        </div>
        
        <h1 id="hero-title" className="font-cinzel font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl tracking-[0.1em] sm:tracking-[0.15em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold-bright via-gold to-gold/40 mb-6">
          SORCA
        </h1>

        <p className="font-cormorant text-lg md:text-xl text-gold/80 mb-8 relative z-10">
          &ldquo;Between sessions, I talk to Sorca. Voice sessions at 2am saved me more than worksheets ever could.&rdquo;
        </p>
        
        <p className="font-cormorant italic text-xl md:text-2xl text-text-mid max-w-2xl mb-6 leading-relaxed">
          The voice-first AI companion for people in therapy. Talk to Sorca like a warm, present listener — complete homework through conversation, track your mood, and arrive at your next appointment ready to go deeper.
        </p>

        <p className="font-courier text-[10px] tracking-[0.2em] uppercase text-text-muted mb-8 max-w-lg">
          Voice sessions · Daily check-ins · NHS-aligned measures · GDPR compliant · UK data hosting
        </p>

        {/* Social Proof */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-12 relative z-10">
          <div className="flex -space-x-3">
            {['/avatars/1.webp', '/avatars/2.webp', '/avatars/3.webp', '/avatars/4.webp', '/avatars/5.webp'].map((src, i) => (
              <Image 
                key={i}
                src={src}
                alt=""
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gold/30 object-cover shadow-[0_0_15px_rgba(192,57,43,0.15)] hover:shadow-[0_0_20px_rgba(192,57,43,0.3)] transition-shadow"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="text-center sm:text-left">
            <div className="font-cinzel text-xs sm:text-sm text-gold">Join patients &amp; therapists across the UK</div>
            <div className="font-courier text-[9px] sm:text-[10px] text-text-muted tracking-wider">AI-assisted homework shows 75% completion (Habicht et al. 2025)</div>
          </div>
        </div>

        <button
          onClick={!user ? onSignIn : onStart}
          className="group relative px-8 py-4 font-cinzel text-sm tracking-[0.2em] text-gold uppercase overflow-hidden border border-gold/30 hover:border-gold transition-all duration-500 rounded-lg hover:shadow-[0_0_30px_rgba(192,57,43,0.2)] z-10"
          aria-label={!user ? 'Begin free - sign in to start' : hasKey === false ? 'Connect API key' : 'Begin Sorca session'}
        >
          <div className="absolute inset-0 bg-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" aria-hidden="true" />
          <span className="relative z-10">
            {!user ? "Begin Free" : hasKey === false ? "Connect API Key" : "Begin Session"}
          </span>
        </button>
        {hasKey === false && (
          <p className="mt-4 text-xs text-text-muted max-w-md text-center">
            Sorca requires a paid Google Cloud API key for visual generation. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-gold hover:underline ml-1">Learn more about billing.</a>
          </p>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-8 relative z-10">
          <span className="text-[10px] font-courier text-gold/70 tracking-wider uppercase border border-gold/20 bg-gold/5 px-3 py-1.5 rounded">
            ✦ Voice Sessions
          </span>
          <span className="text-[10px] font-courier text-text-muted tracking-wider uppercase border border-border px-3 py-1.5 rounded">
            GDPR Compliant
          </span>
          <span className="text-[10px] font-courier text-text-muted tracking-wider uppercase border border-border px-3 py-1.5 rounded">
            UK Data Hosting
          </span>
          <span className="text-[10px] font-courier text-text-muted tracking-wider uppercase border border-border px-3 py-1.5 rounded">
            NHS-Aligned Measures
          </span>
          <span className="text-[10px] font-courier text-text-muted tracking-wider uppercase border border-border px-3 py-1.5 rounded">
            7-Day Free Trial
          </span>
        </div>

        <p className="text-[10px] text-text-muted/80 mt-6 max-w-sm text-center relative z-10">
          Sorca is not therapy and does not provide medical advice. It is a reflective tool designed to complement professional mental health services.
        </p>
      </section>
    </>
  );
}
