'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface SiteNavProps {
  variant?: 'default' | 'therapist';
}

export function SiteNav({ variant = 'default' }: SiteNavProps) {
  const { user, profile, loading, signIn, logOut, isTherapist } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accentClass = variant === 'therapist' ? 'text-teal' : 'text-gold';
  const accentHover = variant === 'therapist' ? 'hover:text-teal-bright' : 'hover:text-gold-bright';

  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-4 flex justify-between items-center relative z-50">
      <Link href="/" className={`font-cinzel ${accentClass} tracking-[0.3em] text-xs uppercase`}>
        Sorca
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
        <Link href="/for-therapists" className={`text-xs text-text-muted ${accentHover} transition-colors font-courier tracking-widest uppercase`}>
          For Therapists
        </Link>
        <Link href="/refer" className={`text-xs text-text-muted ${accentHover} transition-colors font-courier tracking-widest uppercase`}>
          Self-Referral
        </Link>
        <Link href="/find-therapist" className={`text-xs text-text-muted ${accentHover} transition-colors font-courier tracking-widest uppercase`}>
          Find Therapist
        </Link>
        <Link href="/blog" className={`text-xs text-text-muted ${accentHover} transition-colors font-courier tracking-widest uppercase`}>
          Blog
        </Link>

        {!loading && (
          user ? (
            <div className="flex items-center gap-4">
              {isTherapist ? (
                <Link href="/dashboard" className="text-xs text-teal hover:text-teal-bright transition-colors font-cinzel tracking-widest">
                  Dashboard
                </Link>
              ) : (
                <Link href="/user-dashboard" className="text-xs text-gold hover:text-gold-bright transition-colors font-cinzel tracking-widest">
                  Dashboard
                </Link>
              )}
              <div className="text-[10px] font-courier text-text-muted uppercase tracking-widest">
                {profile?.tier || 'free'}
              </div>
              <button
                onClick={() => logOut()}
                className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className={`text-text-muted ${accentHover} transition-colors font-courier text-xs tracking-widest uppercase border border-text-muted/30 px-4 py-2 rounded hover:border-gold/50`}
              aria-label="Sign in with Google"
            >
              Sign In
            </button>
          )
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 text-text-muted hover:text-gold transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {mobileOpen ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M6 18L18 6" />
            </>
          ) : (
            <>
              <path d="M4 8h16" />
              <path d="M4 16h16" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface border-b border-border px-6 py-4 md:hidden shadow-lg z-50">
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            <Link href="/for-therapists" onClick={() => setMobileOpen(false)} className="text-sm text-text-mid hover:text-gold transition-colors font-courier tracking-wider uppercase py-2">
              For Therapists
            </Link>
            <Link href="/refer" onClick={() => setMobileOpen(false)} className="text-sm text-text-mid hover:text-gold transition-colors font-courier tracking-wider uppercase py-2">
              Self-Referral
            </Link>
            <Link href="/find-therapist" onClick={() => setMobileOpen(false)} className="text-sm text-text-mid hover:text-gold transition-colors font-courier tracking-wider uppercase py-2">
              Find Therapist
            </Link>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="text-sm text-text-mid hover:text-gold transition-colors font-courier tracking-wider uppercase py-2">
              Blog
            </Link>

            <div className="h-px bg-border my-2" />

            {!loading && (
              user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={isTherapist ? "/dashboard" : "/user-dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-gold font-cinzel tracking-widest py-2"
                  >
                    {isTherapist ? 'Practice Dashboard' : 'My Dashboard'}
                  </Link>
                  <button
                    onClick={() => { logOut(); setMobileOpen(false); }}
                    className="text-left text-sm text-text-muted hover:text-gold transition-colors font-courier tracking-wider uppercase py-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { signIn(); setMobileOpen(false); }}
                  className="text-left text-sm text-gold font-courier tracking-wider uppercase py-2"
                >
                  Sign In
                </button>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
