import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Week Summary — Sorca',
  description: 'Your weekly reflection summary. Key insights, themes, mood trends, and suggested focus areas from your Sorca sessions.',
  keywords: [
    'weekly summary',
    'therapy reflection',
    'mood tracking',
    'session insights',
    'self-discovery',
    'mental health progress',
  ],
  openGraph: {
    title: 'Week Summary — Sorca',
    description: 'A weekly digest of your self-discovery journey. Themes, insights, and progress.',
    images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Week Summary — Sorca',
    description: 'A weekly digest of your self-discovery journey. Themes, insights, and progress.',
    images: ['/hero-image.png'],
  },
};

export default function SummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
