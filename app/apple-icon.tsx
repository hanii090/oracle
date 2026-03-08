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
          backgroundColor: '#c0392b',
          borderRadius: 40,
          fontFamily: 'serif',
          fontSize: 110,
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
