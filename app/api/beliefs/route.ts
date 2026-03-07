import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';

/**
 * Belief Lifespan Tracking — Feature 04
 * POST /api/beliefs
 *
 * Extracts beliefs from each session, tags them with timestamps,
 * and tracks how they evolve, deepen, or disappear over time.
 */

interface Belief {
  id: string;
  text: string;
  category: 'identity' | 'world' | 'relationship' | 'capability' | 'fear' | 'desire' | 'value';
  firstExpressed: string;
  lastSeen: string;
  occurrences: number;
  status: 'active' | 'evolved' | 'abandoned' | 'deepened' | 'contradicted';
  evolution: { date: string; context: string }[];
}

const BELIEF_EXTRACTION_PROMPT = `You are a belief extraction engine for Sorca, a Socratic AI.

Analyse this conversation and extract all BELIEFS the user expresses — stated or implied.

A belief is any claim, assumption, value, fear, or desire that reveals how the user sees themselves, the world, or their relationships.

Categories:
1. **identity** — Beliefs about who they are ("I'm not creative", "I'm the responsible one")
2. **world** — Beliefs about how the world works ("People always leave", "Success requires sacrifice")
3. **relationship** — Beliefs about others ("My partner doesn't understand me", "My parents meant well")
4. **capability** — Beliefs about what they can/can't do ("I could never start a business")
5. **fear** — Core fears ("I'm afraid of being ordinary", "I'll end up alone")
6. **desire** — Deep wants they may not fully acknowledge ("I want to be seen", "I want permission to rest")
7. **value** — What they truly value, often unconsciously ("Freedom matters more than security")

For each belief, provide:
- text: the belief in the user's own words (or as close as possible)
- category: one of the 7 above
- confidence: 0-1 how certain you are this is a genuine belief (not performative)
- significance: 0-10 how central this belief is to their identity
- quote: the specific thing they said that reveals this belief

Return JSON: { "beliefs": [{ "text": "...", "category": "...", "confidence": 0.0, "significance": 0, "quote": "..." }] }

Conversation:
`;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/beliefs', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = z.object({
      sessionMessages: z.array(z.object({ role: z.string(), content: z.string() })),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { sessionMessages } = parsed.data;

    if (sessionMessages.length < 4) {
      return NextResponse.json({ beliefs: [], chart: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    // Build conversation text
    const convoText = sessionMessages
      .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
      .join('\n');

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: BELIEF_EXTRACTION_PROMPT + convoText,
      config: { responseMimeType: 'application/json' },
    });

    let extracted: { beliefs: Array<{ text: string; category: string; confidence: number; significance: number; quote: string }> } = { beliefs: [] };
    try {
      extracted = JSON.parse(result.text || '{"beliefs":[]}');
    } catch {
      log.warn('Failed to parse belief extraction');
      return NextResponse.json({ beliefs: [], chart: [] });
    }

    const adminDb = getAdminFirestore();
    const beliefsRef = adminDb.collection('users').doc(userId).collection('beliefs');
    const now = new Date().toISOString();

    // Check existing beliefs for matches/evolution
    const existingSnap = await beliefsRef.get();
    const existing: (Belief & { docId: string })[] = existingSnap.docs.map(d => ({
      ...(d.data() as Belief),
      docId: d.id,
    }));

    const newBeliefs: Belief[] = [];
    const updatedBeliefs: string[] = [];

    for (const belief of extracted.beliefs) {
      // Check if this belief matches an existing one (semantic similarity via simple keyword overlap)
      const match = existing.find(e =>
        e.text.toLowerCase().split(' ').filter(w => w.length > 3)
          .some(w => belief.text.toLowerCase().includes(w)) &&
        e.category === belief.category
      );

      if (match) {
        // Update existing belief
        const newStatus = belief.text !== match.text ? 'evolved' : 'active';
        await beliefsRef.doc(match.docId).update({
          lastSeen: now,
          occurrences: (match.occurrences || 1) + 1,
          status: newStatus,
          evolution: [...(match.evolution || []), { date: now, context: belief.quote }],
        });
        updatedBeliefs.push(match.docId);
      } else {
        // New belief
        const newBelief: Belief = {
          id: crypto.randomUUID(),
          text: belief.text,
          category: belief.category as Belief['category'],
          firstExpressed: now,
          lastSeen: now,
          occurrences: 1,
          status: 'active',
          evolution: [{ date: now, context: belief.quote }],
        };
        await beliefsRef.add(newBelief);
        newBeliefs.push(newBelief);
      }
    }

    // Build belief lifespan chart data
    const allBeliefsSnap = await beliefsRef.orderBy('firstExpressed', 'asc').get();
    const chart = allBeliefsSnap.docs.map(d => {
      const b = d.data() as Belief;
      const firstDate = new Date(b.firstExpressed);
      const lastDate = new Date(b.lastSeen);
      const lifespanDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: b.id,
        text: b.text,
        category: b.category,
        status: b.status,
        lifespanDays,
        firstExpressed: b.firstExpressed,
        lastSeen: b.lastSeen,
        occurrences: b.occurrences,
      };
    });

    log.info('Belief tracking complete', {
      userId,
      newBeliefs: newBeliefs.length,
      updatedBeliefs: updatedBeliefs.length,
      totalBeliefs: chart.length,
    });

    return NextResponse.json({
      beliefs: extracted.beliefs,
      newBeliefs: newBeliefs.length,
      updatedBeliefs: updatedBeliefs.length,
      chart,
    });
  } catch (error) {
    log.error('Belief tracking error', {}, error);
    return NextResponse.json({ error: 'Belief tracking failed' }, { status: 500 });
  }
}
