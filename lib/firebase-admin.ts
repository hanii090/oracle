import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminInitError: string | null = null;
let adminInitPermanent = false; // true if error is non-retryable (missing env, bad JSON)

/**
 * Parse the service account key from env, handling every known way
 * that Vercel / dotenv / copy-paste can mangle JSON:
 *
 *  1. Raw JSON           → {"type":"service_account",...}
 *  2. Base64-encoded JSON → eyJ0eXBlIjoic2Vydmljz...
 *  3. Single-line with literal \n in private_key (normal)
 *  4. Double-escaped \\n from env UI
 *  5. Wrapped in extra outer quotes: '"{ ... }"'
 *  6. Single quotes instead of double quotes (hand-edited)
 */
function parseServiceAccountKey(raw: string): Record<string, unknown> {
  let value = raw.trim();

  // ── Step 1: Strip outer wrapping quotes ──────────────────────
  // Vercel UI or dotenv can wrap the whole value in quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  // ── Step 2: Detect base64 ───────────────────────────────────
  // Base64 strings never start with '{', so this is safe
  if (!value.startsWith('{')) {
    try {
      value = Buffer.from(value, 'base64').toString('utf-8');
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY does not look like JSON or base64. ' +
        'It should start with { or be a base64-encoded JSON string.'
      );
    }
  }

  // ── Step 3: Fix escaped characters ──────────────────────────
  // Double-escaped newlines: \\n → real newline
  value = value.replace(/\\\\n/g, '\\n');

  // ── Step 4: Parse JSON ──────────────────────────────────────
  try {
    return JSON.parse(value);
  } catch (jsonError) {
    // Last resort: try replacing literal single quotes with double quotes
    // (people sometimes hand-edit the JSON)
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch {
      throw new Error(
        `JSON parse failed: ${jsonError instanceof Error ? jsonError.message : jsonError}. ` +
        'Make sure the value is valid JSON. Tip: run your key through jsonlint.com to check.'
      );
    }
  }
}

/**
 * Initialize Firebase Admin SDK for server-side operations.
 * Supports raw JSON or base64-encoded JSON in FIREBASE_SERVICE_ACCOUNT_KEY.
 */
function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (adminInitError && adminInitPermanent) throw new Error(adminInitError);

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!serviceAccountKey || serviceAccountKey.trim().length === 0) {
    adminInitError =
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
      'Add your Firebase service account JSON (or base64 of it) to Vercel Environment Variables.';
    adminInitPermanent = true;
    throw new Error(adminInitError);
  }

  try {
    const serviceAccount = parseServiceAccountKey(serviceAccountKey);

    // Validate the three fields that Firebase Admin absolutely requires
    const pid = serviceAccount.project_id as string | undefined;
    const pk  = serviceAccount.private_key as string | undefined;
    const ce  = serviceAccount.client_email as string | undefined;

    const missing: string[] = [];
    if (!pid) missing.push('project_id');
    if (!pk)  missing.push('private_key');
    if (!ce)  missing.push('client_email');

    if (missing.length > 0) {
      adminInitError =
        `FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields: ${missing.join(', ')}. ` +
        'Download a fresh key from Firebase Console → Project Settings → Service Accounts → Generate New Private Key.';
      adminInitPermanent = true;
      throw new Error(adminInitError);
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId: pid || projectId,
    });

    console.log(`✅ Firebase Admin initialized for project: ${pid}`);
  } catch (e: unknown) {
    if (adminInitError && adminInitPermanent) throw new Error(adminInitError);

    const msg = e instanceof Error ? e.message : String(e);
    // Transient error — allow retry on next call
    adminInitError =
      `Failed to initialize Firebase Admin: ${msg}. ` +
      'See the troubleshooting steps logged below.';
    adminInitPermanent = false;
    console.error('❌ Firebase Admin init failed:', msg);
    console.error(
      '🔧 Troubleshooting:\n' +
      '   1. Go to Firebase Console → Project Settings → Service Accounts\n' +
      '   2. Click "Generate new private key" → download the JSON file\n' +
      '   3. OPTION A (easiest): In your terminal run:\n' +
      '        base64 -i path/to/serviceAccountKey.json | pbcopy\n' +
      '      Then paste into Vercel env var FIREBASE_SERVICE_ACCOUNT_KEY\n' +
      '   4. OPTION B: Paste the raw JSON directly (no extra quotes)\n' +
      '   5. Redeploy after saving the env var'
    );
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

/**
 * Get server-side Auth instance for user management.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
