import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Therapist Connection — Sorca',
  description: 'Accept or decline a therapist connection invite. Control what data you share with granular, revocable consent.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
