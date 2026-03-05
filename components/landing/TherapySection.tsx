'use client';

import { motion } from 'motion/react';
import { SessionIcon, HomeworkIcon, PrimerIcon, AnchorIcon, ChartIcon, SafeIcon, BookIcon } from '@/components/icons';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

const THERAPY_FEATURES: { Icon: ComponentType<IconProps>; title: string; desc: string; forPatient: boolean; forTherapist?: boolean }[] = [
  {
    Icon: SessionIcon,
    title: 'Session Debrief',
    desc: "Anchor your therapy session's key insight before it fades. One question, one moment, remembered forever.",
    forPatient: true,
  },
  {
    Icon: HomeworkIcon,
    title: 'Homework Companion',
    desc: 'Turn therapy homework into daily conversations. 75% completion rate vs 20-30% with static worksheets.',
    forPatient: true,
  },
  {
    Icon: PrimerIcon,
    title: 'Pre-Session Primer',
    desc: "What do you most want to say today? Sorca asks 1 hour before your session so you arrive ready.",
    forPatient: true,
  },
  {
    Icon: AnchorIcon,
    title: 'Coping Anchors',
    desc: 'Store the techniques your therapist teaches. Access them instantly when you need grounding.',
    forPatient: true,
  },
  {
    Icon: ChartIcon,
    title: 'Week Summary',
    desc: 'Every Sunday, a one-page digest of what you processed. You read it. Your therapist reads it. Both arrive knowing something true.',
    forPatient: true,
    forTherapist: true,
  },
  {
    Icon: SafeIcon,
    title: 'Safe Messaging Mode',
    desc: 'When distress escalates, Sorca shifts to grounding. No depth beyond level 3. Crisis resources always visible.',
    forPatient: true,
  },
];

const STATS = [
  { value: '75%', label: 'Homework completion with AI support', source: 'NHS UK Study, 2025' },
  { value: '6 days', label: 'Between weekly therapy sessions', source: 'Where Sorca lives' },
  { value: '~100M', label: 'People in therapy without between-session support', source: 'Global estimate' },
];

export function TherapySection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="therapy-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-teal-400 mb-5 flex items-center gap-4">
        Therapy Edition
        <div className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" aria-hidden="true" />
      </div>

      <h2 id="therapy-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        The Space Between <em className="font-cormorant italic font-light text-teal-400">Sessions</em>
      </h2>

      <p className="text-lg text-text-mid leading-relaxed max-w-3xl mb-12">
        Therapy is one hour a week. The other 167 hours, people are on their own — with the thoughts that came up, 
        the homework they probably won't do, and no one to ask them the follow-up question. 
        <strong className="text-teal-400"> That gap is where Sorca belongs.</strong>
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-teal-900/10 border border-teal-500/20 rounded-lg p-6 text-center"
          >
            <div className="font-cinzel text-4xl text-teal-400 mb-2">{stat.value}</div>
            <div className="text-sm text-text-mid mb-1">{stat.label}</div>
            <div className="text-[10px] text-text-muted">{stat.source}</div>
          </motion.div>
        ))}
      </div>

      {/* Evidence callout */}
      <div className="bg-surface border border-teal-500/30 rounded-lg p-6 mb-16">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
            <BookIcon size={24} className="text-teal-400" />
          </div>
          <div>
            <h3 className="font-cinzel text-sm text-teal-400 tracking-wide mb-2">
              Peer-Reviewed Evidence · 2025
            </h3>
            <p className="text-sm text-text-mid leading-relaxed mb-2">
              A study of 244 NHS patients in group-based CBT found that patients using an AI tool between sessions 
              showed <strong className="text-text-main">higher recovery rates, greater attendance, and far higher homework completion</strong> than 
              those using standard worksheets.
            </p>
            <p className="text-xs text-text-muted italic">
              Habicht et al., Journal of Medical Internet Research, March 2025
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <h3 className="font-cinzel text-lg text-text-main mb-8">
        Features for People in Therapy
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {THERAPY_FEATURES.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-surface p-6 border border-border rounded-lg hover:border-teal-500/30 transition-colors group"
          >
            <div className="flex items-start gap-3 mb-3">
              <feature.Icon size={24} className="text-teal-400 shrink-0" />
              <div>
                <h4 className="font-cinzel text-sm text-text-main group-hover:text-teal-400 transition-colors">
                  {feature.title}
                </h4>
                {feature.forTherapist && (
                  <span className="text-[9px] text-teal-400 font-cinzel tracking-wider">
                    + Therapist View
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-sm text-text-muted mb-4">
          <strong className="text-teal-400">Sorca is not therapy.</strong> It deepens reflection and extends homework. 
          It does not treat, diagnose, or replace the therapeutic relationship.
        </p>
        <a
          href="/for-therapists"
          className="inline-block px-8 py-3 bg-teal-500/10 border border-teal-500 text-teal-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-teal-500 hover:text-void transition-colors"
        >
          For Therapists →
        </a>
      </div>
    </motion.section>
  );
}
