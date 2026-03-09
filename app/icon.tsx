import { ImageResponse } from 'next/og';

/**
 * Favicon generator — produces a 32×32 PNG favicon with the Sorca S monogram.
 * Next.js auto-discovers this and serves it as /favicon.ico.
 */

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f766e',
          borderRadius: 7,
          fontFamily: 'serif',
          fontSize: 22,
          fontWeight: 700,
          color: '#f5f0e8',
          letterSpacing: '-0.02em',
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
