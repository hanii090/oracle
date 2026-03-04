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
      <div className="w-16 h-8 mx-auto mb-8 opacity-40" aria-hidden="true">
        <svg viewBox="0 0 60 30" fill="none">
          <path d="M3 15 C15 3 45 3 57 15 C45 27 15 27 3 15 Z" stroke="#c0392b" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="6" stroke="#c0392b" strokeWidth="0.8" fill="none"/>
          <circle cx="30" cy="15" r="2.5" fill="#c0392b"/>
        </svg>
      </div>
      <div className="font-cinzel text-4xl font-black tracking-[0.3em] text-transparent mb-4" style={{ WebkitTextStroke: '1px rgba(192,57,43,0.3)' }} aria-hidden="true">
        SORCA
      </div>
      <p className="text-xs text-text-muted tracking-[0.1em] mb-2">YC × Google DeepMind Hackathon · March 2026</p>
      <p className="text-xs text-text-muted tracking-[0.1em] mb-6">Next.js 15 · Firebase · Gemini · Stripe · Vercel</p>
      
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
