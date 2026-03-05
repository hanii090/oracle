import { ImageResponse } from 'next/og';

/**
 * Apple Touch Icon — 180×180 PNG for iOS home screen bookmarks.
 * Next.js auto-discovers this and serves it as /apple-icon.png.
 */

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          borderRadius: 36,
        }}
      >
        <svg viewBox="0 0 80 80" width="120" height="120">
          {/* Outer circle representing wholeness/journey */}
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
          {/* Inner spiral representing depth/introspection */}
          <path
            d="M40 8 C58 8 72 22 72 40 C72 58 58 72 40 72 C22 72 12 60 12 46 C12 32 22 22 34 22 C46 22 54 32 54 40 C54 48 46 54 40 54 C34 54 28 48 28 42 C28 36 34 32 40 32"
            stroke="#c0392b"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
            strokeLinecap="round"
          />
          {/* Center dot representing self/core truth */}
          <circle cx="40" cy="40" r="5" fill="#c0392b" opacity="0.9" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
