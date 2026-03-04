import { ImageResponse } from 'next/og';

/**
 * OG Image — Dynamic SVG-based Open Graph image for social sharing.
 * Renders the Sorca brand with typography on the warm paper background.
 * 1200×630 for optimal display on Twitter, LinkedIn, Facebook, iMessage, etc.
 *
 * Next.js auto-discovers this file and wires it into the <meta> tags.
 */

export const runtime = 'edge';
export const alt = 'SORCA — The AI That Only Asks Questions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at center, rgba(192,57,43,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Eye symbol */}
        <svg
          viewBox="0 0 120 60"
          width="160"
          height="80"
          style={{ marginBottom: 40 }}
        >
          <path
            d="M6 30 C30 6 90 6 114 30 C90 54 30 54 6 30 Z"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
          <circle
            cx="60"
            cy="30"
            r="12"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
          <circle cx="60" cy="30" r="4.5" fill="#c0392b" opacity="0.9" />
          <circle cx="56" cy="26" r="2" fill="#f5f0e8" opacity="0.6" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: '#c0392b',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          SORCA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            fontStyle: 'italic',
            color: '#3d3830',
            letterSpacing: '0.05em',
            marginBottom: 16,
          }}
        >
          The AI That Only Asks Questions
        </div>

        {/* Value prop */}
        <div
          style={{
            fontSize: 16,
            color: '#7a7060',
            letterSpacing: '0.15em',
          }}
        >
          SELF-DISCOVERY THROUGH SOCRATIC INQUIRY · SORCA.LIFE
        </div>
      </div>
    ),
    { ...size },
  );
}
