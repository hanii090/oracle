import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const moodCheckInSchema = z.object({
  score: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
  activities: z.array(z.string()).optional(),
});

export interface MoodCheckIn {
  id: string;
  userId: string;
  date: string;
  score: number;
  notes?: string;
  activities?: string[];
  timestamp: string;
}

// Psychoeducation content library
export const PSYCHOEDUCATION_CONTENT = {
  cbt_basics: {
    id: 'cbt_basics',
    title: 'Understanding CBT',
    category: 'therapy_models',
    duration: '5 min read',
    content: `
# Cognitive Behavioural Therapy (CBT)

CBT is based on the idea that our thoughts, feelings, and behaviours are all connected. By changing unhelpful thinking patterns, we can change how we feel and act.

## The CBT Triangle

**Thoughts** → **Feelings** → **Behaviours**

When something happens, we have automatic thoughts about it. These thoughts affect how we feel, which then influences what we do.

## Example

**Situation**: Friend doesn't reply to your message
**Unhelpful thought**: "They're ignoring me, they don't like me anymore"
**Feeling**: Anxious, sad
**Behaviour**: Avoid contacting them, withdraw

**Alternative thought**: "They might be busy, I'll give them time"
**Feeling**: Calm, understanding
**Behaviour**: Continue as normal, check in later

## Key Techniques

1. **Thought challenging**: Question unhelpful thoughts
2. **Behavioural experiments**: Test your predictions
3. **Activity scheduling**: Plan enjoyable activities
4. **Graded exposure**: Gradually face fears
    `.trim(),
  },
  anxiety_psychoed: {
    id: 'anxiety_psychoed',
    title: 'Understanding Anxiety',
    category: 'conditions',
    duration: '4 min read',
    content: `
# Understanding Anxiety

Anxiety is a normal human emotion that helps protect us from danger. However, sometimes our anxiety system becomes overactive.

## The Fight-Flight-Freeze Response

When we perceive threat, our body prepares to:
- **Fight**: Confront the danger
- **Flight**: Run away
- **Freeze**: Stay still and hope danger passes

This causes physical symptoms like:
- Racing heart
- Shallow breathing
- Muscle tension
- Sweating
- Stomach churning

## Why Anxiety Becomes a Problem

Anxiety becomes problematic when:
- It's triggered by non-dangerous situations
- It's disproportionate to the actual threat
- It interferes with daily life
- It persists even when the threat is gone

## What Maintains Anxiety

1. **Avoidance**: Not facing fears keeps them strong
2. **Safety behaviours**: Things we do to feel safe that actually maintain anxiety
3. **Catastrophic thinking**: Expecting the worst
4. **Hypervigilance**: Constantly scanning for threat

## What Helps

- Gradual exposure to feared situations
- Challenging anxious thoughts
- Relaxation techniques
- Regular exercise
- Good sleep hygiene
    `.trim(),
  },
  depression_psychoed: {
    id: 'depression_psychoed',
    title: 'Understanding Depression',
    category: 'conditions',
    duration: '4 min read',
    content: `
# Understanding Depression

Depression is more than feeling sad. It's a persistent low mood that affects how you think, feel, and function.

## Common Symptoms

**Emotional**:
- Persistent sadness or emptiness
- Hopelessness
- Guilt or worthlessness
- Irritability

**Physical**:
- Fatigue and low energy
- Sleep problems (too much or too little)
- Appetite changes
- Aches and pains

**Cognitive**:
- Difficulty concentrating
- Negative thinking
- Memory problems
- Indecisiveness

**Behavioural**:
- Withdrawal from activities
- Neglecting responsibilities
- Reduced self-care

## The Depression Cycle

Low mood → Reduced activity → Less enjoyment → More negative thoughts → Lower mood

## Breaking the Cycle

**Behavioural Activation**: Start with small, achievable activities that give you a sense of:
- **Pleasure**: Things you enjoy
- **Mastery**: Things that give you a sense of achievement

Even when you don't feel like it, doing activities can lift your mood.
    `.trim(),
  },
  grounding_techniques: {
    id: 'grounding_techniques',
    title: 'Grounding Techniques',
    category: 'coping_skills',
    duration: '3 min read',
    content: `
# Grounding Techniques

Grounding helps bring you back to the present moment when you're feeling overwhelmed, anxious, or disconnected.

## 5-4-3-2-1 Technique

Notice:
- **5** things you can SEE
- **4** things you can TOUCH
- **3** things you can HEAR
- **2** things you can SMELL
- **1** thing you can TASTE

## Box Breathing

1. Breathe IN for 4 seconds
2. HOLD for 4 seconds
3. Breathe OUT for 4 seconds
4. HOLD for 4 seconds
5. Repeat 4 times

## Physical Grounding

- Press your feet firmly into the floor
- Hold a cold object (ice cube, cold drink)
- Splash cold water on your face
- Clench and release your fists

## Mental Grounding

- Name 5 things in the room that are blue
- Count backwards from 100 by 7s
- Recite song lyrics or a poem
- Describe an everyday activity in detail

## Soothing Grounding

- Think of your favourite place
- Remember a time you felt safe
- Imagine someone who cares about you
- Say kind words to yourself
    `.trim(),
  },
  sleep_hygiene: {
    id: 'sleep_hygiene',
    title: 'Sleep Hygiene',
    category: 'lifestyle',
    duration: '3 min read',
    content: `
# Sleep Hygiene

Good sleep is essential for mental health. Here are evidence-based tips for better sleep.

## The Basics

- **Consistent schedule**: Same bedtime and wake time, even weekends
- **Wind-down routine**: 30-60 minutes of calm activities before bed
- **Cool, dark room**: 16-18°C is optimal
- **Comfortable bed**: Invest in good bedding

## What to Avoid

- **Screens**: No phones/tablets 1 hour before bed
- **Caffeine**: None after 2pm
- **Alcohol**: Disrupts sleep quality
- **Large meals**: Finish eating 2-3 hours before bed
- **Clock-watching**: Turn clocks away from view

## If You Can't Sleep

- Get up after 20 minutes of lying awake
- Do something calm in dim light
- Return to bed when sleepy
- Don't nap during the day

## The 15-Minute Rule

If you're not asleep within 15 minutes:
1. Get out of bed
2. Go to another room
3. Do something boring
4. Return when drowsy

This trains your brain that bed = sleep.
    `.trim(),
  },
};

// Grounding exercises with audio guide descriptions
export const GROUNDING_EXERCISES = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    duration: '4 minutes',
    description: 'A calming breathing technique used by Navy SEALs',
    steps: [
      'Find a comfortable position',
      'Breathe in slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Breathe out slowly for 4 seconds',
      'Hold empty for 4 seconds',
      'Repeat 4-6 times',
    ],
  },
  {
    id: 'body_scan',
    name: 'Body Scan',
    duration: '10 minutes',
    description: 'Progressive relaxation through body awareness',
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes',
      'Focus attention on your feet',
      'Notice any sensations without judgement',
      'Slowly move attention up through your body',
      'End at the top of your head',
    ],
  },
  {
    id: '54321_grounding',
    name: '5-4-3-2-1 Grounding',
    duration: '5 minutes',
    description: 'Use your senses to anchor to the present',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
  },
  {
    id: 'safe_place',
    name: 'Safe Place Visualisation',
    duration: '8 minutes',
    description: 'Create a mental sanctuary you can return to',
    steps: [
      'Close your eyes and breathe deeply',
      'Imagine a place where you feel completely safe',
      'Notice what you see in this place',
      'Notice what you hear',
      'Notice how your body feels here',
      'Stay as long as you need',
    ],
  },
];

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/between-sessions', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const parsed = moodCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { score, notes, activities } = parsed.data;

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    const checkIn: MoodCheckIn = {
      id: crypto.randomUUID(),
      userId,
      date: dateKey,
      score,
      notes: notes ? sanitizeMessage(notes) : undefined,
      activities,
      timestamp: now.toISOString(),
    };

    // Store in subcollection for efficient querying
    await db.collection('dailyMoodChecks').doc(userId).collection('checks').doc(dateKey).set(checkIn);

    // Check for concerning patterns
    let alert = null;
    if (score <= 3) {
      // Get last 3 days of check-ins
      const recentChecks = await db.collection('dailyMoodChecks')
        .doc(userId)
        .collection('checks')
        .orderBy('timestamp', 'desc')
        .limit(3)
        .get();

      const recentScores = recentChecks.docs.map(d => d.data().score);
      const allLow = recentScores.length >= 3 && recentScores.every(s => s <= 3);

      if (allLow) {
        // Create pattern alert for therapist
        const consents = await db.collection('therapistConsent')
          .where('patientId', '==', userId)
          .where('status', '==', 'active')
          .get();

        for (const consent of consents.docs) {
          const consentData = consent.data();
          if (consentData.permissions?.shareMoodData) {
            await db.collection('patternAlerts').add({
              therapistId: consentData.therapistId,
              clientId: userId,
              clientName: 'Client',
              type: 'pattern',
              message: 'Low mood scores for 3+ consecutive days',
              severity: 'medium',
              createdAt: now.toISOString(),
              acknowledged: false,
            });
          }
        }

        alert = {
          type: 'low_mood_pattern',
          message: 'We noticed your mood has been low for a few days. Would you like to try a grounding exercise?',
          suggestedExercise: GROUNDING_EXERCISES[0],
        };
      }
    }

    // Suggest content based on score
    let suggestedContent = null;
    if (score <= 4) {
      suggestedContent = PSYCHOEDUCATION_CONTENT.grounding_techniques;
    } else if (score <= 6) {
      suggestedContent = PSYCHOEDUCATION_CONTENT.cbt_basics;
    }

    log.info('Mood check-in recorded', { userId, score, date: dateKey });

    return NextResponse.json({
      checkIn,
      alert,
      suggestedContent,
      exercises: GROUNDING_EXERCISES,
    });
  } catch (error) {
    log.error('Mood check-in error', {}, error);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/between-sessions', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'mood';
    const days = parseInt(url.searchParams.get('days') || '7');
    const contentId = url.searchParams.get('contentId');

    // Return specific content
    if (type === 'content' && contentId) {
      const content = PSYCHOEDUCATION_CONTENT[contentId as keyof typeof PSYCHOEDUCATION_CONTENT];
      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      return NextResponse.json({ content });
    }

    // Return all content
    if (type === 'content') {
      return NextResponse.json({
        content: Object.values(PSYCHOEDUCATION_CONTENT),
        exercises: GROUNDING_EXERCISES,
      });
    }

    // Return mood history
    if (!isAdminConfigured()) {
      return NextResponse.json({ checkIns: [], trend: null });
    }

    const db = getAdminFirestore();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await db.collection('dailyMoodChecks')
      .doc(userId)
      .collection('checks')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'desc')
      .get();

    const checkIns = snapshot.docs.map(doc => doc.data());

    // Calculate trend
    let trend = null;
    if (checkIns.length >= 3) {
      const scores = checkIns.map(c => c.score);
      const firstHalf = scores.slice(Math.floor(scores.length / 2));
      const secondHalf = scores.slice(0, Math.floor(scores.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const diff = secondAvg - firstAvg;
      trend = {
        direction: diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable',
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        checkInCount: checkIns.length,
      };
    }

    return NextResponse.json({ checkIns, trend });
  } catch (error) {
    log.error('Between-sessions fetch error', {}, error);
    return NextResponse.json({ checkIns: [], trend: null });
  }
}
