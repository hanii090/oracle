import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore } from './firebase-admin';

// Re-export for convenience
export { getAdminFirestore };

interface AuthResult {
  userId: string;
  email?: string;
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded user ID or a NextResponse error.
 *
 * Usage in API routes:
 * ```ts
 * const auth = await verifyAuth(req);
 * if (auth instanceof NextResponse) return auth;
 * const { userId } = auth;
 * ```
 */
export async function verifyAuth(req: Request): Promise<AuthResult | NextResponse> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Expected: Bearer <token>' },
      { status: 401 }
    );
  }

  const idToken = authHeader.slice(7);

  try {
    // getAuth() uses the default admin app initialized in firebase-admin.ts
    const decoded = await getAuth().verifyIdToken(idToken);
    return {
      userId: decoded.uid,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }
}
