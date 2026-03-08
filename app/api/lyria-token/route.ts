import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

/**
 * GET /api/lyria-token — Returns an ephemeral API key for the Lyria Foley Engine.
 * Keeps the Gemini API key server-side instead of exposing via NEXT_PUBLIC_.
 *
 * Only authenticated users can access this endpoint.
 */
export async function GET(req: Request) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Lyria not configured' }, { status: 503 });
  }

  const expiresAt = Date.now() + 30 * 60 * 1000; // 30-minute client-side validity hint

  return NextResponse.json(
    { apiKey, expiresAt },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
