import type { Metadata } from 'next';
import { WeekSummariesPage } from './WeekSummariesPage';

export const metadata: Metadata = {
  title: 'Week Summaries — Sorca Practice',
  description: 'View weekly reflection summaries for your clients.',
};

export default function Page() {
  return <WeekSummariesPage />;
}
