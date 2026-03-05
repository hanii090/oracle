import { NextResponse } from 'next/server';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { sendExcavationReportEmail } from '@/lib/email';
import { createLogger } from '@/lib/logger';

/**
 * Excavation Report Cron Job
 * Runs on the 1st of each month to generate and email reports
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/excavation",
 *     "schedule": "0 9 1 * *"
 *   }]
 * }
 */

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/cron/excavation', correlationId: crypto.randomUUID() });

  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
  }

  const db = getAdminFirestore();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`; // Previous month
  
  log.info('Starting excavation report cron', { monthKey });

  let processed = 0;
  let sent = 0;
  let errors = 0;

  try {
    // Find all users with Philosopher or Pro tier who have email
    const usersSnap = await db.collection('users')
      .where('tier', 'in', ['philosopher', 'pro'])
      .get();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Skip if no email or email notifications disabled
      if (!userData.email) continue;
      if (userData.emailPreferences?.excavationReport === false) continue;

      processed++;

      try {
        // Check if report already exists for this month
        const existingReport = await db.collection('excavationReports')
          .doc(userId)
          .collection('reports')
          .doc(monthKey)
          .get();

        let reportData;

        if (existingReport.exists) {
          reportData = existingReport.data();
        } else {
          // Generate report via internal API call
          const reportRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://sorca.life'}/api/excavation-report`, {
            method: 'GET',
            headers: {
              'x-internal-cron': 'true',
              'x-user-id': userId,
            },
          });

          if (!reportRes.ok) {
            log.warn('Failed to generate report', { userId, status: reportRes.status });
            errors++;
            continue;
          }

          reportData = await reportRes.json();
        }

        // Skip if no meaningful data
        if (!reportData || reportData.stats?.totalSessions === 0) {
          continue;
        }

        // Send email
        const emailResult = await sendExcavationReportEmail(
          userData.email,
          userData.displayName || 'Seeker',
          formatMonthKey(monthKey),
          {
            narrative: reportData.narrative || 'Your journey continues in silence this month.',
            questionOfTheMonth: reportData.questionOfTheMonth || 'What are you waiting for permission to become?',
            stats: {
              totalSessions: reportData.stats?.totalSessions || 0,
              avgDepth: reportData.stats?.avgDepth || 0,
              maxDepth: reportData.stats?.maxDepth || 0,
              deepestTheme: reportData.stats?.deepestTheme || 'Self',
            },
          }
        );

        if (emailResult.success) {
          sent++;
          
          // Mark as sent
          await db.collection('excavationReports')
            .doc(userId)
            .collection('reports')
            .doc(monthKey)
            .set({ emailSentAt: now.toISOString() }, { merge: true });
            
          log.info('Report email sent', { userId });
        } else {
          log.warn('Email send failed', { userId, error: emailResult.error });
          errors++;
        }
      } catch (e) {
        log.error('User processing error', { userId }, e);
        errors++;
      }

      // Rate limit: max 10 emails per second
      await new Promise(r => setTimeout(r, 100));
    }

    log.info('Excavation cron complete', { processed, sent, errors });

    return NextResponse.json({
      success: true,
      processed,
      sent,
      errors,
      monthKey,
    });
  } catch (error) {
    log.error('Excavation cron failed', {}, error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month), 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
