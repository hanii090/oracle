import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VoiceReviewPage } from './VoiceReviewPage';

export const metadata: Metadata = {
  title: 'Voice Session Review — Sorca Practice',
  description: 'Review your clients\' voice session transcripts, emotional peaks, and risk moments.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void" />}>
      <VoiceReviewPage />
    </Suspense>
  );
}
