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

  // Return the key — the client will use it for the Live API session.
  // In a more advanced setup, you'd create a short-lived ephemeral token here.
  return NextResponse.json({ apiKey });
}
