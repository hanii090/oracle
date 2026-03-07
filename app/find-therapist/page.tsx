import type { Metadata } from 'next';
import { FindTherapistContent } from './FindTherapistContent';

export const metadata: Metadata = {
  title: 'Find NHS Talking Therapies — Sorca',
  description: 'Find your local NHS Talking Therapies service. Search by postcode to find free psychological therapy near you. Self-refer without needing a GP referral.',
  keywords: [
    'NHS talking therapies',
    'find therapist UK',
    'free therapy NHS',
    'IAPT services',
    'self-referral therapy',
    'mental health support UK',
    'CBT near me',
    'NHS counselling',
    'psychological therapy UK',
  ],
  openGraph: {
    title: 'Find NHS Talking Therapies — Sorca',
    description: 'Find your local NHS Talking Therapies service. Free psychological therapy — self-refer today.',
    url: '/find-therapist',
    images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find NHS Talking Therapies — Sorca',
    description: 'Find your local NHS Talking Therapies service. Free psychological therapy — self-refer today.',
    images: ['/hero-image.png'],
  },
};

export default function FindTherapistPage() {
  return <FindTherapistContent />;
}
