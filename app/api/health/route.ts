import { NextResponse } from 'next/server';
import { isAdminConfigured, getAdminError } from '@/lib/firebase-admin';

/**
 * GET /api/health — Quick diagnostic for deployment configuration.
 * Does NOT expose secrets — only reports which services are configured.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // Firebase Admin
  const adminOk = isAdminConfigured();
  let adminDetail = '';
  if (adminOk) {
    adminDetail = 'Initialized successfully';
  } else if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    adminDetail = 'FIREBASE_SERVICE_ACCOUNT_KEY is not set';
  } else {
    adminDetail = getAdminError() || 'Initialization failed';
  }
  checks['firebase-admin'] = { ok: adminOk, detail: adminDetail };

  // Firebase Client (NEXT_PUBLIC_ vars)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  checks['firebase-client'] = {
    ok: !!projectId && projectId !== 'your-project-id',
    detail: projectId ? `Project: ${projectId}` : 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set',
  };

  // Gemini
  checks['gemini'] = {
    ok: !!process.env.GEMINI_API_KEY,
    detail: process.env.GEMINI_API_KEY ? 'Configured' : 'GEMINI_API_KEY is not set',
  };

  // Stripe
  checks['stripe'] = {
    ok: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
    detail:
      !process.env.STRIPE_SECRET_KEY
        ? 'STRIPE_SECRET_KEY is not set'
        : !process.env.STRIPE_WEBHOOK_SECRET
          ? 'STRIPE_WEBHOOK_SECRET is not set'
          : 'Configured',
  };

  // Anthropic (optional fallback)
  checks['anthropic'] = {
    ok: !!process.env.ANTHROPIC_API_KEY,
    detail: process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not set (optional)',
  };

  const allOk = checks['firebase-admin'].ok && checks['firebase-client'].ok && checks['gemini'].ok && checks['stripe'].ok;

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      help: !checks['firebase-admin'].ok
        ? 'Run: base64 -i your-service-account-key.json | pbcopy — then paste into Vercel env var FIREBASE_SERVICE_ACCOUNT_KEY and redeploy.'
        : undefined,
    },
    { status: allOk ? 200 : 503 }
  );
}
