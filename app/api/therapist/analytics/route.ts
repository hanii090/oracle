import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Practice Analytics API — aggregate metrics for therapists
 * 
 * GET /api/therapist/analytics
 */

interface ClientMetrics {
  clientId: string;
  clientName: string;
  sessionCount: number;
  lastSessionDate: string | null;
  homeworkCompletionRate: number;
  alertCount: number;
  safeMode: boolean;
  consentedAt: string;
}

interface PracticeAnalytics {
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  totalHomeworkAssigned: number;
  averageHomeworkCompletion: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  clientsInSafeMode: number;
  weeklySessionTrend: number[];
  clientMetrics: ClientMetrics[];
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/analytics', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: therapistId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Get all active consents
    const consentsSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', therapistId)
      .where('status', '==', 'active')
      .get();

    const clientIds = consentsSnapshot.docs.map(doc => doc.data().patientId);
    const totalClients = clientIds.length;

    if (totalClients === 0) {
      return NextResponse.json({
        analytics: {
          totalClients: 0,
          activeClients: 0,
          totalSessions: 0,
          totalHomeworkAssigned: 0,
          averageHomeworkCompletion: 0,
          totalAlerts: 0,
          unacknowledgedAlerts: 0,
          clientsInSafeMode: 0,
          weeklySessionTrend: [0, 0, 0, 0],
          clientMetrics: [],
        },
      });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    let totalSessions = 0;
    let totalHomeworkAssigned = 0;
    let totalHomeworkCompleted = 0;
    let totalAlerts = 0;
    let unacknowledgedAlerts = 0;
    let clientsInSafeMode = 0;
    let activeClients = 0;
    const weeklySessionCounts = [0, 0, 0, 0];
    const clientMetrics: ClientMetrics[] = [];

    // Process each client
    for (const consent of consentsSnapshot.docs) {
      const consentData = consent.data();
      const clientId = consentData.patientId;

      // Get client info
      const clientDoc = await db.collection('users').doc(clientId).get();
      const clientName = clientDoc.exists ? clientDoc.data()?.displayName || 'Client' : 'Client';

      // Check safe mode
      if (consentData.safeMode) {
        clientsInSafeMode++;
      }

      // Get session count
      const sessionsSnapshot = await db.collection('users')
        .doc(clientId)
        .collection('sessions')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const clientSessionCount = sessionsSnapshot.size;
      totalSessions += clientSessionCount;

      // Check if active (session in last 7 days)
      const lastSession = sessionsSnapshot.docs[0]?.data();
      const lastSessionDate = lastSession?.createdAt || null;
      if (lastSessionDate && new Date(lastSessionDate) >= oneWeekAgo) {
        activeClients++;
      }

      // Count sessions per week for trend
      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionDate = new Date(sessionDoc.data().createdAt);
        if (sessionDate >= oneWeekAgo) {
          weeklySessionCounts[0]++;
        } else if (sessionDate >= twoWeeksAgo) {
          weeklySessionCounts[1]++;
        } else if (sessionDate >= threeWeeksAgo) {
          weeklySessionCounts[2]++;
        } else if (sessionDate >= fourWeeksAgo) {
          weeklySessionCounts[3]++;
        }
      }

      // Get homework stats
      const homeworkSnapshot = await db.collection('homeworkAssignments')
        .where('patientId', '==', clientId)
        .where('therapistId', '==', therapistId)
        .get();

      let clientHomeworkTotal = 0;
      let clientHomeworkCompleted = 0;

      for (const hwDoc of homeworkSnapshot.docs) {
        const hw = hwDoc.data();
        totalHomeworkAssigned++;
        clientHomeworkTotal += hw.durationDays || 7;
        clientHomeworkCompleted += hw.completedDays || 0;
        totalHomeworkCompleted += hw.completedDays || 0;
      }

      const homeworkCompletionRate = clientHomeworkTotal > 0
        ? Math.round((clientHomeworkCompleted / clientHomeworkTotal) * 100)
        : 0;

      // Get alerts
      const alertsSnapshot = await db.collection('patternAlerts')
        .where('clientId', '==', clientId)
        .where('therapistId', '==', therapistId)
        .get();

      const clientAlertCount = alertsSnapshot.size;
      totalAlerts += clientAlertCount;

      for (const alertDoc of alertsSnapshot.docs) {
        if (!alertDoc.data().acknowledged) {
          unacknowledgedAlerts++;
        }
      }

      clientMetrics.push({
        clientId,
        clientName,
        sessionCount: clientSessionCount,
        lastSessionDate,
        homeworkCompletionRate,
        alertCount: clientAlertCount,
        safeMode: consentData.safeMode || false,
        consentedAt: consentData.grantedAt,
      });
    }

    // Calculate average homework completion
    const totalHomeworkDays = totalHomeworkAssigned * 7; // Approximate
    const averageHomeworkCompletion = totalHomeworkDays > 0
      ? Math.round((totalHomeworkCompleted / totalHomeworkDays) * 100)
      : 0;

    // Sort client metrics by last session date
    clientMetrics.sort((a, b) => {
      if (!a.lastSessionDate) return 1;
      if (!b.lastSessionDate) return -1;
      return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();
    });

    const analytics: PracticeAnalytics = {
      totalClients,
      activeClients,
      totalSessions,
      totalHomeworkAssigned,
      averageHomeworkCompletion,
      totalAlerts,
      unacknowledgedAlerts,
      clientsInSafeMode,
      weeklySessionTrend: weeklySessionCounts.reverse(), // Oldest to newest
      clientMetrics,
    };

    log.info('Practice analytics generated', { therapistId, totalClients });

    return NextResponse.json({ analytics });
  } catch (error) {
    log.error('Analytics error', {}, error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
