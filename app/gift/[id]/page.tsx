'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Stars } from '@/components/Stars';
import { GiftIcon, StarIcon } from '@/components/icons';

interface Gift {
  id: string;
  question: string;
  recipientName: string;
  opened: boolean;
}

export default function GiftPage() {
  const params = useParams();
  const giftId = params.id as string;
  
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const loadGift = useCallback(async () => {
    try {
      const res = await fetch('/api/question-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', giftId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setGift(data.gift);
      } else {
        const data = await res.json();
        setError(data.error || 'Gift not found');
      }
    } catch {
      setError('Failed to load gift');
    } finally {
      setLoading(false);
    }
  }, [giftId]);

  useEffect(() => {
    if (giftId) {
      loadGift();
    }
  }, [giftId, loadGift]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !gift) return;
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/question-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', giftId: gift.id, answer }),
      });
      
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="text-center px-6">
          <GiftIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
          <h1 className="font-cinzel text-xl text-text-main mb-2">Gift Not Found</h1>
          <p className="text-sm text-text-muted mb-6">{error}</p>
          <a href="/" className="text-gold hover:underline font-cinzel text-sm tracking-widest">
            ← Return to Sorca
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center relative">
      <Stars />
      
      <div className="max-w-lg w-full mx-4 relative z-10">
        {!revealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-surface border border-gold/30 rounded-lg p-12 cursor-pointer"
              onClick={() => setRevealed(true)}
            >
              <GiftIcon size={64} className="mx-auto mb-6 text-gold" />
              <h1 className="font-cinzel text-xl text-gold tracking-widest uppercase mb-3">
                A Question Gift
              </h1>
              <p className="font-cormorant italic text-base text-text-mid mb-6">
                Someone sent you a question — the kind that changes a conversation.
              </p>
              <p className="font-cormorant text-sm text-text-muted">
                For {gift?.recipientName || 'you'}
              </p>
              <div className="mt-8 text-xs text-gold/60 font-courier tracking-widest uppercase">
                Tap to reveal
              </div>
            </motion.div>
          </motion.div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-surface border border-gold/30 rounded-lg p-12">
              <StarIcon size={48} className="mx-auto mb-6 text-gold" />
              <h2 className="font-cinzel text-lg text-gold tracking-widest uppercase mb-4">
                Thank You
              </h2>
              <p className="font-cormorant italic text-base text-text-mid mb-6">
                Your answer has been saved. The person who sent this gift will be notified.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 border border-gold text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors"
              >
                Explore Sorca
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-surface border border-gold/30 rounded-lg p-8">
              <div className="text-center mb-8">
                <StarIcon size={32} className="mx-auto mb-4 text-gold" />
                <p className="font-cormorant italic text-xl text-text-main leading-relaxed">
                  &ldquo;{gift?.question}&rdquo;
                </p>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Take your time. Answer honestly..."
                  rows={5}
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 font-cormorant text-base text-text-main placeholder:text-text-muted/40 focus:border-gold/40 focus:outline-none resize-none"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || submitting}
                    className="flex-1 py-3 bg-gold text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending...' : 'Send My Answer'}
                  </button>
                  <a
                    href="/"
                    className="px-6 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
                  >
                    Skip
                  </a>
                </div>
                
                <p className="text-center text-[10px] text-text-muted font-courier tracking-wider">
                  Your answer will be shared with the person who sent this gift
                </p>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <a href="/" className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest">
                Powered by Sorca
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
