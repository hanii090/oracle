import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f766e',
          borderRadius: 38,
          fontFamily: 'serif',
          fontSize: 120,
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
