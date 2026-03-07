import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

/**
 * Homework Companion API
 * 
 * Provides Socratic guidance while users work through their therapy homework.
 * Not a replacement for therapy — a companion that helps the user reflect
 * more deeply on homework exercises between sessions.
 */

const reflectionSchema = z.object({
  homeworkId: z.string(),
  exerciseType: z.string().max(200),
  userResponse: z.string().min(1).max(5000),
  context: z.string().max(1000).optional(),
});

const journalSchema = z.object({
  homeworkId: z.string(),
  entries: z.array(z.object({
    prompt: z.string().max(500),
    response: z.string().max(3000),
    timestamp: z.string(),
  })).max(20),
  completionNotes: z.string().max(1000).optional(),
});

// Socratic prompts based on common CBT/therapy homework types
const EXERCISE_PROMPTS: Record<string, string[]> = {
  'thought-record': [
    'You identified this thought — now what evidence supports it, and what evidence contradicts it?',
    'If a trusted friend had this thought, what would you say to them?',
    'What is the most balanced way to think about this situation?',
    'On a scale of 1-10, how much do you believe this thought now compared to when you first wrote it?',
  ],
  'behavioural-activation': [
    'What did you notice about your mood before and after this activity?',
    'Was there a moment during this activity where you felt differently than expected?',
    'What made this activity meaningful or enjoyable — even if only slightly?',
    'What barrier did you overcome to do this? What does that say about your capabilities?',
  ],
  'exposure': [
    'What did you predict would happen before the exposure?',
    'What actually happened? How different was it from your prediction?',
    'What did you learn about your ability to cope?',
    'If you could tell your pre-exposure self one thing, what would it be?',
  ],
  'mindfulness': [
    'What did you notice during the exercise that surprised you?',
    'When your mind wandered, where did it go? What might that tell you?',
    'How does your body feel right now compared to before the exercise?',
    'What would it mean to bring this quality of attention to one moment in your daily life?',
  ],
  'values-clarification': [
    'How does this value show up in your daily life — or where is it missing?',
    'If you were living fully according to this value, what would be different?',
    'What gets in the way of honouring this value? Is it external or internal?',
    'What is one small step you could take this week that aligns with this value?',
  ],
  'gratitude': [
    'What made this particular thing worth noticing today?',
    'How does focusing on this change the way you feel right now?',
    'Is there a pattern in the things you feel grateful for? What does that reveal?',
    'What would you want to remember about today if you looked back in a year?',
  ],
  'letter-writing': [
    'What feelings came up as you wrote this? Were any unexpected?',
    'Is there something you wanted to say but held back? What stopped you?',
    'How do you feel now that you have put these words on paper?',
    'If the recipient could read this, what do you hope they would understand?',
  ],
  'self-compassion': [
    'What would you say to someone you love who was going through this?',
    'What does your inner critic say — and what does your compassionate self say?',
    'Where do you feel this kindness in your body when you offer it to yourself?',
    'What makes self-compassion feel difficult? What belief is underneath that?',
  ],
  'default': [
    'What did you notice while working through this exercise?',
    'Was there a moment of insight or resistance? What was it about?',
    'How does completing this homework connect to what you discussed in session?',
    'What would you like to bring to your next session based on this experience?',
  ],
};

function getSocraticPrompt(exerciseType: string, userResponse: string): string {
  const normalizedType = exerciseType.toLowerCase().replace(/\s+/g, '-');
  const prompts = EXERCISE_PROMPTS[normalizedType] || EXERCISE_PROMPTS['default'];
  
  const lowerResponse = userResponse.toLowerCase();
  
  // Try to match a contextually appropriate prompt
  if (lowerResponse.includes('difficult') || lowerResponse.includes('hard') || lowerResponse.includes('struggled')) {
    return 'What made this difficult? Sometimes resistance points us toward something important.';
  }
  if (lowerResponse.includes('surprised') || lowerResponse.includes('unexpected') || lowerResponse.includes('realized')) {
    return 'That sounds like an important observation. What shifted in your understanding?';
  }
  if (lowerResponse.includes('nothing') || lowerResponse.includes('pointless') || lowerResponse.includes('don\'t see')) {
    return 'It sounds like this felt unhelpful. What would you need for it to feel more relevant? Sometimes the most resistant exercises touch on something meaningful.';
  }
  if (lowerResponse.length < 50) {
    return 'You\'ve started something here. Could you say a bit more about what you noticed or felt?';
  }
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/homework-companion', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || body.action;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();

    // Get a Socratic reflection prompt
    if (action === 'reflect') {
      const parsed = reflectionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const sanitizedResponse = sanitizeMessage(parsed.data.userResponse);
      const prompt = getSocraticPrompt(parsed.data.exerciseType, sanitizedResponse);

      // Log the reflection for the homework journal
      const reflectionId = crypto.randomUUID();
      await db.collection('homeworkReflections').doc(reflectionId).set({
        id: reflectionId,
        userId,
        homeworkId: parsed.data.homeworkId,
        exerciseType: parsed.data.exerciseType,
        userResponse: sanitizedResponse,
        socraticPrompt: prompt,
        context: parsed.data.context ? sanitizeMessage(parsed.data.context) : null,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ prompt, reflectionId });
    }

    // Save homework journal
    if (action === 'journal') {
      const parsed = journalSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const journalId = crypto.randomUUID();
      const sanitizedEntries = parsed.data.entries.map(e => ({
        prompt: e.prompt,
        response: sanitizeMessage(e.response),
        timestamp: e.timestamp,
      }));

      await db.collection('homeworkJournals').doc(journalId).set({
        id: journalId,
        userId,
        homeworkId: parsed.data.homeworkId,
        entries: sanitizedEntries,
        completionNotes: parsed.data.completionNotes ? sanitizeMessage(parsed.data.completionNotes) : null,
        createdAt: new Date().toISOString(),
      });

      log.info('Homework journal saved', { userId, homeworkId: parsed.data.homeworkId });

      return NextResponse.json({ journalId });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    log.error('Homework companion error', {}, error);
    return NextResponse.json({ error: 'Failed to process homework companion request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/homework-companion', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const homeworkId = url.searchParams.get('homeworkId');

    if (!isAdminConfigured()) {
      return NextResponse.json({ reflections: [], journals: [] });
    }

    const db = getAdminFirestore();

    // Get reflections for a specific homework
    let reflectionsQuery = db.collection('homeworkReflections')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (homeworkId) {
      reflectionsQuery = db.collection('homeworkReflections')
        .where('userId', '==', userId)
        .where('homeworkId', '==', homeworkId)
        .orderBy('createdAt', 'desc')
        .limit(20);
    }

    const reflectionsSnapshot = await reflectionsQuery.get();
    const reflections = reflectionsSnapshot.docs.map(d => d.data());

    // Get journals
    let journalsQuery = db.collection('homeworkJournals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10);

    if (homeworkId) {
      journalsQuery = db.collection('homeworkJournals')
        .where('userId', '==', userId)
        .where('homeworkId', '==', homeworkId)
        .orderBy('createdAt', 'desc')
        .limit(10);
    }

    const journalsSnapshot = await journalsQuery.get();
    const journals = journalsSnapshot.docs.map(d => d.data());

    // Get available exercise types for prompts
    const exerciseTypes = Object.keys(EXERCISE_PROMPTS).filter(t => t !== 'default').map(t => ({
      id: t,
      label: t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));

    return NextResponse.json({ reflections, journals, exerciseTypes });
  } catch (error) {
    log.error('Homework companion fetch error', {}, error);
    return NextResponse.json({ reflections: [], journals: [], exerciseTypes: [] });
  }
}
