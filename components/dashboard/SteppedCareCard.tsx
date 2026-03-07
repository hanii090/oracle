'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface SteppedCareCardProps {
  tier?: string;
}

const STEPS = [
  {
    step: 1,
    title: 'Self-Help & Guided Support',
    description: 'App-based tools, psychoeducation, and guided self-reflection. Suitable if you\'re experiencing mild symptoms.',
    tools: ['Sorca sessions', 'Mood journal', 'Grounding exercises', 'Psychoeducation library'],
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
  },
  {
    step: 2,
    title: 'Low-Intensity Interventions',
    description: 'Guided CBT, group therapy, or IAPT self-referral. NHS Talking Therapies are free and available across England.',
    tools: ['NHS IAPT self-referral', 'Guided CBT courses', 'Group therapy', 'Online programmes'],
    color: 'text-gold',
    borderColor: 'border-gold/30',
    bgColor: 'bg-gold/5',
  },
  {
    step: 3,
    title: '1:1 Therapy',
    description: 'Individual therapy with a qualified professional. Private or NHS. Recommended if symptoms are moderate to severe.',
    tools: ['Find a therapist on Sorca', 'Private therapy', 'NHS referral via GP', 'BACP/UKCP directory'],
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/5',
  },
  {
    step: 4,
    title: 'Specialist Services',
    description: 'Specialist mental health services for complex or severe conditions. Usually accessed via GP or crisis team referral.',
    tools: ['Community Mental Health Team', 'Psychiatry', 'Crisis team', 'Inpatient services'],
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
  },
];

export function SteppedCareCard({ tier }: SteppedCareCardProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div>
      <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
        Stepped Care Pathway
      </h2>
      <p className="text-xs text-text-muted mb-5">
        The NHS uses a stepped care model. Here&apos;s where different levels of support fit.
      </p>

      <div className="space-y-3">
        {STEPS.map(step => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.step * 0.1 }}
            className={`border rounded-lg overflow-hidden ${step.borderColor}`}
          >
            <button
              onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
              className={`w-full text-left p-4 ${step.bgColor} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-cinzel text-lg ${step.color}`}>{step.step}</span>
                <div>
                  <h3 className={`font-cinzel text-sm ${step.color}`}>{step.title}</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">{step.description}</p>
                </div>
              </div>
            </button>

            {expandedStep === step.step && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-4 border-t border-border"
              >
                <h4 className="text-[9px] text-text-muted font-courier tracking-wider uppercase mt-3 mb-2">
                  Available tools & resources
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {step.tools.map(tool => (
                    <span key={tool} className={`text-[9px] px-2 py-1 rounded ${step.bgColor} ${step.color} border ${step.borderColor}`}>
                      {tool}
                    </span>
                  ))}
                </div>

                {step.step === 2 && (
                  <div className="mt-3 p-3 bg-surface border border-border rounded-lg">
                    <p className="text-xs text-text-mid mb-2">
                      <strong className="text-gold">NHS Talking Therapies</strong> (formerly IAPT) are free and you can self-refer without a GP.
                    </p>
                    <a
                      href="https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-gold hover:text-gold/80 font-courier tracking-wider"
                    >
                      Find your local service →
                    </a>
                  </div>
                )}

                {step.step === 3 && (
                  <div className="mt-3 p-3 bg-surface border border-border rounded-lg">
                    <p className="text-xs text-text-mid mb-2">
                      Look for therapists registered with <strong className="text-gold">BACP</strong>, <strong className="text-gold">UKCP</strong>, or <strong className="text-gold">BPS</strong> for quality assurance.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Crisis Info */}
      <div className="mt-4 p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-400">
          <strong>In crisis?</strong> Samaritans: <strong>116 123</strong> (24/7, free) · Crisis Text Line: Text <strong>SHOUT</strong> to <strong>85258</strong> · Emergency: <strong>999</strong>
        </p>
      </div>
    </div>
  );
}
