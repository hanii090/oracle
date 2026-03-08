import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Self-Referral — Sorca',
  description: 'Refer yourself for psychological therapy support. Complete PHQ-9 and GAD-7 assessments, provide your details, and receive a triage recommendation. NHS-aligned self-referral process.',
  keywords: [
    'self-referral',
    'NHS talking therapies',
    'PHQ-9',
    'GAD-7',
    'IAPT self-referral',
    'therapy referral UK',
    'mental health assessment',
  ],
  openGraph: {
    title: 'Self-Referral — Sorca',
    description: 'Refer yourself for psychological therapy support. NHS-aligned assessment and triage.',
    url: '/refer',
    images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
  },
};

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
