import type { Metadata } from 'next';
import { TherapistDashboard } from './TherapistDashboard';

export const metadata: Metadata = {
  title: 'Therapist Dashboard — Sorca Practice',
  description: 'View your clients\' progress, homework completion, and week summaries. Pattern alerts and session prep briefs.',
};

export default function DashboardPage() {
  return <TherapistDashboard />;
}
