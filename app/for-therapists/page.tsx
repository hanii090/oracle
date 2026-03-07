import type { Metadata } from 'next';
import { ForTherapistsContent } from './ForTherapistsContent';

export const metadata: Metadata = {
  title: 'For Therapists — Sorca Clinical Practice',
  description: 'Sorca for therapists: Homework assignment tools, week summaries, pattern alerts, and session prep briefs. 75% homework completion vs 20-30% with worksheets. GDPR compliant, ICO registered.',
  keywords: [
    'therapy practice tools',
    'therapist dashboard',
    'CBT homework app',
    'between-session support',
    'clinical AI tool',
    'therapy homework completion',
    'pattern alerts therapist',
    'session prep brief',
    'GDPR therapy tool',
    'UK therapist software',
    'NHS compatible therapy',
  ],
  openGraph: {
    title: 'Sorca for Therapists — Clinical Practice Tools',
    description: 'The context you wish you had. Week summaries, homework tracking, pattern alerts — all before your client walks in.',
    url: '/for-therapists',
    images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sorca for Therapists — Clinical Practice Tools',
    description: 'The context you wish you had. Week summaries, homework tracking, pattern alerts — all before your client walks in.',
    images: ['/hero-image.png'],
  },
};

export default function ForTherapistsPage() {
  return <ForTherapistsContent />;
}
