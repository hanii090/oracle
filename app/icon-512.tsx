import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f766e',
          borderRadius: 102,
          fontFamily: 'serif',
          fontSize: 320,
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
