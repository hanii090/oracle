import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Therapy Profile — Sorca',
  description: 'A client-created, portable therapy profile. Goals, recurring themes, and breakthrough moments shared securely.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
