import { ImageResponse } from 'next/og';

/**
 * Favicon generator — produces a 32×32 PNG favicon with the Sorca eye.
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
          backgroundColor: '#f5f0e8',
          borderRadius: 6,
        }}
      >
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path
            d="M3 16 C8 6 24 6 29 16 C24 26 8 26 3 16 Z"
            stroke="#c0392b"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          <circle
            cx="16"
            cy="16"
            r="4"
            stroke="#c0392b"
            strokeWidth="1"
            fill="none"
            opacity="0.8"
          />
          <circle cx="16" cy="16" r="1.5" fill="#c0392b" opacity="0.9" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
