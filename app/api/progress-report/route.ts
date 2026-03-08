import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Progress Report API — generates a "My Therapy Journey" summary
 * for GP appointments or personal records.
 * 
 * This is a patient-held record, not clinical documentation.
 * GET /api/progress-report
 */

export interface ProgressReport {
  generatedAt: string;
  period: { from: string; to: string };
  sessionsSummary: {
    totalSessions: number;
    averageDepth: number;
    themes: string[];
  };
  moodSummary: {
    averageMood: number | null;
    trend: string | null;
    checkInCount: number;
  };
  outcomeMeasures: Array<{
    type: string;
    score: number;
    severity: string;
    date: string;
  }>;
  homeworkSummary: {
    totalAssigned: number;
    completionRate: number;
  };
  keyInsights: string[];
  milestones: string[];
  disclaimer: string;
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/progress-report', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const months = Math.min(parseInt(url.searchParams.get('months') || '3') || 3, 24);

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Check tier — progress reports require Plus+ tier
    const userDoc = await db.doc(`users/${userId}`).get();
    const tier = userDoc.exists ? userDoc.data()?.tier || 'free' : 'free';

    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Progress reports require Patient Plus or higher subscription' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    // Fetch sessions
    const sessionsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    let totalDepth = 0;
    const allThemes: string[] = [];

    for (const doc of sessionsSnapshot.docs) {
      const data = doc.data();
      const messageCount = data.messages?.length || 0;
      totalDepth += Math.min(Math.floor(messageCount / 2), 10);
    }

    // Fetch week summaries for themes
    const summariesSnapshot = await db.collection('weekSummaries')
      .doc(userId)
      .collection('weeks')
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    for (const doc of summariesSnapshot.docs) {
      const data = doc.data();
      if (data.themes) {
        allThemes.push(...data.themes);
      }
    }

    // Deduplicate and sort themes by frequency
    const themeCounts = allThemes.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([theme]) => theme);

    // Fetch mood check-ins
    const moodSnapshot = await db.collection('dailyMoodChecks')
      .doc(userId)
      .collection('checks')
      .where('timestamp', '>=', startDateStr)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const moodScores = moodSnapshot.docs.map(d => d.data().score as number);
    const avgMood = moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : null;

    let moodTrend: string | null = null;
    if (moodScores.length >= 6) {
      const firstHalf = moodScores.slice(Math.floor(moodScores.length / 2));
      const secondHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;
      moodTrend = diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable';
    }

    // Fetch outcome measures
    const measuresSnapshot = await db.collection('outcomeMeasures')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDateStr)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const outcomeMeasures = measuresSnapshot.docs.map(d => {
      const data = d.data();
      return {
        type: data.type,
        score: data.total,
        severity: data.severity,
        date: data.timestamp,
      };
    });

    // Fetch homework
    const homeworkSnapshot = await db.collection('homeworkAssignments')
      .where('patientId', '==', userId)
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    let totalHomeworkDays = 0;
    let completedDays = 0;

    for (const doc of homeworkSnapshot.docs) {
      const data = doc.data();
      totalHomeworkDays += data.durationDays || 7;
      completedDays += data.completedDays || 0;
    }

    // Fetch key insights from debriefs
    const debriefsSnapshot = await db.collection('sessionDebriefs')
      .doc(userId)
      .collection('debriefs')
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const keyInsights = debriefsSnapshot.docs
      .map(d => d.data().keyInsight)
      .filter((insight): insight is string => !!insight)
      .slice(0, 5);

    // Build milestones
    const milestones: string[] = [];
    const totalSessions = sessionsSnapshot.size;
    if (totalSessions >= 1) milestones.push(`Completed ${totalSessions} Sorca session${totalSessions > 1 ? 's' : ''}`);
    if (moodScores.length >= 7) milestones.push(`${moodScores.length} mood check-ins recorded`);
    if (outcomeMeasures.length > 0) milestones.push(`${outcomeMeasures.length} validated outcome measure${outcomeMeasures.length > 1 ? 's' : ''} completed`);
    if (homeworkSnapshot.size > 0) milestones.push(`${homeworkSnapshot.size} homework assignment${homeworkSnapshot.size > 1 ? 's' : ''} attempted`);
    if (topThemes.length > 0) milestones.push(`Explored themes: ${topThemes.slice(0, 4).join(', ')}`);

    const report: ProgressReport = {
      generatedAt: now.toISOString(),
      period: {
        from: startDate.toISOString(),
        to: now.toISOString(),
      },
      sessionsSummary: {
        totalSessions,
        averageDepth: totalSessions > 0 ? totalDepth / totalSessions : 0,
        themes: topThemes,
      },
      moodSummary: {
        averageMood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        trend: moodTrend,
        checkInCount: moodScores.length,
      },
      outcomeMeasures,
      homeworkSummary: {
        totalAssigned: homeworkSnapshot.size,
        completionRate: totalHomeworkDays > 0 ? Math.round((completedDays / totalHomeworkDays) * 100) : 0,
      },
      keyInsights,
      milestones,
      disclaimer: 'This is a patient-held record generated by Sorca, a Socratic reflection tool. It is not a clinical assessment, diagnosis, or treatment record. It is intended to support the individual in sharing their self-reflection journey with healthcare professionals. All content is self-reported.',
    };

    log.info('Progress report generated', { userId, months, totalSessions });

    return NextResponse.json({ report });
  } catch (error) {
    log.error('Progress report error', {}, error);
    return NextResponse.json({ error: 'Failed to generate progress report' }, { status: 500 });
  }
}
