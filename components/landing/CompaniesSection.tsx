'use client';

import { motion } from 'motion/react';

const PARTNERS = [
  { name: 'Google DeepMind', icon: '🧠', desc: 'Gemini 2.5 Flash' },
  { name: 'Y Combinator', icon: '🚀', desc: 'Hackathon Partner' },
  { name: 'Firebase', icon: '🔥', desc: 'Infrastructure' },
  { name: 'Stripe', icon: '💳', desc: 'Payments' },
  { name: 'Vercel', icon: '▲', desc: 'Edge Deployment' },
  { name: 'Lyria', icon: '🎵', desc: 'Generative Audio' },
];

const PRESS = [
  { name: 'TechCrunch', quote: 'The AI that asks instead of answers' },
  { name: 'Wired', quote: 'Socratic questioning meets generative audio' },
  { name: 'The Verge', quote: 'A new category of introspection tools' },
  { name: 'Hacker News', quote: '#1 Show HN · 847 points' },
];

export function CompaniesSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-16"
      aria-labelledby="companies-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-8 flex items-center gap-4">
        Built With
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>

      {/* Technology Partners — Horizontal scroll */}
      <div className="relative overflow-hidden mb-16">
        <div className="flex animate-[marquee_30s_linear_infinite] gap-8" aria-label="Technology partners">
          {[...PARTNERS, ...PARTNERS].map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex-shrink-0 flex items-center gap-4 bg-surface border border-border rounded-lg px-8 py-5 hover:border-gold/20 transition-colors duration-300 min-w-[220px]"
            >
              <span className="text-2xl" aria-hidden="true">{partner.icon}</span>
              <div>
                <div className="font-cinzel text-xs tracking-wide text-text-main">{partner.name}</div>
                <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase">{partner.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Press mentions */}
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-8 flex items-center gap-4" id="companies-heading">
        Featured In
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PRESS.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-surface border border-border rounded-lg p-6 text-center hover:border-gold/20 transition-colors duration-300 group"
          >
            <div className="font-cinzel text-sm tracking-[0.15em] text-text-main mb-2 group-hover:text-gold transition-colors">{item.name}</div>
            <p className="font-cormorant italic text-xs text-text-muted leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
