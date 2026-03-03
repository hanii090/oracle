import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-void flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-8 mx-auto mb-8 opacity-40">
        <svg viewBox="0 0 60 30" fill="none">
          <path d="M3 15 C15 3 45 3 57 15 C45 27 15 27 3 15 Z" stroke="#c9a84c" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="6" stroke="#c9a84c" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="2.5" fill="#c9a84c"/>
        </svg>
      </div>

      <h1 className="font-cinzel text-4xl md:text-6xl text-gold mb-4 tracking-[0.15em]">
        404
      </h1>

      <p className="font-cormorant italic text-xl text-text-mid max-w-md mb-2">
        The path you seek does not exist in this realm.
      </p>

      <p className="font-courier text-xs text-text-muted mb-12 tracking-widest uppercase">
        Perhaps the question was wrong
      </p>

      <Link
        href="/"
        className="px-8 py-3 border border-gold/30 text-gold font-cinzel text-sm tracking-[0.2em] uppercase hover:border-gold hover:bg-gold/10 transition-all duration-300 rounded-lg"
      >
        Return to the Oracle
      </Link>
    </main>
  );
}
