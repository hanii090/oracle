'use client';

import { motion } from 'motion/react';

/**
 * Coming Soon Section — Teams & End of Life features
 * Shows upcoming features that are in development.
 */

const COMING_SOON = [
  {
    icon: '🏢',
    title: 'Sorca for Teams',
    desc: 'Leadership teams do weekly Sorca sessions on a shared theme. Each member answers privately. Sorca aggregates anonymised patterns. Not therapy. Not consulting. Something new.',
    tag: 'B2B · Q3 2026',
    color: 'gold',
  },
  {
    icon: '🕯️',
    title: 'Sorca for End of Life',
    desc: 'A specialised mode for legacy, grief, and love. Questions about what you want to leave behind. Visual memory portraits. A permanent Thread archive for your family. The most meaningful thing AI could do.',
    tag: 'Clinical Partnership · 2027',
    color: 'crimson',
  },
  {
    icon: '🌐',
    title: 'Thread API',
    desc: 'Open your Thread to other tools. Export your beliefs, patterns, and growth data to therapy apps, journals, and personal knowledge graphs. Your data, your choice.',
    tag: 'Developer Preview · Q4 2026',
    color: 'teal',
  },
];

export function ComingSoonSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="coming-soon-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        V · What&apos;s Next
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="coming-soon-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        Coming <em className="font-cormorant italic font-light text-gold">Soon</em>
      </h2>
      <p className="font-cormorant text-lg text-text-muted mb-16 max-w-2xl">
        Features in development that will deepen what Sorca can do. Some are months away. Some are years. All are inevitable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMING_SOON.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="bg-surface border border-border rounded-lg p-10 relative overflow-hidden group hover:border-gold/20 transition-all duration-300"
          >
            {/* Coming Soon badge */}
            <div className="absolute top-4 right-4">
              <span className="font-courier text-[8px] tracking-widest uppercase text-text-muted border border-border px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>

            <span className="text-3xl mb-6 block opacity-60" aria-hidden="true">{feature.icon}</span>
            <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">{feature.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed mb-4">{feature.desc}</p>
            <div className="font-courier text-[9px] text-gold/60 tracking-widest uppercase">
              {feature.tag}
            </div>

            {/* Subtle overlay to indicate "not yet" */}
            <div className="absolute inset-0 bg-void/30 pointer-events-none opacity-0 group-hover:opacity-0" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
