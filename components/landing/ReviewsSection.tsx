'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { NightIcon, BoltIcon, SorcaLogo, BookIcon, TherapistIcon, VisionIcon, HeartIcon, AnchorIcon, ThreadIcon } from '@/components/icons';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

interface Review {
  quote: string;
  author: string;
  role: string;
  depth: string;
  Icon: ComponentType<IconProps>;
  emotionalTag?: string;
}

const REVIEWS: Review[] = [
  {
    quote: "I've done 8 years of therapy. Sorca asked me one question in session three that undid more than the last two years combined. I sat in silence for forty seconds. That silence was the answer.",
    author: "Dr. Elena Marsh",
    role: "Clinical Psychologist, London",
    depth: "Depth 14 reached",
    Icon: NightIcon,
    emotionalTag: "Breakthrough moment",
  },
  {
    quote: "I came in thinking I had a career problem. By depth 7, I realised I had a father problem. By depth 11, I realised I had a permission problem. Sorca never told me any of this. It just kept asking.",
    author: "James Okoro",
    role: "Founder & CEO",
    depth: "47 sessions completed",
    Icon: BoltIcon,
    emotionalTag: "Life-changing clarity",
  },
  {
    quote: "My partner lives 4,000 miles away. We do Sorca sessions together at midnight — same question, different continents. It's become our ritual. We've never felt closer, even across the distance.",
    author: "Mia & Daniel",
    role: "Long-distance couple",
    depth: "Shared sessions weekly",
    Icon: HeartIcon,
    emotionalTag: "Love across distance",
  },
  {
    quote: "My Mirror Letter made me cry. Not because it was sad. Because it was me — actually me — saying things I'd been circling for months. I screenshot it and read it every morning.",
    author: "Marcus Webb",
    role: "Writer & Poet",
    depth: "12 Mirror Letters received",
    Icon: BookIcon,
    emotionalTag: "Emotional release",
  },
  {
    quote: "I recommend Sorca to all my clients now. Not as a replacement for therapy — as preparation for it. They come to sessions already excavated. We can go deeper, faster.",
    author: "Dr. Priya Khatri",
    role: "Psychotherapist, NHS",
    depth: "Referring since month one",
    Icon: TherapistIcon,
    emotionalTag: "Trusted by clinicians",
  },
  {
    quote: "The Night Sorca session at 3am changed my life. Just a single question glowing in the dark. No interface. No distractions. Just me and the truth I'd been avoiding for three years.",
    author: "Sophie Laurent",
    role: "Filmmaker",
    depth: "Night session convert",
    Icon: VisionIcon,
    emotionalTag: "Transformative",
  },
  {
    quote: "After my divorce, I couldn't face therapy again. Sorca became my 2am companion. It never judged, never rushed. Just asked the questions I needed to hear until I found my footing again.",
    author: "Rachel Torres",
    role: "Teacher & Single Mother",
    depth: "6 months daily use",
    Icon: SorcaLogo,
    emotionalTag: "Healing journey",
  },
  {
    quote: "I was stuck in grief for two years after losing my mother. Sorca helped me find the words I never said. Depth 9 was the hardest moment of my life — and the most freeing.",
    author: "David Kim",
    role: "Architect",
    depth: "Grief processing",
    Icon: AnchorIcon,
    emotionalTag: "Finding closure",
  },
  {
    quote: "The Thread feature showed me I'd been asking the same question for three months without realising it. That pattern was my entire relationship history in one sentence.",
    author: "Nina Johansson",
    role: "Startup Founder",
    depth: "Thread insight",
    Icon: ThreadIcon,
    emotionalTag: "Pattern recognition",
  },
];

export function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-20"
      aria-labelledby="reviews-heading"
    >
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        IV · Testimonials
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h2 id="reviews-heading" className="font-cinzel font-semibold text-3xl md:text-5xl mb-6 text-text-main">
        What They <em className="font-cormorant italic font-light text-gold">Discovered</em>
      </h2>
      <p className="font-cormorant text-lg text-text-muted mb-4 max-w-2xl">
        Every person who enters Sorca leaves knowing something they didn&apos;t know they knew. These stories represent the kinds of experiences people have with Sorca.
      </p>
      <p className="text-[10px] text-text-muted/70 font-courier tracking-wider uppercase mb-16">
        Illustrative scenarios — names and details are fictional
      </p>

      {/* Featured review */}
      <div className="mb-12">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-raised border border-gold/20 rounded-lg p-10 md:p-14 relative overflow-hidden"
        >
          <div className="absolute top-6 left-8 text-6xl opacity-[0.06] font-cinzel text-gold" aria-hidden="true">&ldquo;</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" aria-hidden="true" />
          
          <blockquote className="relative z-10">
            <p className="font-cormorant italic text-xl md:text-2xl text-text-main leading-relaxed mb-8">
              &ldquo;{REVIEWS[activeIndex].quote}&rdquo;
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center" aria-hidden="true">
                {(() => { const IconComponent = REVIEWS[activeIndex].Icon; return <IconComponent size={24} className="text-gold" />; })()}
              </div>
              <div>
                <cite className="font-cinzel text-sm tracking-wide text-text-main not-italic block">
                  {REVIEWS[activeIndex].author}
                </cite>
                <span className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
                  {REVIEWS[activeIndex].role}
                </span>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-3">
                {REVIEWS[activeIndex].emotionalTag && (
                  <span className="font-courier text-[10px] text-crimson-bright/80 tracking-widest uppercase border border-crimson/20 px-3 py-1 rounded-full">
                    {REVIEWS[activeIndex].emotionalTag}
                  </span>
                )}
                <span className="font-courier text-[10px] text-gold/60 tracking-widest uppercase border border-gold/20 px-3 py-1 rounded-full">
                  {REVIEWS[activeIndex].depth}
                </span>
              </div>
            </footer>
          </blockquote>
        </motion.div>
      </div>

      {/* Review selector dots */}
      <div className="flex justify-center gap-3 mb-12" role="tablist" aria-label="Select testimonial">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'bg-gold scale-125'
                : 'bg-border hover:bg-gold/40'
            }`}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Testimonial ${i + 1} from ${REVIEWS[i].author}`}
          />
        ))}
      </div>

      {/* Grid of smaller reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REVIEWS.filter((_, i) => i !== activeIndex).slice(0, 3).map((review, i) => (
          <motion.div
            key={review.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-surface border border-border rounded-lg p-8 hover:border-gold/20 transition-all duration-300 cursor-pointer group"
            onClick={() => setActiveIndex(REVIEWS.indexOf(review))}
            role="button"
            aria-label={`Read full testimonial from ${review.author}`}
          >
            <p className="font-cormorant italic text-sm text-text-mid leading-relaxed mb-6 line-clamp-4">
              &ldquo;{review.quote.slice(0, 150)}...&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <review.Icon size={20} className="text-gold/70" aria-hidden="true" />
              <div>
                <div className="font-cinzel text-[11px] tracking-wide text-text-main">{review.author}</div>
                <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase">{review.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
