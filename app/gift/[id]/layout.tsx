import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A Question Gift — Sorca',
  description: 'Someone sent you a question — the kind that changes a conversation. Open your gift and reflect.',
  openGraph: {
    title: 'A Question Gift — Sorca',
    description: 'Someone sent you a question — the kind that changes a conversation.',
    images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
  },
};

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return children;
}
