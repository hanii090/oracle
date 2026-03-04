'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface MemoryPortraitPreview {
  id: string;
  title: string;
  essence: string;
  palette: string[];
  generatedAt: string;
}

/**
 * End of Life Section — Landing page component for Pro users.
 * Showcases the End of Life feature: legacy mode, memory portraits, thread archive.
 * Only rendered for Pro tier users.
 */
export function EndOfLifeSection() {
  const { getIdToken } = useAuth();
  const [portraits, setPortraits] = useState<MemoryPortraitPreview[]>([]);
  const [archives, setArchives] = useState<{ id: string; recipientName: string; totalSessions: number; createdAt: string; shareUrl: string; isActive: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getIdToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        // Load portraits and archives in parallel
        const [portraitsRes, archivesRes] = await Promise.all([
          fetch('/api/memory-portrait', { headers }).then(r => r.ok ? r.json() : { portraits: [] }),
          fetch('/api/thread-archive', {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'list' }),
          }).then(r => r.ok ? r.json() : { archives: [] }),
        ]);

        setPortraits(portraitsRes.portraits || []);
        setArchives(archivesRes.archives || []);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getIdToken]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="eol-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-amber-500/70 mb-5 flex items-center gap-4">
        🕯️ · Sorca for End of Life
        <div className="flex-1 h-px bg-gradient-to-r from-amber-900/30 to-transparent" aria-hidden="true" />
      </div>
      <h2 id="eol-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        Legacy, Grief, and <em className="font-cormorant italic font-light text-amber-400">Love</em>
      </h2>
      <p className="font-cormorant text-lg text-text-muted mb-16 max-w-2xl">
        A sacred space for the questions that matter most at the end. What do you want to leave behind? What remains unsaid? Sorca helps you articulate the things your family will treasure forever.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {/* Legacy Mode card */}
        <div className="bg-surface border border-amber-900/20 rounded-lg p-8 hover:border-amber-700/30 transition-colors duration-300">
          <span className="text-2xl mb-4 block" aria-hidden="true">🕯️</span>
          <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">Legacy Mode</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            A specialised Sorca mode with questions designed for reflecting on mortality, legacy, and love. Gentler but still unflinching. What do you want them to remember?
          </p>
          <div className="mt-4 font-courier text-[9px] text-amber-500/50 tracking-widest uppercase">
            Activate in any session
          </div>
        </div>

        {/* Memory Portraits card */}
        <div className="bg-surface border border-amber-900/20 rounded-lg p-8 hover:border-amber-700/30 transition-colors duration-300">
          <span className="text-2xl mb-4 block" aria-hidden="true">🖼️</span>
          <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">Memory Portraits</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Sorca distills your legacy sessions into a beautiful portrait: your essence, core values, unsaid words, and a message to those who remain. A soul sketch, not a biography.
          </p>
          <div className="mt-4 font-courier text-[9px] text-amber-500/50 tracking-widest uppercase">
            {portraits.length > 0 ? `${portraits.length} portrait${portraits.length > 1 ? 's' : ''} created` : 'Generated from sessions'}
          </div>
        </div>

        {/* Thread Archive card */}
        <div className="bg-surface border border-amber-900/20 rounded-lg p-8 hover:border-amber-700/30 transition-colors duration-300">
          <span className="text-2xl mb-4 block" aria-hidden="true">📦</span>
          <h3 className="font-cinzel text-sm tracking-[0.05em] text-text-main mb-3">Thread Archive</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Package your entire Sorca journey into a permanent, shareable archive. Your family can access it with a simple link — no account needed. A digital legacy that lasts.
          </p>
          <div className="mt-4 font-courier text-[9px] text-amber-500/50 tracking-widest uppercase">
            {archives.filter(a => a.isActive).length > 0
              ? `${archives.filter(a => a.isActive).length} active archive${archives.filter(a => a.isActive).length > 1 ? 's' : ''}`
              : 'Create from your sessions'
            }
          </div>
        </div>
      </div>

      {/* Recent Memory Portraits */}
      {!loading && portraits.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-text-muted mb-6">
            Your Memory Portraits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portraits.slice(0, 4).map((portrait) => (
              <div
                key={portrait.id}
                className="bg-surface border border-amber-900/15 rounded-lg p-6 hover:border-amber-700/25 transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex gap-1 mt-1">
                    {portrait.palette.map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-cinzel text-xs text-amber-400 mb-1 truncate">{portrait.title}</h4>
                    <p className="font-cormorant text-xs text-text-muted italic leading-relaxed line-clamp-2">
                      {portrait.essence}
                    </p>
                    <p className="font-courier text-[8px] text-text-muted/50 tracking-widest uppercase mt-2">
                      {new Date(portrait.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Archives */}
      {!loading && archives.filter(a => a.isActive).length > 0 && (
        <div>
          <h3 className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-text-muted mb-6">
            Your Thread Archives
          </h3>
          <div className="space-y-3">
            {archives.filter(a => a.isActive).map((archive) => (
              <div
                key={archive.id}
                className="bg-surface border border-amber-900/15 rounded-lg px-6 py-4 flex items-center justify-between hover:border-amber-700/25 transition-colors duration-300"
              >
                <div>
                  <span className="font-cinzel text-xs text-text-main">
                    For {archive.recipientName}
                  </span>
                  <span className="font-courier text-[9px] text-text-muted ml-3">
                    {archive.totalSessions} sessions · {new Date(archive.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${archive.shareUrl}`)}
                  className="font-courier text-[9px] text-amber-500/60 tracking-widest uppercase hover:text-amber-400 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
