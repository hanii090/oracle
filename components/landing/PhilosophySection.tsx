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
        I · Philosophy
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="philosophy-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-16 text-text-main">
        Why <em className="font-cormorant italic font-light text-gold">Questions</em> Beat Answers
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        <div className="space-y-6 font-cormorant text-xl text-text-mid leading-relaxed">
          <p>Every AI product today does the same thing: <strong className="text-text-main font-semibold">it tells you what to think.</strong> It answers, explains, summarises, recommends. Faster and faster, louder and louder.</p>
          <p>Sorca does the opposite. It believes — as Socrates did — that <strong className="text-text-main font-semibold">the truth is already inside you</strong>. It has never left. It&apos;s just buried under noise, fear, habit, and other people&apos;s opinions.</p>
          <p>You come with a problem. Sorca doesn&apos;t solve it. It asks questions — <strong className="text-text-main font-semibold">devastating, surgical, impossibly precise questions</strong> — until you have solved it yourself. Then it never lets you forget the answer.</p>
          <div className="bg-gold-dim border border-gold/15 border-l-2 border-l-gold p-6 mt-8 rounded-lg" role="blockquote">
            <p className="italic text-base">&quot;I know that I know nothing.&quot; — The only wisdom is knowing you don&apos;t have the answer yet. Sorca helps you find it without giving it to you. That distinction is everything.</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4" role="list" aria-label="Sorca's four pillars">
          {[
            { num: 'I', title: 'Never Answer, Only Ask', desc: 'Every response is a question — not comfort, not advice, not reassurance. Just the question you\'ve been avoiding. The one that makes your chest tighten. The one that, once asked, cannot be unheard. This is where courage begins.' },
            { num: 'II', title: 'Memory as Mirror', desc: "Sorca remembers everything you've said across all sessions. It surfaces patterns you can't see yourself — the stories you tell, the words you repeat, the truths you circle but never land on." },
            { num: 'III', title: 'Progressive Depth', desc: "Questions start surface-level and spiral deeper. By question 7, you're in territory you've never examined. By question 10, you're meeting parts of yourself you forgot existed." },
            { num: 'IV', title: 'The Evolution Map', desc: 'Your thinking is tracked over time. Sorca shows you how your beliefs, fears, and values have shifted — proof that you are not stuck, that change is happening, even when it feels invisible.' }
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
