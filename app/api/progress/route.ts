import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';

/**
 * Progress API — returns user progress events and stats for visualization
 * 
 * GET /api/progress?range=week|month|all
 */

interface ProgressEvent {
  id: string;
  type: 'session' | 'homework' | 'insight' | 'milestone';
  title: string;
  description?: string;
  date: string;
  depth?: number;
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/progress', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'month';

    if (!isAdminConfigured()) {
      return NextResponse.json({ events: [], stats: null });
    }

    const db = getAdminFirestore();

    // Calculate date range
    let startDate: Date;
    const now = new Date();
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const startDateStr = startDate.toISOString();
    const events: ProgressEvent[] = [];

    // Fetch sessions
    const sessionsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    let totalDepth = 0;
    let sessionCount = 0;

    for (const doc of sessionsSnapshot.docs) {
      const data = doc.data();
      const messageCount = data.messages?.length || 0;
      const depth = Math.min(Math.floor(messageCount / 2), 10);
      
      totalDepth += depth;
      sessionCount++;

      events.push({
        id: doc.id,
        type: 'session',
        title: `Sorca Session`,
        description: messageCount > 0 ? `${messageCount} exchanges` : undefined,
        date: data.createdAt,
        depth,
      });
    }

    // Fetch homework completions
    const homeworkSnapshot = await db.collection('homeworkAssignments')
      .where('patientId', '==', userId)
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    let homeworkCompleted = 0;

    for (const doc of homeworkSnapshot.docs) {
      const data = doc.data();
      const completedDays = data.completedDays || 0;
      const totalDays = data.durationDays || 7;
      
      if (completedDays > 0) {
        homeworkCompleted++;
        events.push({
          id: doc.id,
          type: 'homework',
          title: data.topic || 'Homework',
          description: `${completedDays}/${totalDays} days completed`,
          date: data.createdAt,
        });
      }
    }

    // Fetch session debriefs (insights)
    const debriefsSnapshot = await db.collection('sessionDebriefs')
      .doc(userId)
      .collection('debriefs')
      .where('createdAt', '>=', startDateStr)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    for (const doc of debriefsSnapshot.docs) {
      const data = doc.data();
      if (data.keyInsight) {
        events.push({
          id: doc.id,
          type: 'insight',
          title: 'Key Insight',
          description: data.keyInsight,
          date: data.createdAt,
        });
      }
    }

    // Check for milestones
    const milestones: ProgressEvent[] = [];
    
    // First session milestone
    if (sessionCount === 1) {
      milestones.push({
        id: 'milestone-first-session',
        type: 'milestone',
        title: 'First Session Complete',
        description: 'You started your journey with Sorca',
        date: sessionsSnapshot.docs[0]?.data().createdAt || now.toISOString(),
      });
    }

    // 10 sessions milestone
    const totalSessionsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .count()
      .get();
    
    const totalSessions = totalSessionsSnapshot.data().count;
    
    if (totalSessions >= 10 && totalSessions < 11) {
      milestones.push({
        id: 'milestone-10-sessions',
        type: 'milestone',
        title: '10 Sessions',
        description: 'A meaningful commitment to self-reflection',
        date: now.toISOString(),
      });
    }

    // Calculate streak
    const sessionDates = sessionsSnapshot.docs
      .map(doc => doc.data().createdAt?.split('T')[0])
      .filter(Boolean);
    
    const uniqueDates = [...new Set(sessionDates)].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (uniqueDates.includes(expectedDate)) {
          tempStreak++;
        } else {
          break;
        }
      }
      currentStreak = tempStreak;
    }
    
    longestStreak = Math.max(currentStreak, tempStreak);

    // Calculate weekly trend
    const thisWeekSessions = sessionsSnapshot.docs.filter(doc => {
      const date = new Date(doc.data().createdAt);
      return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).length;

    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const lastWeekSnapshot = await db.collection('users')
      .doc(userId)
      .collection('sessions')
      .where('createdAt', '>=', lastWeekStart.toISOString())
      .where('createdAt', '<', lastWeekEnd.toISOString())
      .count()
      .get();
    
    const lastWeekSessions = lastWeekSnapshot.data().count;

    let weeklyTrend: 'improving' | 'stable' | 'declining' | 'fluctuating' = 'stable';
    if (thisWeekSessions > lastWeekSessions + 1) {
      weeklyTrend = 'improving';
    } else if (thisWeekSessions < lastWeekSessions - 1) {
      weeklyTrend = 'declining';
    } else if (Math.abs(thisWeekSessions - lastWeekSessions) <= 1) {
      weeklyTrend = 'stable';
    }

    // Combine and sort all events
    const allEvents = [...events, ...milestones].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const stats = {
      totalSessions: sessionCount,
      totalHomework: homeworkCompleted,
      averageDepth: sessionCount > 0 ? totalDepth / sessionCount : 0,
      longestStreak,
      currentStreak,
      weeklyTrend,
    };

    log.info('Progress fetched', { userId, eventCount: allEvents.length });

    return NextResponse.json({
      events: allEvents.slice(0, 50),
      stats,
    });
  } catch (error) {
    log.error('Progress fetch error', {}, error);
    return NextResponse.json({ events: [], stats: null });
  }
}
