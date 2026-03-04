'use client';

import { motion } from 'motion/react';
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
      <header className="w-full max-w-6xl px-6 py-6 flex justify-between items-center absolute top-0 z-50">
        <div className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase">
          Sorca
        </div>
        <div className="flex items-center gap-6">
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="text-xs font-courier text-text-muted uppercase tracking-widest">
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
                className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
                aria-label="Sign in with Google"
              >
                Enter
              </button>
            )
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-20 relative" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.05)_0%,transparent_60%)] pointer-events-none" aria-hidden="true" />
        <div className="w-20 h-10 mb-12 relative z-10" aria-hidden="true">
          <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" role="img" aria-label="Sorca eye symbol">
            <path d="M4 20 C20 4 60 4 76 20 C60 36 20 36 4 20 Z" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.6"/>
            <circle cx="40" cy="20" r="8" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.8"/>
            <circle cx="40" cy="20" r="3" fill="#c9a84c" opacity="0.9"/>
            <circle cx="37" cy="17" r="1.5" fill="white" opacity="0.6"/>
          </svg>
        </div>
        
        <div className="font-cinzel text-[11px] tracking-[0.4em] uppercase text-gold mb-6">
          The question that changes everything
        </div>
        
        <h1 id="hero-title" className="font-cinzel font-black text-6xl md:text-8xl lg:text-9xl tracking-[0.15em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold-bright via-gold to-gold/40 mb-8">
          SORCA
        </h1>
        
        <p className="font-cormorant italic text-xl md:text-2xl text-text-mid max-w-2xl mb-16 leading-relaxed">
          You come with a problem. It asks questions — devastating, surgical, impossibly precise questions — until you find the truth yourself.
        </p>

        <button
          onClick={onStart}
          className="group relative px-8 py-4 font-cinzel text-sm tracking-[0.2em] text-gold uppercase overflow-hidden border border-gold/30 hover:border-gold transition-all duration-500 rounded-lg hover:shadow-[0_0_30px_rgba(201,168,76,0.2)] z-10"
          aria-label={!user ? 'Sign in to start' : hasKey === false ? 'Connect API key' : 'Begin Sorca session'}
        >
          <div className="absolute inset-0 bg-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" aria-hidden="true" />
          <span className="relative z-10">
            {!user ? "Enter the Void (Sign In)" : hasKey === false ? "Connect API Key to Approach" : "Begin Your Session"}
          </span>
        </button>
        {hasKey === false && (
          <p className="mt-4 text-xs text-text-muted max-w-md text-center">
            Sorca requires a paid Google Cloud API key for visual generation. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-gold hover:underline ml-1">Learn more about billing.</a>
          </p>
        )}
      </section>
    </>
  );
}
