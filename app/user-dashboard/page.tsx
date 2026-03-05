import type { Metadata } from 'next';
import { UserDashboard } from './UserDashboard';

export const metadata: Metadata = {
  title: 'Your Dashboard — Sorca',
  description: 'Your personal reflection hub. Track sessions, view week summaries, complete therapy homework, and access coping anchors. AI-assisted self-discovery between therapy sessions.',
  keywords: [
    'therapy dashboard',
    'session history',
    'week summaries',
    'therapy homework',
    'coping anchors',
    'self-reflection',
    'between-session support',
    'mental health tracking',
  ],
  openGraph: {
    title: 'Your Dashboard — Sorca',
    description: 'Track your self-discovery journey. Sessions, insights, and homework all in one place.',
    url: '/user-dashboard',
  },
};

export default function UserDashboardPage() {
  return <UserDashboard />;
}
