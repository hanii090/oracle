'use client';

import { motion } from 'motion/react';
import { SorcaLogo, MusicIcon, VisionIcon, ThreadIcon, BoltIcon, NightIcon, SessionIcon, HomeworkIcon, PrimerIcon, VoiceIcon } from '@/components/icons';

const FEATURES = [
  { 
    Icon: VoiceIcon, 
    title: 'Voice Coach', 
    desc: 'Talk to Sorca like a warm, present listener. Real-time voice conversations powered by ElevenLabs — no typing, no screens. Every session transcribed and saved automatically.',
    emotional: 'Speak your truth aloud',
    color: 'gold',
    isNew: true,
  },
  { 
    Icon: SorcaLogo, 
    title: 'The Sorca Session', 
    desc: 'The core experience. You state your problem in any form — voice or text. Sorca responds with one question. You answer. It asks another. The conversation spirals inward.',
    emotional: 'Where breakthroughs begin',
    color: 'gold',
    isNew: false,
  },
  { 
    Icon: MusicIcon, 
    title: 'Ambient Sound Therapy', 
    desc: 'Real-time ambient audio that adapts to your emotional state. Calming soundscapes powered by AI that help you relax, focus, and process difficult feelings during sessions.',
    emotional: 'Therapeutic soundscapes',
    color: 'crimson-bright',
    isNew: false,
  },
  { 
    Icon: VisionIcon, 
    title: 'Guided Visualisation', 
    desc: 'When you reach a meaningful insight, the engine creates a visual metaphor of your realisation — helping you anchor breakthroughs and revisit them later.',
    emotional: 'Anchor your insights',
    color: 'violet-bright',
    isNew: false,
  },
  { 
    Icon: ThreadIcon, 
    title: 'The Thread', 
    desc: "Every session — voice and text — is connected. Sorca builds a web of your questions, answers, fears, and realisations across time, stored securely.",
    emotional: 'Your journey remembered',
    color: 'teal-bright',
    isNew: false,
  },
  { 
    Icon: BoltIcon, 
    title: 'Thought Challenges', 
    desc: "Sorca surfaces patterns from your past sessions — beliefs that have shifted, contradictions you haven't noticed. Gentle prompts that help you see your own growth.",
    emotional: 'Recognise your patterns',
    color: 'text-mid',
    isNew: false,
  },
  { 
    Icon: NightIcon, 
    title: 'Night Mode', 
    desc: 'A stripped-back, 3am-safe mode. Dark UI, no distractions, just a calm presence when sleep won\'t come. Auto-activates between midnight and 5am with grounding exercises.',
    emotional: 'Support when you need it most',
    color: 'gold',
    isNew: false,
  },
];

const THERAPY_FEATURES = [
  { 
    Icon: VoiceIcon, 
    title: 'Voice Check-In', 
    desc: 'Daily push notification at 9am: "How are you feeling?" Log your mood in 30 seconds, then optionally start a voice session. Streaks, trends, and therapist-visible patterns.',
    emotional: 'A daily moment of awareness',
    color: 'gold',
    isNew: true,
  },
  { 
    Icon: SessionIcon, 
    title: 'Session Debrief', 
    desc: 'Anchor your therapy session\'s key insight within 24 hours. One focused question anchors what matters before it fades.',
    emotional: 'Never lose an insight',
    color: 'teal-bright',
    isNew: false,
  },
  { 
    Icon: HomeworkIcon, 
    title: 'Homework Companion', 
    desc: 'Turn therapy homework into daily check-ins. 75% completion rate vs 20-30% with worksheets. No forms, just conversation.',
    emotional: 'Actually do the work',
    color: 'violet-bright',
    isNew: false,
  },
  { 
    Icon: PrimerIcon, 
    title: 'Pre-Session Primer', 
    desc: '1 hour before therapy: "What do you most want to say today?" Arrive prepared with the thing you almost forgot.',
    emotional: 'Arrive ready',
    color: 'gold',
    isNew: false,
  },
];

export function FeaturesSection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="features-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        II · Core Features
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="features-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
        What Sorca <em className="font-cormorant italic font-light text-gold">Does</em>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="Sorca features">
        {FEATURES.map((feature, i) => (
          <div key={i} role="listitem" className="bg-surface p-10 relative overflow-hidden group hover:bg-raised hover:-translate-y-1 transition-all duration-300 border border-border hover:border-gold/30 rounded-lg hover:shadow-[0_8px_30px_rgba(15,118,110,0.05)]">
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `var(--color-${feature.color})` }} aria-hidden="true" />
            {feature.isNew && (
              <div className="absolute top-4 right-4 bg-gold/15 text-gold text-[9px] font-cinzel tracking-widest px-2 py-0.5 rounded">
                NEW
              </div>
            )}
            <feature.Icon size={32} className="mb-4 text-gold" aria-hidden="true" />
            <div className="font-courier text-[9px] text-gold/60 tracking-widest uppercase mb-2">{feature.emotional}</div>
            <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">{feature.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Therapy Features */}
      <div className="mt-16">
        <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-teal mb-5 flex items-center gap-4">
          For People in Therapy
          <div className="flex-1 h-px bg-gradient-to-r from-teal/30 to-transparent" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Therapy features">
          {THERAPY_FEATURES.map((feature, i) => (
            <div key={i} role="listitem" className="bg-surface p-10 relative overflow-hidden group hover:bg-raised hover:-translate-y-1 transition-all duration-300 border border-teal/20 hover:border-teal/40 rounded-lg hover:shadow-[0_8px_30px_rgba(20,184,166,0.05)]">
              <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-teal" aria-hidden="true" />
              {feature.isNew && (
                <div className="absolute top-4 right-4 bg-teal/15 text-teal text-[9px] font-cinzel tracking-widest px-2 py-0.5 rounded">
                  NEW
                </div>
              )}
              <feature.Icon size={32} className="mb-4 text-teal" aria-hidden="true" />
              <div className="font-courier text-[9px] text-teal/60 tracking-widest uppercase mb-2">{feature.emotional}</div>
              <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">{feature.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
