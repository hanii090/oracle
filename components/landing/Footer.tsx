'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5 }}
      className="w-full py-20 text-center relative max-w-6xl mx-auto border-t border-border"
      role="contentinfo"
    >
      <div className="font-cinzel text-4xl font-black tracking-[0.3em] text-transparent mb-6" style={{ WebkitTextStroke: '1px rgba(192,57,43,0.3)' }} aria-hidden="true">
        SORCA
      </div>
      <p className="font-cormorant italic text-sm text-text-muted mb-6 max-w-md mx-auto">
        The AI that never gives answers — only the questions you&apos;ve been avoiding.
      </p>
      <p className="text-xs text-text-muted tracking-[0.1em] mb-8">© {new Date().getFullYear()} Sorca. All rights reserved.</p>
      
      <nav className="flex justify-center gap-6" aria-label="Legal">
        <Link href="/terms" className="text-xs text-text-muted hover:text-gold transition-colors font-courier tracking-widest uppercase">
          Terms
        </Link>
        <Link href="/privacy" className="text-xs text-text-muted hover:text-gold transition-colors font-courier tracking-widest uppercase">
          Privacy
        </Link>
      </nav>
    </motion.footer>
  );
}
