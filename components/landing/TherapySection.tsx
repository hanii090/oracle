'use client';

import { motion } from 'motion/react';
import { SessionIcon, HomeworkIcon, PrimerIcon, AnchorIcon, ChartIcon, SafeIcon, BookIcon } from '@/components/icons';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

const THERAPY_FEATURES: { Icon: ComponentType<IconProps>; title: string; desc: string; forPatient: boolean; forTherapist?: boolean }[] = [
  {
    Icon: ChartIcon,
    title: 'PHQ-9 & GAD-7 Tracking',
    desc: 'NHS-standard outcome measures built in. Track your depression and anxiety scores over time with validated questionnaires.',
    forPatient: true,
    forTherapist: true,
  },
  {
    Icon: HomeworkIcon,
    title: 'Homework Companion',
    desc: 'Turn therapy homework into daily conversations. 75% completion rate vs 20-30% with static worksheets.',
    forPatient: true,
  },
  {
    Icon: PrimerIcon,
    title: 'Daily Mood Check-ins',
    desc: 'Quick daily mood tracking with personalised insights. Patterns shared with your therapist (with consent).',
    forPatient: true,
    forTherapist: true,
  },
  {
    Icon: AnchorIcon,
    title: 'Grounding & Coping Tools',
    desc: 'Evidence-based techniques like box breathing, body scans, and 5-4-3-2-1 grounding. Access them instantly when you need support.',
    forPatient: true,
  },
  {
    Icon: BookIcon,
    title: 'Psychoeducation Library',
    desc: 'Learn about CBT, anxiety, depression, and sleep hygiene. Bite-sized content approved by clinical psychologists.',
    forPatient: true,
  },
  {
    Icon: SafeIcon,
    title: 'Relapse Prevention Plan',
    desc: 'Build your personal toolkit: warning signs, coping strategies, support network, and reasons to stay well.',
    forPatient: true,
  },
];

const STATS = [
  { value: '75%', label: 'Homework completion with AI support', source: 'NHS UK Study, 2025' },
  { value: 'PHQ-9', label: 'NHS-standard depression measure', source: 'IAPT compliant' },
  { value: 'GAD-7', label: 'NHS-standard anxiety measure', source: 'IAPT compliant' },
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
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-teal mb-5 flex items-center gap-4">
        Therapy Edition
        <div className="flex-1 h-px bg-gradient-to-r from-teal/30 to-transparent" aria-hidden="true" />
      </div>

      <h2 id="therapy-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        NHS-Aligned <em className="font-cormorant italic font-light text-teal">Therapy Support</em>
      </h2>

      <p className="text-lg text-text-mid leading-relaxed max-w-3xl mb-12">
        Sorca bridges the gap between weekly therapy sessions with NHS-standard outcome measures, 
        evidence-based coping tools, and AI-powered homework support. 
        <strong className="text-teal">Built for UK therapists and their patients.</strong>
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
            className="bg-teal/5 border border-teal/20 rounded-lg p-6 text-center"
          >
            <div className="font-cinzel text-4xl text-teal mb-2">{stat.value}</div>
            <div className="text-sm text-text-mid mb-1">{stat.label}</div>
            <div className="text-[10px] text-text-muted">{stat.source}</div>
          </motion.div>
        ))}
      </div>

      {/* Evidence callout */}
      <div className="bg-surface border border-teal/30 rounded-lg p-6 mb-16">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center">
            <BookIcon size={24} className="text-teal" />
          </div>
          <div>
            <h3 className="font-cinzel text-sm text-teal tracking-wide mb-2">
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
            className="bg-surface p-6 border border-border rounded-lg hover:border-teal/30 transition-colors group"
          >
            <div className="flex items-start gap-3 mb-3">
              <feature.Icon size={24} className="text-teal shrink-0" />
              <div>
                <h4 className="font-cinzel text-sm text-text-main group-hover:text-teal transition-colors">
                  {feature.title}
                </h4>
                {feature.forTherapist && (
                  <span className="text-[9px] text-teal font-cinzel tracking-wider">
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
          <strong className="text-teal">Sorca is not therapy.</strong> It deepens reflection and extends homework. 
          It does not treat, diagnose, or replace the therapeutic relationship.
        </p>
        <a
          href="/for-therapists"
          className="inline-block px-8 py-3 bg-teal/10 border border-teal text-teal font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-teal hover:text-void transition-colors"
        >
          For Therapists →
        </a>
      </div>
    </motion.section>
  );
}
