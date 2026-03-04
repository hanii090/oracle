import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';

/**
 * Monthly Excavation Report — Feature 06 supplement
 * GET /api/excavation-report — generates/returns the monthly formatted report
 *
 * Combines: patterns, beliefs, avoided questions, silence score, depth stats, mirror letter
 * into a single comprehensive excavation report.
 */

interface ReportData {
  month: string;
  generatedAt: string;
  stats: {
    totalSessions: number;
    totalExchanges: number;
    avgDepth: number;
    maxDepth: number;
    deepestTheme: string;
    totalMinutes: number;
  };
  patterns: {
    recurring: string[];
    avoidance: string[];
    breakthroughs: string[];
  };
  beliefs: {
    active: string[];
    evolved: string[];
    contradicted: string[];
  };
  silenceProfile: {
    avgScore: number;
    quality: string;
    trend: string;
  } | null;
  narrative: string;
  questionOfTheMonth: string;
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/excavation-report', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Fetch user profile to check tier
    let tier = 'free';
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        tier = userDoc.data()?.tier || 'free';
      }
    }

    if (tier === 'free') {
      return NextResponse.json({ error: 'Excavation Reports require Philosopher or Pro tier.' }, { status: 403 });
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check cache first
    if (isAdminConfigured()) {
      const db = getAdminFirestore();
      const cacheDoc = await db.collection('excavationReports').doc(`${userId}_${monthKey}`).get();
      if (cacheDoc.exists) {
        return NextResponse.json(cacheDoc.data());
      }
    }

    // Gather all data for this month
    let sessions: any[] = [];
    let patterns: any = null;
    let beliefs: any[] = [];
    let silenceData: any = null;

    if (isAdminConfigured()) {
      const db = getAdminFirestore();

      // Sessions from this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sessionsSnap = await db.collection('users').doc(userId).collection('sessions')
        .where('createdAt', '>=', startOfMonth.toISOString())
        .orderBy('createdAt', 'desc')
        .get();
      sessions = sessionsSnap.docs.map(d => d.data());

      // Patterns
      const patternsDoc = await db.collection('patterns').doc(userId).get();
      if (patternsDoc.exists) patterns = patternsDoc.data();

      // Beliefs
      const beliefsDoc = await db.collection('beliefs').doc(userId).get();
      if (beliefsDoc.exists) beliefs = beliefsDoc.data()?.beliefs || [];

      // Silence score
      const silenceDoc = await db.collection('silenceScores').doc(userId).get();
      if (silenceDoc.exists) silenceData = silenceDoc.data();
    }

    if (sessions.length === 0) {
      return NextResponse.json({
        error: 'Not enough data for an excavation report this month. Keep exploring.',
      }, { status: 404 });
    }

    // Calculate stats
    const totalSessions = sessions.length;
    const totalExchanges = sessions.reduce((sum: number, s: any) => sum + (s.messageCount || 0), 0);
    const depths = sessions.map((s: any) => s.maxDepth || 1);
    const avgDepth = depths.reduce((a: number, b: number) => a + b, 0) / depths.length;
    const maxDepth = Math.max(...depths);

    // Extract all user messages for AI analysis
    const allUserMessages = sessions
      .flatMap((s: any) => (s.messages || []).filter((m: any) => m.role === 'user').map((m: any) => m.content))
      .slice(0, 50); // Limit context

    // Categorize beliefs
    const activeBeliefs = beliefs.filter((b: any) => b.status === 'active').map((b: any) => b.text).slice(0, 5);
    const evolvedBeliefs = beliefs.filter((b: any) => b.status === 'evolved' || b.status === 'deepened').map((b: any) => b.text).slice(0, 5);
    const contradictedBeliefs = beliefs.filter((b: any) => b.status === 'contradicted').map((b: any) => b.text).slice(0, 5);

    // Generate narrative via Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    let narrative = '';
    let questionOfTheMonth = 'What truth have you stopped avoiding this month?';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are writing a Monthly Excavation Report for a user of Sorca, a Socratic questioning app. 
This is an editorial, literary document — not a clinical report. Write in second person ("you"), with the tone of a wise, unsentimental observer.

User's data this month:
- ${totalSessions} sessions, ${totalExchanges} exchanges
- Average depth: ${avgDepth.toFixed(1)}, deepest: ${maxDepth}
- Sample of what they explored: ${allUserMessages.slice(0, 15).join(' | ')}
- Active beliefs: ${activeBeliefs.join('; ') || 'None tracked yet'}
- Evolved beliefs: ${evolvedBeliefs.join('; ') || 'None yet'}
- Contradicted beliefs: ${contradictedBeliefs.join('; ') || 'None yet'}
- Known avoidance patterns: ${patterns?.avoidancePatterns?.join('; ') || 'Unknown'}
- Silence quality: ${silenceData?.quality || 'Unknown'}

Write TWO things:
1. NARRATIVE (200-300 words): A literary excavation summary. What did they dig up? What's still buried? Where are they running? What changed? Be honest, not harsh. Think: archaeological field notes meets personal essay.
2. QUESTION_OF_THE_MONTH: One piercing question that captures what they most need to face next month.

Return JSON only:
{ "narrative": "...", "questionOfTheMonth": "..." }`,
          config: { responseMimeType: 'application/json', temperature: 0.8 },
        });

        const parsed = JSON.parse(res.text || '{}');
        narrative = parsed.narrative || '';
        questionOfTheMonth = parsed.questionOfTheMonth || questionOfTheMonth;
      } catch (e) {
        log.error('Excavation narrative generation failed', {}, e);
        narrative = 'Your excavation report could not be fully generated this month. The data is here — the meaning is yours to find.';
      }
    }

    // Find deepest theme
    const deepestSession = sessions.reduce((a: any, b: any) => (b.maxDepth || 0) > (a.maxDepth || 0) ? b : a, sessions[0]);
    const deepestTheme = deepestSession?.messages?.find((m: any) => m.role === 'user')?.content?.slice(0, 50) || 'Unknown';

    const report: ReportData = {
      month: monthKey,
      generatedAt: now.toISOString(),
      stats: {
        totalSessions,
        totalExchanges,
        avgDepth: Math.round(avgDepth * 10) / 10,
        maxDepth,
        deepestTheme,
        totalMinutes: Math.round(totalExchanges * 1.5), // estimate ~1.5 min per exchange
      },
      patterns: {
        recurring: patterns?.recurringPatterns?.slice(0, 5) || [],
        avoidance: patterns?.avoidancePatterns?.slice(0, 5) || [],
        breakthroughs: patterns?.breakthroughs?.slice(0, 3) || [],
      },
      beliefs: {
        active: activeBeliefs,
        evolved: evolvedBeliefs,
        contradicted: contradictedBeliefs,
      },
      silenceProfile: silenceData ? {
        avgScore: silenceData.average || 0,
        quality: silenceData.quality || 'unknown',
        trend: silenceData.trend || 'insufficient_data',
      } : null,
      narrative,
      questionOfTheMonth,
    };

    // Cache in Firestore
    if (isAdminConfigured()) {
      try {
        const db = getAdminFirestore();
        await db.collection('excavationReports').doc(`${userId}_${monthKey}`).set(report);
      } catch (e) {
        log.error('Failed to cache excavation report', {}, e);
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    log.error('Excavation report error', {}, error);
    return NextResponse.json({ error: 'Failed to generate excavation report.' }, { status: 500 });
  }
}
