'use client';

import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Cursor } from '@/components/Cursor';
import { Stars } from '@/components/Stars';
import { useAuth, Tier, SessionSummary } from '@/hooks/useAuth';

// Extracted landing components
import { HeroSection } from '@/components/landing/HeroSection';
import { SessionHistory } from '@/components/landing/SessionHistory';
import { EvolutionMap } from '@/components/landing/EvolutionMap';
import { PhilosophySection } from '@/components/landing/PhilosophySection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { Footer } from '@/components/landing/Footer';
import { LimitModal } from '@/components/landing/LimitModal';
import { AuthErrorModal } from '@/components/landing/AuthErrorModal';
import { PatternOfTheWeek } from '@/components/landing/PatternOfTheWeek';
import MirrorLetter from '@/components/landing/MirrorLetter';

// Code-split OracleSession — loads only when a session starts (#15)
const SorcaSession = lazy(() =>
  import('@/components/SorcaSession').then(m => ({ default: m.SorcaSession }))
);

function HomeContent() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { user, profile, loading, authError, sessions, signIn, logOut, getIdToken, incrementSession, clearAuthError, loadSessions, verifySubscription } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [viewingSession, setViewingSession] = useState<SessionSummary | null>(null);
  const upgradeProcessedRef = useRef(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [upgradePending, setUpgradePending] = useState(false);

  // #1 FIX: Don't trust URL params for tier upgrades.
  // The webhook handles the actual upgrade server-side.
  // We verify subscription status directly with Stripe as a safety net.
  useEffect(() => {
    if (!upgradeProcessedRef.current && searchParams.get('success') === 'true') {
      upgradeProcessedRef.current = true;

      if (user && !loading) {
        setUpgradePending(true);

        // Poll for tier update — webhook may take a few seconds
        const verifyUpgrade = async () => {
          let attempts = 0;
          const maxAttempts = 8;

          while (attempts < maxAttempts) {
            attempts++;
            const tier = await verifySubscription();
            if (tier && tier !== 'free') {
              setUpgradePending(false);
              await loadSessions();
              router.replace('/');
              return;
            }
            // Wait with increasing delay: 2s, 3s, 4s...
            await new Promise(r => setTimeout(r, 1000 + attempts * 1000));
          }

          // If we get here, tier didn't update — force a final sync
          await verifySubscription();
          await loadSessions();
          setUpgradePending(false);
          router.replace('/');
        };

        verifyUpgrade();
      }
    }
  }, [user, loading, searchParams, router, loadSessions, verifySubscription]);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        try {
          const hasSelected = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(hasSelected);
        } catch (e) {
          console.error("Error checking API key", e);
          setHasKey(true);
        }
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleStart = async () => {
    if (!user) {
      await signIn();
      return;
    }

    // #10 FIX: Validate session server-side, with client-side fallback
    let sessionAllowed = false;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        sessionAllowed = !!data.canStart;
      } else {
        // Server returned an error — fall back to client-side check
        sessionAllowed = await incrementSession();
      }
    } catch {
      // Network error — fall back to client-side check
      sessionAllowed = await incrementSession();
    }

    if (!sessionAllowed) {
      setShowLimitModal(true);
      return;
    }

    if (hasKey === false && typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
        setSessionStarted(true);
      } catch (e) {
        console.error("Error opening key dialog", e);
      }
    } else {
      setSessionStarted(true);
    }
  };

  // #2 FIX: No more silent fallback to free upgrade on Stripe failure
  const handleUpgrade = async (tier: Tier) => {
    if (!user) {
      await signIn();
      return;
    }

    if (tier === 'free') return;
    
    try {
      const token = await getIdToken();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Failed to start checkout. Please try again.');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      setCheckoutError('Unable to connect to payment service. Please try again later.');
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-x-hidden" id="main-content">
      <Cursor />
      <Stars />

      {/* Upgrade processing banner */}
      {upgradePending && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gold/10 border-b border-gold/30 py-3 px-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="font-cinzel text-gold text-sm tracking-widest">Verifying your upgrade...</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!sessionStarted ? (
          <motion.div
            key="landing"
            className="relative z-10 flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroSection
              user={user}
              profile={profile}
              loading={loading}
              hasKey={hasKey}
              onStart={handleStart}
              onSignIn={signIn}
              onLogOut={logOut}
            />

            {/* Previous Sessions */}
            {user && (
              <SessionHistory
                sessions={sessions}
                onViewSession={(session) => {
                  setViewingSession(session);
                  setSessionStarted(true);
                }}
              />
            )}

            {/* Evolution Map — session constellation & belief tracking */}
            {user && sessions.length >= 2 && (
              <EvolutionMap
                sessions={sessions}
                onViewSession={(session) => {
                  setViewingSession(session);
                  setSessionStarted(true);
                }}
              />
            )}

            {/* Pattern of the Week — surfaces recurring theme for paid users */}
            {user && profile && profile.tier !== 'free' && (
              <PatternOfTheWeek />
            )}

            {/* Mirror Letter — monthly first-person reflection for paid users */}
            {user && profile && profile.tier !== 'free' && (
              <MirrorLetter userId={user.uid} isPaidUser={true} />
            )}

            {/* Divider */}
            <div className="w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-border to-transparent my-20" aria-hidden="true" />

            <PhilosophySection />
            <FeaturesSection />
            <PricingSection currentTier={profile?.tier} onUpgrade={handleUpgrade} />
            <Footer />
          </motion.div>
        ) : (
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" role="status">
              <div className="font-cinzel text-gold tracking-widest animate-pulse">Entering the void...</div>
            </div>
          }>
            <SorcaSession
              key="session"
              onExit={() => { setSessionStarted(false); setViewingSession(null); }}
              viewSession={viewingSession}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <LimitModal
        show={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => handleUpgrade('philosopher')}
      />

      <AuthErrorModal
        error={authError || checkoutError}
        onClose={() => { clearAuthError(); setCheckoutError(null); }}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void flex items-center justify-center text-gold font-cinzel tracking-widest">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
