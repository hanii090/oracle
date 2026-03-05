import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/dashboard', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Get consents where user is therapist
    const consentsSnapshot = await db.collection('therapistConsent')
      .where('therapistId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const consents = consentsSnapshot.docs.map(doc => doc.data());
    const clientIds = consents.map(c => c.patientId);

    if (clientIds.length === 0) {
      return NextResponse.json({
        clients: [],
        totalClients: 0,
        upcomingSessions: [],
        recentAlerts: [],
      });
    }

    // Get client profiles
    const clients = await Promise.all(
      clientIds.map(async (clientId) => {
        const consent = consents.find(c => c.patientId === clientId);
        
        // Get basic user info
        const userDoc = await db.collection('users').doc(clientId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        // Get therapy profile
        const therapyDoc = await db.collection('therapyProfiles').doc(clientId).get();
        const therapyData = therapyDoc.exists ? therapyDoc.data() : null;

        // Get active homework
        const homeworkSnapshot = await db.collection('homeworkAssignments')
          .where('patientId', '==', clientId)
          .where('status', '==', 'active')
          .limit(5)
          .get();
        const activeHomework = homeworkSnapshot.docs.map(doc => doc.data());

        // Get recent week summary (only if consented)
        let weekSummary = null;
        if (consent?.permissions?.shareWeekSummary) {
          const summarySnapshot = await db.collection('weekSummaries')
            .doc(clientId)
            .collection('weeks')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
          if (!summarySnapshot.empty) {
            weekSummary = summarySnapshot.docs[0].data();
          }
        }

        return {
          id: clientId,
          displayName: userData?.displayName || 'Client',
          email: userData?.email || null,
          nextSession: therapyData?.nextSessionDate || null,
          sessionDay: therapyData?.sessionDay || null,
          permissions: consent?.permissions || {},
          activeHomework: activeHomework.length,
          homeworkCompletionRate: activeHomework.length > 0 
            ? Math.round((activeHomework.reduce((sum, h) => sum + (h.completedDays || 0), 0) / 
                activeHomework.reduce((sum, h) => sum + (h.durationDays || 7), 0)) * 100)
            : null,
          weekSummary: weekSummary ? {
            createdAt: weekSummary.createdAt,
            themes: weekSummary.themes || [],
            moodTrend: weekSummary.moodTrend || null,
          } : null,
          consentedAt: consent?.grantedAt,
        };
      })
    );

    // Get pattern alerts (if any clients have consented)
    const alertsSnapshot = await db.collection('patternAlerts')
      .where('therapistId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const recentAlerts = alertsSnapshot.docs.map(doc => doc.data());

    // Calculate upcoming sessions (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingSessions = clients
      .filter(c => c.nextSession && new Date(c.nextSession) <= nextWeek)
      .sort((a, b) => new Date(a.nextSession!).getTime() - new Date(b.nextSession!).getTime())
      .slice(0, 5);

    return NextResponse.json({
      clients,
      totalClients: clients.length,
      upcomingSessions,
      recentAlerts,
    });
  } catch (error) {
    log.error('Therapist dashboard error', {}, error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
