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
          <path
            d="M6 40 C16 12 64 12 74 40 C64 68 16 68 6 40 Z"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          <circle
            cx="40"
            cy="40"
            r="10"
            stroke="#c0392b"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
          <circle cx="40" cy="40" r="4" fill="#c0392b" opacity="0.9" />
          <circle cx="37" cy="37" r="1.5" fill="#f5f0e8" opacity="0.5" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
