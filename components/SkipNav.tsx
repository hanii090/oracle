'use client';

export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-gold focus:text-void focus:font-cinzel focus:text-sm focus:tracking-widest focus:uppercase focus:rounded-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
