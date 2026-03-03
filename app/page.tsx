'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Cursor } from '@/components/Cursor';
import { Stars } from '@/components/Stars';
import { OracleSession } from '@/components/OracleSession';
import { useAuth, Tier, SessionSummary } from '@/hooks/useAuth';

import { Suspense } from 'react';

function HomeContent() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { user, profile, loading, authError, sessions, signIn, logOut, upgradeTier, incrementSession, clearAuthError, loadSessions } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [viewingSession, setViewingSession] = useState<SessionSummary | null>(null);
  const [upgradeProcessed, setUpgradeProcessed] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading && !upgradeProcessed && searchParams.get('success') === 'true') {
      const tier = searchParams.get('tier') as Tier;
      if (tier) {
        setUpgradeProcessed(true);
        upgradeTier(tier).then(() => {
          router.replace('/');
        });
      }
    }
  }, [user, loading, upgradeProcessed, searchParams, router, upgradeTier]);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        try {
          const hasSelected = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(hasSelected);
        } catch (e) {
          console.error("Error checking API key", e);
          setHasKey(true); // Fallback
        }
      } else {
        setHasKey(true); // Fallback if not in AI Studio
      }
    };
    checkKey();
  }, []);

  const handleStart = async () => {
    if (!user) {
      await signIn();
      return;
    }

    const canStart = await incrementSession();
    if (!canStart) {
      setShowLimitModal(true);
      return;
    }

    if (hasKey === false && typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true); // Assume success to mitigate race condition
        setSessionStarted(true);
      } catch (e) {
        console.error("Error opening key dialog", e);
      }
    } else {
      setSessionStarted(true);
    }
  };

  const handleUpgrade = async (tier: Tier) => {
    if (!user) {
      await signIn();
      return;
    }
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.warn('Stripe checkout failed, falling back to local upgrade:', data.error);
        await upgradeTier(tier);
        setShowLimitModal(false);
      }
    } catch (e) {
      console.error('Checkout error:', e);
      await upgradeTier(tier);
      setShowLimitModal(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <Cursor />
      <Stars />

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
            {/* HEADER / AUTH */}
            <header className="w-full max-w-6xl px-6 py-6 flex justify-between items-center absolute top-0 z-50">
              <div className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase">
                Oracle
              </div>
              <div className="flex items-center gap-6">
                {!loading && (
                  user ? (
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-courier text-text-muted uppercase tracking-widest">
                        {profile?.tier} Tier <span className="text-gold opacity-50 mx-2">|</span> {profile?.tier === 'free' ? `${profile.sessionsThisMonth}/5 Sessions` : '∞ Sessions'}
                      </div>
                      <button
                        onClick={logOut}
                        className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase cursor-none"
                      >
                        Depart
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={signIn}
                      className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase cursor-none"
                    >
                      Enter
                    </button>
                  )
                )}
              </div>
            </header>

            {/* HERO */}
            <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-20 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.05)_0%,transparent_60%)] pointer-events-none" />
              <div className="w-20 h-10 mb-12 relative z-10">
                <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M4 20 C20 4 60 4 76 20 C60 36 20 36 4 20 Z" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.6"/>
                  <circle cx="40" cy="20" r="8" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.8"/>
                  <circle cx="40" cy="20" r="3" fill="#c9a84c" opacity="0.9"/>
                  <circle cx="37" cy="17" r="1.5" fill="white" opacity="0.6"/>
                </svg>
              </div>
              
              <div className="font-cinzel text-[11px] tracking-[0.4em] uppercase text-gold mb-6">
                The AI that never answers
              </div>
              
              <h1 className="font-cinzel font-black text-6xl md:text-8xl lg:text-9xl tracking-[0.15em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold-bright via-gold to-gold/40 mb-8">
                ORACLE
              </h1>
              
              <p className="font-cormorant italic text-xl md:text-2xl text-text-mid max-w-2xl mb-16 leading-relaxed">
                You come with a problem. It asks questions — devastating, surgical, impossibly precise questions — until you find the truth yourself.
              </p>

              <button
                onClick={handleStart}
                className="group relative px-8 py-4 font-cinzel text-sm tracking-[0.2em] text-gold uppercase overflow-hidden border border-gold/30 hover:border-gold transition-all duration-500 cursor-none rounded-lg hover:shadow-[0_0_30px_rgba(201,168,76,0.2)] z-10"
              >
                <div className="absolute inset-0 bg-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10">
                  {!user ? "Enter the Void (Sign In)" : hasKey === false ? "Connect API Key to Approach" : "Approach the Oracle"}
                </span>
              </button>
              {hasKey === false && (
                <p className="mt-4 text-xs text-text-muted max-w-md text-center">
                  Oracle requires a paid Google Cloud API key for Nano Banana 2 visual generation. 
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-gold hover:underline ml-1">Learn more about billing.</a>
                </p>
              )}
            </section>

            {/* PREVIOUS SESSIONS */}
            {user && (
              <section className="w-full max-w-4xl px-6 mt-4 mb-8 relative z-10">
                <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
                  Your Past Sessions
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                </div>
                {sessions.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setViewingSession(session);
                          setSessionStarted(true);
                        }}
                        className="w-full text-left bg-surface border border-border hover:border-gold/30 p-5 rounded-lg transition-all duration-300 hover:bg-raised group cursor-none"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-cinzel text-xs text-gold tracking-widest">
                            Depth {session.maxDepth}
                          </div>
                          <div className="font-courier text-[10px] text-text-muted">
                            {new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <p className="font-cormorant italic text-text-mid text-base truncate">
                          &ldquo;{session.preview}&rdquo;
                        </p>
                        <div className="font-courier text-[10px] text-text-muted mt-2">
                          {session.messageCount} exchanges
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-border/30 rounded-lg bg-surface/30">
                    <div className="text-3xl mb-4 opacity-40">🕯️</div>
                    <p className="font-cormorant italic text-text-muted text-lg">No sessions archived yet</p>
                    <p className="font-courier text-[10px] text-text-muted/60 mt-2 tracking-widest uppercase">Complete a session and depart to archive it here</p>
                  </div>
                )}
              </section>
            )}

            {/* Divider */}
            <div className="w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-border to-transparent my-20" />

            {/* PHILOSOPHY */}
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl px-6 py-20"
            >
              <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
                I · Philosophy
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>
              <h2 className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
                Why <em className="font-cormorant italic font-light text-gold">Questions</em> Beat Answers
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
                <div className="space-y-6 font-cormorant text-xl text-text-mid leading-relaxed">
                  <p>Every AI product today does the same thing: <strong className="text-text-main font-semibold">it tells you what to think.</strong> It answers, explains, summarises, recommends. Faster and faster, louder and louder.</p>
                  <p>Oracle does the opposite. It believes — as Socrates did — that <strong className="text-text-main font-semibold">the truth is already inside you</strong>. It has never left. It&apos;s just buried under noise, fear, habit, and other people&apos;s opinions.</p>
                  <p>You come with a problem. Oracle doesn&apos;t solve it. It asks questions — <strong className="text-text-main font-semibold">devastating, surgical, impossibly precise questions</strong> — until you have solved it yourself. Then it never lets you forget the answer.</p>
                  <div className="bg-gold-dim border border-gold/15 border-l-2 border-l-gold p-6 mt-8 rounded-lg">
                    <p className="italic text-base">&quot;I know that I know nothing.&quot; — The only wisdom is knowing you don&apos;t have the answer yet. Oracle helps you find it without giving it to you. That distinction is everything.</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {[
                    { num: 'I', title: 'Never Answer, Only Ask', desc: 'Every response is a question. Not a platitude. Not a suggestion. A question that cuts to what you actually need to face.' },
                    { num: 'II', title: 'Memory as Mirror', desc: 'Oracle remembers everything you\'ve said across all sessions. It surfaces patterns you can\'t see yourself.' },
                    { num: 'III', title: 'Progressive Depth', desc: 'Questions start surface-level and spiral deeper. By question 7, you\'re in territory you\'ve never examined.' },
                    { num: 'IV', title: 'The Evolution Map', desc: 'Your thinking is tracked over time. Oracle shows you how your beliefs, fears, and values have shifted.' }
                  ].map((pillar) => (
                    <div key={pillar.num} className="bg-surface border border-border border-l-2 border-l-gold p-8 relative overflow-hidden group hover:bg-raised hover:border-gold transition-colors rounded-lg">
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 font-cinzel text-5xl font-black text-border group-hover:text-gold/10 transition-colors">
                        {pillar.num}
                      </div>
                      <h3 className="font-cinzel text-sm tracking-[0.1em] text-gold mb-2 relative z-10">{pillar.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed relative z-10">{pillar.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* FEATURES */}
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl px-6 py-20"
            >
              <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
                II · Core Features
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>
              <h2 className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
                What Oracle <em className="font-cormorant italic font-light text-gold">Does</em>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: '🔮', title: 'The Oracle Session', desc: 'The core experience. You state your problem in any form. Oracle responds with one question. You answer. It asks another. The conversation spirals inward.', color: 'gold' },
                  { icon: '🎵', title: 'Lyria Foley Engine', desc: 'Real-time ambient audio generation powered by Gemini Live API. The music swells, shifts, and reacts to the emotional subtext of your confessions.', color: 'crimson-bright' },
                  { icon: '👁️', title: 'Nano Banana 2 Visuals', desc: 'When you reach a psychological breakthrough, the engine generates a massive, abstract visual metaphor of your realization in real-time.', color: 'violet-bright' },
                  { icon: '🧵', title: 'The Thread', desc: 'Every session is connected. Oracle builds a web of your questions, answers, fears, and realisations across time, stored securely.', color: 'teal-bright' },
                  { icon: '⚡', title: 'The Confrontation', desc: 'Oracle occasionally surfaces a direct contradiction from your own past — a belief you held that collides with something you believe now.', color: 'text-mid' },
                  { icon: '🌙', title: 'Night Oracle', desc: 'A stripped-back, 3am-safe mode. Dark UI, no navigation, just a single question glowing on screen.', color: 'gold' }
                ].map((feature, i) => (
                  <div key={i} className="bg-surface p-10 relative overflow-hidden group hover:bg-raised hover:-translate-y-1 transition-all duration-300 border border-border hover:border-gold/30 rounded-lg hover:shadow-[0_8px_30px_rgba(201,168,76,0.05)]">
                    <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity`} style={{ backgroundColor: `var(--color-${feature.color})` }} />
                    <span className="text-3xl mb-6 block">{feature.icon}</span>
                    <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">{feature.title}</h3>
                    <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>
            
            {/* PRICING */}
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl px-6 py-20 mb-20"
            >
              <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
                X · Business Model
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>
              <h2 className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
                Three Tiers of <em className="font-cormorant italic font-light text-gold">Depth</em>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Seeker */}
                <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(201,168,76,0.05)] flex flex-col">
                  <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Seeker</div>
                  <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1">Free</div>
                  <div className="text-xs text-text-muted mb-10">Forever free · No card required</div>
                  <ul className="space-y-4 flex-1">
                    {['5 sessions per month', 'Basic Thread (last 30 days)', 'Up to depth level 5', 'Sacred question tracking'].map((item, i) => (
                      <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold">◆</span>{item}</li>
                    ))}
                    {['Voice Oracle', 'Excavation Reports', 'Full Thread history'].map((item, i) => (
                      <li key={i} className="text-sm text-text-muted pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-text-muted">◆</span>{item}</li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('free')}
                    disabled={profile?.tier === 'free'}
                    className="mt-8 w-full py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profile?.tier === 'free' ? 'Current Tier' : 'Select'}
                  </button>
                </div>

                {/* Philosopher */}
                <div className="bg-raised p-12 border border-gold/30 relative rounded-lg hover:border-gold hover:shadow-[0_8px_30px_rgba(201,168,76,0.15)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gold text-void font-cinzel text-[9px] tracking-[0.15em] px-4 py-1 rounded-b-md">Most Popular</div>
                  <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3 mt-2">Philosopher</div>
                  <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>12</div>
                  <div className="text-xs text-text-muted mb-10">per month · or £99/year</div>
                  <ul className="space-y-4 flex-1">
                    {['Unlimited sessions', 'Full Thread — entire history', 'All depth levels (to the abyss)', 'Voice Oracle with emotion detection', 'Night Oracle mode', 'Monthly Excavation Reports', 'Confrontation feature'].map((item, i) => (
                      <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold">◆</span>{item}</li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('philosopher')}
                    disabled={profile?.tier === 'philosopher'}
                    className="mt-8 w-full py-3 bg-gold/10 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded hover:bg-gold hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profile?.tier === 'philosopher' ? 'Current Tier' : 'Upgrade'}
                  </button>
                </div>

                {/* Oracle Pro */}
                <div className="bg-surface p-12 border border-border rounded-lg hover:border-gold/30 transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(201,168,76,0.05)] flex flex-col">
                  <div className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-text-muted mb-3">Oracle Pro</div>
                  <div className="font-cinzel text-5xl font-black text-text-main leading-none mb-1"><sup className="text-xl text-gold">£</sup>49</div>
                  <div className="text-xs text-text-muted mb-10">per month · practitioner tier</div>
                  <ul className="space-y-4 flex-1">
                    {['Everything in Philosopher', '5 client accounts included', 'Client Thread visibility', 'Therapist/coach dashboard', 'Session annotation tools', 'API access (1000 calls/mo)'].map((item, i) => (
                      <li key={i} className="text-sm text-text-mid pl-5 relative"><span className="absolute left-0 top-1.5 text-[6px] text-gold">◆</span>{item}</li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('pro')}
                    disabled={profile?.tier === 'pro'}
                    className="mt-8 w-full py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profile?.tier === 'pro' ? 'Current Tier' : 'Upgrade'}
                  </button>
                </div>
              </div>
            </motion.section>

            {/* FOOTER */}
            <motion.footer 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
              className="w-full py-20 text-center relative max-w-6xl mx-auto border-t border-border"
            >
              <div className="w-16 h-8 mx-auto mb-8 opacity-40">
                <svg viewBox="0 0 60 30" fill="none">
                  <path d="M3 15 C15 3 45 3 57 15 C45 27 15 27 3 15 Z" stroke="#c9a84c" strokeWidth="0.8" fill="none"/>
                  <circle cx="30" cy="15" r="6" stroke="#c9a84c" strokeWidth="0.8" fill="none"/>
                  <circle cx="30" cy="15" r="2.5" fill="#c9a84c"/>
                </svg>
              </div>
              <div className="font-cinzel text-4xl font-black tracking-[0.3em] text-transparent mb-4" style={{ WebkitTextStroke: '1px rgba(201,168,76,0.3)' }}>
                ORACLE
              </div>
              <p className="text-xs text-text-muted tracking-[0.1em] mb-2">YC × Google DeepMind Hackathon · March 26, 2026</p>
              <p className="text-xs text-text-muted tracking-[0.1em]">Next.js 15 · Supabase · Gemini 3 · pgvector · ElevenLabs · Vercel</p>
            </motion.footer>
          </motion.div>
        ) : (
          <OracleSession key="session" onExit={() => { setSessionStarted(false); setViewingSession(null); }} viewSession={viewingSession} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-gold/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-gold/10"
            >
              <h3 className="font-cinzel text-xl text-gold mb-4">The Thread is Frayed</h3>
              <p className="font-cormorant text-text-mid mb-8 text-lg">
                You have reached your limit of 5 sessions for this moon cycle. To delve deeper into the abyss, you must ascend to the Philosopher tier.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Retreat
                </button>
                <button
                  onClick={() => handleUpgrade('philosopher')}
                  className="px-6 py-2 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-void transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Ascend (£12/mo)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-crimson/30 p-8 rounded-lg max-w-md text-center shadow-2xl shadow-crimson/10"
            >
              <h3 className="font-cinzel text-xl text-crimson mb-4">Authentication Error</h3>
              <p className="font-cormorant text-text-mid mb-8 text-lg">
                {authError}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={clearAuthError}
                  className="px-6 py-2 border border-border text-text-muted hover:text-text-main hover:border-text-main transition-colors font-cinzel text-xs tracking-widest uppercase rounded cursor-none"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
