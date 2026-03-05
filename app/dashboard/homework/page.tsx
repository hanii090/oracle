import type { Metadata } from 'next';
import { HomeworkAssignmentPage } from './HomeworkAssignmentPage';

export const metadata: Metadata = {
  title: 'Assign Homework — Sorca Practice',
  description: 'Create and manage therapy homework assignments for your clients.',
};

export default function Page() {
  return <HomeworkAssignmentPage />;
}
