'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-void flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-8 mx-auto mb-8 opacity-60">
        <svg viewBox="0 0 60 30" fill="none">
          <path d="M3 15 C15 3 45 3 57 15 C45 27 15 27 3 15 Z" stroke="#c42847" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="6" stroke="#c42847" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="2.5" fill="#c42847"/>
        </svg>
      </div>

      <h1 className="font-cinzel text-3xl md:text-5xl text-crimson-bright mb-4">
        The Thread Has Snapped
      </h1>

      <p className="font-cormorant italic text-xl text-text-mid max-w-md mb-2">
        Something went wrong in the depths.
      </p>

      {error.digest && (
        <p className="font-courier text-xs text-text-muted mb-8">
          Error reference: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="px-8 py-3 border border-gold/30 text-gold font-cinzel text-sm tracking-[0.2em] uppercase hover:border-gold hover:bg-gold/10 transition-all duration-300 rounded-lg"
      >
        Try Again
      </button>
    </main>
  );
}
