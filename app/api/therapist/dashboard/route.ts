import { NextResponse } from 'next/server';
import { verifyTherapist, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/therapist/dashboard', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyTherapist(req);
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

    // ── Week at a Glance Metrics ─────────────────────────────────
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Aggregate mood trends from week summaries
    const moodTrends: string[] = [];
    const allThemes: string[] = [];
    let totalHomeworkCompletion = 0;
    let clientsWithHomework = 0;
    let clientsNeedingAttention: Array<{ id: string; name: string; reason: string }> = [];

    for (const client of clients) {
      // Collect mood trends
      if (client.weekSummary?.moodTrend) {
        moodTrends.push(client.weekSummary.moodTrend);
      }
      
      // Collect themes
      if (client.weekSummary?.themes) {
        allThemes.push(...client.weekSummary.themes);
      }
      
      // Aggregate homework completion
      if (client.homeworkCompletionRate !== null) {
        totalHomeworkCompletion += client.homeworkCompletionRate;
        clientsWithHomework++;
      }
      
      // Identify clients needing attention
      if (client.homeworkCompletionRate !== null && client.homeworkCompletionRate < 30) {
        clientsNeedingAttention.push({
          id: client.id,
          name: client.displayName,
          reason: 'Low homework completion',
        });
      }
    }

    // Check for clients with recent alerts
    const alertClientIds = new Set(recentAlerts.map(a => a.clientId));
    for (const clientId of alertClientIds) {
      const client = clients.find(c => c.id === clientId);
      if (client && !clientsNeedingAttention.find(c => c.id === clientId)) {
        clientsNeedingAttention.push({
          id: clientId,
          name: client.displayName,
          reason: 'Recent alert',
        });
      }
    }

    // Calculate practice-wide mood trend
    const moodCounts = { improving: 0, stable: 0, declining: 0, fluctuating: 0 };
    for (const mood of moodTrends) {
      if (mood in moodCounts) {
        moodCounts[mood as keyof typeof moodCounts]++;
      }
    }
    const practiceMoodTrend = moodTrends.length > 0
      ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'unknown';

    // Calculate theme frequency for word cloud
    const themeCounts: Record<string, number> = {};
    for (const theme of allThemes) {
      const normalized = theme.toLowerCase().trim();
      themeCounts[normalized] = (themeCounts[normalized] || 0) + 1;
    }
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([theme, count]) => ({ theme, count }));

    const weekAtGlance = {
      practiceMoodTrend,
      moodBreakdown: moodCounts,
      averageHomeworkCompletion: clientsWithHomework > 0 
        ? Math.round(totalHomeworkCompletion / clientsWithHomework) 
        : null,
      topThemes,
      clientsNeedingAttention: clientsNeedingAttention.slice(0, 5),
      totalAlerts: recentAlerts.length,
      activeClients: clients.filter(c => c.weekSummary !== null).length,
    };

    return NextResponse.json({
      clients,
      totalClients: clients.length,
      upcomingSessions,
      recentAlerts,
      weekAtGlance,
    });
  } catch (error) {
    log.error('Therapist dashboard error', {}, error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
