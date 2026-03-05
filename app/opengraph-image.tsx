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

        {/* Spiral symbol - representing the journey inward */}
        <svg
          viewBox="0 0 120 120"
          width="140"
          height="140"
          style={{ marginBottom: 40 }}
        >
          {/* Outer circle representing wholeness/journey */}
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
          {/* Inner spiral representing depth/introspection */}
          <path
            d="M60 10 C88 10 110 32 110 60 C110 88 88 110 60 110 C32 110 15 92 15 70 C15 48 32 32 52 32 C72 32 85 48 85 60 C85 72 72 82 60 82 C48 82 38 72 38 62 C38 52 48 45 60 45"
            stroke="#c0392b"
            strokeWidth="2.5"
            fill="none"
            opacity="0.8"
            strokeLinecap="round"
          />
          {/* Center dot representing self/core truth */}
          <circle cx="60" cy="60" r="8" fill="#c0392b" opacity="0.9" />
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
