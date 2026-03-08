import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Outcome Measures — Sorca Practice',
  description: 'Track PHQ-9 and GAD-7 scores across your practice. Recovery rates, reliable improvement, and clinical thresholds.',
};

export default function OutcomesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
