'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { GiftIcon, StarIcon, CopyIcon, CheckIcon } from '@/components/icons';

/**
 * Question Gift — Feature 16
 * Send someone a deep Sorca question as a beautiful gift.
 */

type GiftState = 'intro' | 'creating' | 'created' | 'list';

interface Gift {
  id: string;
  question: string;
  recipientName: string;
  opened: boolean;
  answered: boolean;
  createdAt: string;
}

export function QuestionGift() {
  const [state, setState] = useState<GiftState>('intro');
  const [recipientName, setRecipientName] = useState('');
  const [gift, setGift] = useState<{ id: string; question: string; shareUrl: string } | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, getIdToken } = useAuth();

  const createGift = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setState('creating');
    try {
      const token = await getIdToken();
      const res = await fetch('/api/question-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'create', recipientName }),
      });
      if (res.ok) {
        const data = await res.json();
        setGift(data.gift);
        setState('created');
      }
    } catch {
      setState('intro');
    } finally {
      setLoading(false);
    }
  }, [user, recipientName, getIdToken]);

  const loadGifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/question-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'list' }),
      });
      if (res.ok) {
        const data = await res.json();
        setGifts(data.gifts || []);
        setState('list');
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  const copyLink = useCallback(async () => {
    if (!gift) return;
    const url = `${window.location.origin}${gift.shareUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [gift]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl px-6 mb-8"
    >
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          {state === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <GiftIcon size={40} className="mx-auto mb-4 text-gold" aria-hidden="true" />
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-3">The Question Gift</h3>
              <p className="font-cormorant italic text-base text-text-mid mb-6 max-w-md mx-auto">
                Send someone a Sorca question — the kind that changes a conversation. They can answer it privately or respond to you. A new way to connect deeply.
              </p>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Their name (optional)"
                className="w-full max-w-xs mx-auto mb-4 bg-raised border border-border rounded-lg px-4 py-2 font-cormorant text-sm text-text-main placeholder:text-text-muted/40 focus:border-gold/40 focus:outline-none text-center block"
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={createGift}
                  disabled={loading}
                  className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-30"
                >
                  Generate a Question
                </button>
                <button
                  onClick={loadGifts}
                  className="px-6 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
                >
                  My Gifts
                </button>
              </div>
            </motion.div>
          )}

          {state === 'creating' && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-cormorant italic text-sm text-text-muted">Selecting the perfect question...</p>
            </motion.div>
          )}

          {state === 'created' && gift && (
            <motion.div key="created" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <div className="bg-raised border border-gold/20 rounded-lg p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />
                <StarIcon size={32} className="mx-auto mb-4 text-gold" aria-hidden="true" />
                <p className="font-cormorant italic text-xl text-text-main leading-relaxed mb-4">
                  &ldquo;{gift.question}&rdquo;
                </p>
                <p className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
                  A question gift for {recipientName || 'someone special'}
                </p>
              </div>
              <button
                onClick={copyLink}
                className="px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors mb-3"
              >
                {copied ? <><CheckIcon size={14} className="inline mr-1" /> Link Copied!</> : <><CopyIcon size={14} className="inline mr-1" /> Copy Share Link</>}
              </button>
              <br />
              <button
                onClick={() => setState('intro')}
                className="mt-3 font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase"
              >
                Send Another
              </button>
            </motion.div>
          )}

          {state === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
              <h3 className="font-cinzel text-sm tracking-[0.15em] text-gold uppercase mb-6">Your Question Gifts</h3>
              {gifts.length === 0 ? (
                <p className="font-cormorant italic text-sm text-text-muted text-center py-4">No gifts sent yet.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {gifts.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GiftIcon size={20} className={g.answered ? 'text-green-400' : g.opened ? 'text-gold/60' : 'text-gold'} />
                        <div>
                          <p className="font-cormorant italic text-sm text-text-mid truncate max-w-[250px]">&ldquo;{g.question}&rdquo;</p>
                          <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase">
                            For {g.recipientName} · {g.answered ? 'Answered' : g.opened ? 'Opened' : 'Unopened'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setState('intro')} className="mt-4 font-courier text-xs text-text-muted hover:text-gold transition-colors tracking-widest uppercase">← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
