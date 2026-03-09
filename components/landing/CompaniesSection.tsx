'use client';

import { motion } from 'motion/react';

/* ── Real SVG logos via simpleicons.org path data ─────────────── */
const LOGOS: { name: string; viewBox: string; path: string }[] = [
  {
    name: 'Google',
    viewBox: '0 0 24 24',
    path: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z',
  },
  {
    name: 'Y Combinator',
    viewBox: '0 0 24 24',
    path: 'M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z',
  },
  {
    name: 'Firebase',
    viewBox: '0 0 24 24',
    path: 'M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 0 0-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 0 0 1.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.53 17.984z',
  },
  {
    name: 'Stripe',
    viewBox: '0 0 24 24',
    path: 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z',
  },
  {
    name: 'Vercel',
    viewBox: '0 0 24 24',
    path: 'M12 1.608l12 20.784H0Z',
  },
  {
    name: 'TechCrunch',
    viewBox: '0 0 24 24',
    path: 'M0 6v4h4v8h4v-8h4V6Zm12 4v8h12v-4h-8v-4zm4 0h8V6h-8z',
  },
  {
    name: 'Anthropic',
    viewBox: '0 0 24 24',
    path: 'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
  },
  {
    name: 'Product Hunt',
    viewBox: '0 0 24 24',
    path: 'M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z',
  },
];

export function CompaniesSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-6xl px-6 py-16"
      aria-labelledby="companies-heading"
    >
      <div
        id="companies-heading"
        className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-8 flex items-center gap-4"
      >
        Built With
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>

      {/* Infinite scroll marquee with real SVG logos */}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div
          className="flex animate-[marquee_40s_linear_infinite] gap-16 items-center"
          aria-label="Technology partners"
        >
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 flex items-center gap-3 group"
              title={logo.name}
            >
              <svg
                viewBox={logo.viewBox}
                className="h-6 w-6 fill-current text-text-muted group-hover:text-gold transition-colors duration-300"
                role="img"
                aria-label={logo.name}
              >
                <path d={logo.path} />
              </svg>
              <span className="font-cinzel text-[11px] tracking-[0.15em] text-text-muted group-hover:text-gold transition-colors duration-300 whitespace-nowrap">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
