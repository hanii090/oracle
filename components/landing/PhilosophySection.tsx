'use client';

import { motion } from 'motion/react';

export function PhilosophySection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="philosophy-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        I · Our Approach
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="philosophy-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
        Evidence-Based <em className="font-cormorant italic font-light text-gold">Therapy</em> Support
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        <div className="space-y-6 font-cormorant text-xl text-text-mid leading-relaxed">
          <p>Therapy works. But it&apos;s one hour per week. <strong className="text-text-main font-semibold">The other 167 hours are where the real change happens</strong> — or doesn&apos;t. Most people leave sessions with powerful insights that fade by Tuesday.</p>
          <p>Sorca bridges that gap. Using <strong className="text-text-main font-semibold">CBT, ACT, motivational interviewing, and Socratic dialogue</strong>, it guides you through reflective conversations that deepen your therapeutic work — between appointments.</p>
          <p>And when you need it most — <strong className="text-text-main font-semibold">at 2am, during a panic, after a hard day</strong> — Sorca is there with voice sessions that feel like talking to a warm, present listener. Every word transcribed, every insight saved for your next session.</p>
          <div className="bg-gold-dim border border-gold/15 border-l-2 border-l-gold p-6 mt-8 rounded-lg" role="blockquote">
            <p className="italic text-base">&quot;75% of clients using AI companions complete their therapy homework, compared to 20-30% with traditional worksheets.&quot; — Habicht et al., Journal of Medical Internet Research, 2025</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4" role="list" aria-label="Sorca's five pillars">
          {[
            { num: 'I', title: 'Between-Session Support', desc: 'Therapy is one hour a week. Sorca fills the other 167 hours with structured reflection, mood tracking, and guided exercises — keeping your therapeutic progress alive between appointments.' },
            { num: 'II', title: 'Voice-First Therapy', desc: 'Talk to Sorca like a warm, present listener. Voice sessions feel natural — no typing, no screens, just your voice and a companion who hears every word. Available 24/7, transcripts auto-saved.' },
            { num: 'III', title: 'Homework That Works', desc: 'Traditional worksheets have a 20-30% completion rate. Sorca turns therapy homework into daily conversational check-ins, achieving 75% completion. Your therapist sees your progress.' },
            { num: 'IV', title: 'Clinical Outcome Tracking', desc: 'PHQ-9, GAD-7, and other validated measures track your progress over weeks and months. See real evidence that therapy is working — and share trends with your therapist.' },
            { num: 'V', title: 'Therapist-Supervised Care', desc: 'Your therapist gets mood trends, pattern alerts, and session prep briefs. Everything consent-gated, GDPR compliant, and designed to make your therapy sessions more productive.' }
          ].map((pillar) => (
            <div key={pillar.num} role="listitem" className="bg-surface border border-border border-l-2 border-l-gold p-8 relative overflow-hidden group hover:bg-raised hover:border-gold transition-colors rounded-lg">
              <div className="absolute right-6 top-1/2 -translate-y-1/2 font-cinzel text-5xl font-black text-border group-hover:text-gold/10 transition-colors" aria-hidden="true">
                {pillar.num}
              </div>
              <h3 className="font-cinzel text-sm tracking-[0.1em] text-gold mb-2 relative z-10">{pillar.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed relative z-10">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
