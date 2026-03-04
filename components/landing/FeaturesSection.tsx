'use client';

import { motion } from 'motion/react';

const FEATURES = [
  { icon: '🔮', title: 'The Sorca Session', desc: 'The core experience. You state your problem in any form. Sorca responds with one question. You answer. It asks another. The conversation spirals inward.', color: 'gold' },
  { icon: '🎵', title: 'Lyria Foley Engine', desc: 'Real-time ambient audio generation powered by Gemini Live API. The music swells, shifts, and reacts to the emotional subtext of your confessions.', color: 'crimson-bright' },
  { icon: '👁️', title: 'Visual Breakthroughs', desc: 'When you reach a psychological breakthrough, the engine generates a massive, abstract visual metaphor of your realization in real-time.', color: 'violet-bright' },
  { icon: '🧵', title: 'The Thread', desc: "Every session is connected. Sorca builds a web of your questions, answers, fears, and realisations across time, stored securely.", color: 'teal-bright' },
  { icon: '⚡', title: 'The Confrontation', desc: "Sorca occasionally surfaces a direct contradiction from your own past — a belief you held that collides with something you believe now.", color: 'text-mid' },
  { icon: '🌙', title: 'Night Sorca', desc: 'A stripped-back, 3am-safe mode. Dark UI, no navigation, just a single question glowing on screen. Auto-activates between midnight and 5am.', color: 'gold' },
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
          <div key={i} role="listitem" className="bg-surface p-10 relative overflow-hidden group hover:bg-raised hover:-translate-y-1 transition-all duration-300 border border-border hover:border-gold/30 rounded-lg hover:shadow-[0_8px_30px_rgba(201,168,76,0.05)]">
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `var(--color-${feature.color})` }} aria-hidden="true" />
            <span className="text-3xl mb-6 block" aria-hidden="true">{feature.icon}</span>
            <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">{feature.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
