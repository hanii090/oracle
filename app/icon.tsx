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
          {/* Outer circle representing wholeness/journey */}
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="#c0392b"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          {/* Inner spiral representing depth/introspection */}
          <path
            d="M16 5 C22 5 27 10 27 16 C27 22 22 27 16 27 C10 27 6 23 6 18 C6 13 10 10 14 10 C18 10 21 13 21 16 C21 19 18 21 16 21 C14 21 12 19 12 17 C12 15 14 14 16 14"
            stroke="#c0392b"
            strokeWidth="1.2"
            fill="none"
            opacity="0.8"
            strokeLinecap="round"
          />
          {/* Center dot representing self/core truth */}
          <circle cx="16" cy="16" r="2" fill="#c0392b" opacity="0.9" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
