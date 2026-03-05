import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';

/**
 * Thread Graph API — Feature for D3 visualization
 * GET /api/thread-graph
 * 
 * Returns nodes and links for the Thread visualization.
 * Nodes: questions, answers, themes
 * Links: response connections, theme associations, contradictions
 */

interface ThreadNode {
  id: string;
  type: 'question' | 'answer' | 'theme';
  content: string;
  depth: number;
  sessionId?: string;
  createdAt?: string;
}

interface ThreadLink {
  source: string;
  target: string;
  type: 'response' | 'theme' | 'contradiction';
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/thread-graph', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const db = getAdminFirestore();
    const nodes: ThreadNode[] = [];
    const links: ThreadLink[] = [];
    const themeMap = new Map<string, string>(); // theme -> nodeId

    // Fetch user's sessions
    const sessionsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    // Fetch thread context
    const threadDoc = await db.collection('threads').doc(userId).get();
    const threadData = threadDoc.exists ? threadDoc.data() : null;

    // Process sessions into nodes
    for (const sessionDoc of sessionsSnap.docs) {
      const session = sessionDoc.data();
      const messages = session.messages || [];
      const sessionId = sessionDoc.id;

      let prevNodeId: string | null = null;

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const nodeId = `${sessionId}-${i}`;
        const isQuestion = msg.role === 'assistant';

        nodes.push({
          id: nodeId,
          type: isQuestion ? 'question' : 'answer',
          content: msg.content?.slice(0, 200) || '',
          depth: msg.depth || 1,
          sessionId,
          createdAt: session.createdAt,
        });

        // Link to previous message in conversation
        if (prevNodeId) {
          links.push({
            source: prevNodeId,
            target: nodeId,
            type: 'response',
          });
        }

        prevNodeId = nodeId;
      }
    }

    // Extract themes from patterns if available
    const patternsDoc = await db.collection('patterns').doc(userId).get();
    if (patternsDoc.exists) {
      const patterns = patternsDoc.data();
      const recurringPatterns = patterns?.recurringPatterns || [];
      
      // Create theme nodes
      recurringPatterns.slice(0, 5).forEach((theme: string, idx: number) => {
        const themeId = `theme-${idx}`;
        nodes.push({
          id: themeId,
          type: 'theme',
          content: theme,
          depth: 0,
        });
        themeMap.set(theme.toLowerCase(), themeId);
      });

      // Link themes to relevant answers (simple keyword matching)
      for (const node of nodes) {
        if (node.type === 'answer') {
          const contentLower = node.content.toLowerCase();
          for (const [themeLower, themeId] of themeMap) {
            if (contentLower.includes(themeLower.split(' ')[0])) {
              links.push({
                source: node.id,
                target: themeId,
                type: 'theme',
              });
              break; // Only one theme link per answer
            }
          }
        }
      }
    }

    // Check for contradictions from beliefs
    const beliefsDoc = await db.collection('beliefs').doc(userId).get();
    if (beliefsDoc.exists) {
      const beliefs = beliefsDoc.data()?.beliefs || [];
      const contradicted = beliefs.filter((b: any) => b.status === 'contradicted');
      
      // Mark contradiction links (simplified - would need embedding comparison for real semantic matching)
      if (contradicted.length > 0 && nodes.length > 10) {
        // Add a sample contradiction link between distant nodes
        const questionNodes = nodes.filter(n => n.type === 'question');
        if (questionNodes.length >= 2) {
          links.push({
            source: questionNodes[0].id,
            target: questionNodes[Math.floor(questionNodes.length / 2)].id,
            type: 'contradiction',
          });
        }
      }
    }

    log.info('Thread graph generated', { userId, nodeCount: nodes.length, linkCount: links.length });

    return NextResponse.json({ nodes, links });
  } catch (error) {
    log.error('Thread graph error', {}, error);
    return NextResponse.json({ error: 'Failed to generate thread graph' }, { status: 500 });
  }
}
