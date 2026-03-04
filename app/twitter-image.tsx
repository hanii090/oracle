/**
 * Twitter Card Image — uses the same OG image generator.
 * Next.js auto-discovers this file for <meta name="twitter:image">.
 *
 * Config values must be declared directly (not re-exported)
 * so Next.js can statically analyze them at build time.
 */
export { default } from './opengraph-image';

export const runtime = 'edge';
export const alt = 'SORCA — The AI That Only Asks Questions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
