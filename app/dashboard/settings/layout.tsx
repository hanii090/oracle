import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Settings — Sorca Practice',
  description: 'Configure your practice settings, manage client invites, and update your profile.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
