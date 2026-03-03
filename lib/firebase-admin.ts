import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminInitError: string | null = null;

/**
 * Initialize Firebase Admin SDK for server-side operations.
 * Uses service account key from env. Will NOT fall back to ADC
 * (Application Default Credentials don't work on Vercel).
 */
function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (adminInitError) throw new Error(adminInitError);

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!serviceAccountKey) {
    adminInitError =
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
      'Add your Firebase service account JSON to Vercel Environment Variables. ' +
      'See .env.example for details.';
    throw new Error(adminInitError);
  }

  // Vercel sometimes double-escapes JSON pasted into env vars.
  // Detect and fix common issues:
  // 1. Escaped newlines inside the JSON string
  serviceAccountKey = serviceAccountKey.replace(/\\n/g, '\n');
  // 2. Wrapped in extra quotes: '"{ ... }"' → '{ ... }'
  if (serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"')) {
    serviceAccountKey = serviceAccountKey.slice(1, -1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);

    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      adminInitError =
        'FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields (project_id, private_key, client_email). ' +
        'Make sure you pasted the FULL service account JSON, not just a fragment.';
      throw new Error(adminInitError);
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });

    console.log(`✅ Firebase Admin initialized for project: ${serviceAccount.project_id}`);
  } catch (e: unknown) {
    if (adminInitError) throw new Error(adminInitError);

    const msg = e instanceof Error ? e.message : String(e);
    adminInitError =
      `Failed to initialize Firebase Admin: ${msg}. ` +
      'Check that FIREBASE_SERVICE_ACCOUNT_KEY contains valid JSON. ' +
      'Tip: In Vercel, paste the raw JSON (not base64). Avoid extra quotes around the value.';
    console.error('❌', adminInitError);
    throw new Error(adminInitError);
  }

  return adminApp;
}

/**
 * Check whether Firebase Admin is properly configured without throwing.
 */
export function isAdminConfigured(): boolean {
  try {
    getAdminApp();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the admin initialization error message (if any).
 */
export function getAdminError(): string | null {
  return adminInitError;
}

/**
 * Get server-side Firestore instance.
 */
export function getAdminFirestore(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}
