import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore, isAdminConfigured, getAdminError } from './firebase-admin';

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

  // Check if Firebase Admin is properly configured BEFORE trying to verify
  if (!isAdminConfigured()) {
    const adminError = getAdminError();
    console.error('❌ Firebase Admin not configured:', adminError);
    return NextResponse.json(
      {
        error: 'Server authentication is misconfigured. Check FIREBASE_SERVICE_ACCOUNT_KEY.',
        detail: process.env.NODE_ENV === 'development' ? adminError : undefined,
      },
      { status: 500 }
    );
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return {
      userId: decoded.uid,
      email: decoded.email,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Token verification failed:', msg);

    // Distinguish between different failure types
    if (msg.includes('CERTIFICATE_VERIFY_FAILED') || msg.includes('credential')) {
      return NextResponse.json(
        {
          error: 'Server credential error. The service account key may be invalid.',
          detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid or expired authentication token. Please sign in again.' },
      { status: 401 }
    );
  }
}

interface TherapistAuthResult extends AuthResult {
  tier: string;
}

/**
 * Verify that the authenticated user is a therapist (has practice tier or therapist role).
 * Returns the user ID and tier, or a NextResponse error.
 *
 * Usage in API routes:
 * ```ts
 * const auth = await verifyTherapist(req);
 * if (auth instanceof NextResponse) return auth;
 * const { userId, tier } = auth;
 * ```
 */
export async function verifyTherapist(req: Request): Promise<TherapistAuthResult | NextResponse> {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { userId, email } = authResult;

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const db = getAdminFirestore();
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userData = userDoc.data();
  const isTherapist = userData?.role === 'therapist' || userData?.tier === 'practice';

  if (!isTherapist) {
    return NextResponse.json(
      { error: 'Therapist access required. You must have a practice subscription.' },
      { status: 403 }
    );
  }

  return {
    userId,
    email,
    tier: userData?.tier || 'practice',
  };
}
