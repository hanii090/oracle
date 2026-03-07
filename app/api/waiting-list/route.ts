import { NextResponse } from 'next/server';
import { verifyAuth, getAdminFirestore } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { z } from 'zod';
import { sanitizeMessage } from '@/lib/safety';

const updateProfileSchema = z.object({
  referralReason: z.enum(['anxiety', 'depression', 'grief', 'trauma', 'relationship', 'ocd', 'ptsd', 'other']).optional(),
  referralReasonOther: z.string().max(200).optional(),
  waitingSince: z.string().optional(),
  gpName: z.string().max(200).optional(),
  gpPractice: z.string().max(200).optional(),
  nhsArea: z.string().max(200).optional(),
  weeklyCheckInEnabled: z.boolean().optional(),
});

const checkInSchema = z.object({
  weekNumber: z.number().min(1).max(104),
  responses: z.array(z.object({
    question: z.string().max(500),
    answer: z.string().max(2000),
  })).max(5),
  moodScore: z.number().min(1).max(10).optional(),
});

export interface WaitingListProfile {
  userId: string;
  referralReason: string;
  referralReasonOther?: string;
  waitingSince: string | null;
  gpName: string | null;
  gpPractice: string | null;
  nhsArea: string | null;
  weeklyCheckInEnabled: boolean;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  readinessBrief: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaitingListCheckIn {
  id: string;
  userId: string;
  weekNumber: number;
  responses: Array<{ question: string; answer: string }>;
  moodScore: number | null;
  readinessBriefSnippet: string | null;
  createdAt: string;
}

// Themed weekly check-in questions by referral reason
const WEEKLY_THEMES: Record<string, Array<{ theme: string; questions: string[] }>> = {
  anxiety: [
    { theme: 'Understanding your worry', questions: ['What does your anxiety tend to focus on most — the future, the past, or the present?', 'When you notice anxiety rising, where do you feel it in your body?', 'What would your life look like if anxiety had less power over your decisions?'] },
    { theme: 'Safety and control', questions: ['What situations make you feel most safe and in control?', 'When anxiety tells you something is dangerous, how often does that turn out to be true?', 'What is one small thing you avoided this week because of worry?'] },
    { theme: 'Patterns and triggers', questions: ['What time of day does your anxiety tend to be strongest?', 'Is there a recurring thought that keeps showing up this week?', 'What would you say to a friend who had the same worry?'] },
    { theme: 'Coping and grounding', questions: ['What has helped you manage anxiety in the past, even a little?', 'When was the last time you felt genuinely calm — what were you doing?', 'If you could teach someone one thing about living with anxiety, what would it be?'] },
  ],
  depression: [
    { theme: 'Energy and motivation', questions: ['What feels hardest to do right now — and what feels slightly more manageable?', 'When did you last feel a spark of interest in something, however small?', 'If energy were not an issue, what would you do with your day?'] },
    { theme: 'Connection and isolation', questions: ['Who in your life understands what you are going through?', 'What does loneliness feel like for you — is it about being alone, or something else?', 'When was the last time you felt genuinely seen by someone?'] },
    { theme: 'Self-worth and inner critic', questions: ['What does your inner critic say most often?', 'If someone else said those words to you, would you accept them as true?', 'What is one thing you did this week that took effort, even if it felt small?'] },
    { theme: 'Meaning and direction', questions: ['What matters to you — even if you cannot feel it right now?', 'What would "good enough" look like for you today?', 'Is there something you used to enjoy that you would like to try again?'] },
  ],
  grief: [
    { theme: 'Naming the loss', questions: ['What have you lost — and what do you miss most about it?', 'How has this loss changed the way you see your daily life?', 'What do you wish other people understood about your grief?'] },
    { theme: 'Emotions in grief', questions: ['What emotions have surprised you since the loss?', 'Is there an emotion you feel you are "not allowed" to have about this?', 'What does a wave of grief feel like when it arrives?'] },
    { theme: 'Memory and meaning', questions: ['What is a memory that brings both pain and comfort?', 'How would the person or thing you lost want you to remember them?', 'What part of what you lost do you want to carry forward?'] },
    { theme: 'Living alongside grief', questions: ['What does it mean to you to "move forward" — and does that phrase feel right?', 'When grief is quieter, what fills the space?', 'What would healing look like if it did not mean forgetting?'] },
  ],
  trauma: [
    { theme: 'Safety now', questions: ['What helps you feel safe in this moment?', 'Where in your body do you notice tension or guardedness right now?', 'What is one thing in your environment right now that feels grounding?'] },
    { theme: 'Boundaries and trust', questions: ['What does trust look like for you — and who has earned it?', 'When do you find it hardest to say no?', 'What would it feel like to have your boundaries fully respected?'] },
    { theme: 'Patterns from the past', questions: ['Do you notice any reactions that feel bigger than the current situation warrants?', 'What does your body do when it senses something familiar from the past?', 'What would you say to your younger self about what happened?'] },
    { theme: 'Reclaiming agency', questions: ['What is one choice you made this week that felt like it was truly yours?', 'What does strength look like for you — is it always loud?', 'If healing is not linear, where do you feel you are today?'] },
  ],
  relationship: [
    { theme: 'Patterns in relating', questions: ['What role do you tend to play in your closest relationships?', 'When conflict arises, what is your first instinct — fight, flee, freeze, or fawn?', 'What do you need from others that you find hardest to ask for?'] },
    { theme: 'Boundaries and needs', questions: ['Where in your relationships do you tend to lose yourself?', 'What would it look like to put your needs first without guilt?', 'Is there a conversation you have been avoiding — and what makes it hard?'] },
    { theme: 'Attachment and history', questions: ['How did your earliest relationships teach you about love?', 'Do you notice patterns from your family showing up in your current relationships?', 'What does "secure" feel like in a relationship — have you experienced it?'] },
    { theme: 'Growth and change', questions: ['What would your ideal relationship with yourself look like?', 'If you could change one dynamic in your closest relationship, what would it be?', 'What have your relationships taught you about who you are?'] },
  ],
  ocd: [
    { theme: 'Understanding intrusive thoughts', questions: ['What is the difference between a thought you choose and one that just arrives?', 'When an intrusive thought appears, what does your mind tell you it means about you?', 'What would it be like to notice the thought without responding to it?'] },
    { theme: 'Rituals and relief', questions: ['What rituals or behaviours give you temporary relief?', 'How long does the relief last before the doubt returns?', 'If you could not perform the ritual, what is the worst thing your mind says would happen?'] },
    { theme: 'Certainty and doubt', questions: ['What would "good enough" certainty feel like — not perfect, just enough?', 'When has sitting with uncertainty turned out to be okay?', 'What areas of your life are you able to tolerate not knowing?'] },
    { theme: 'Values beyond OCD', questions: ['What does OCD stop you from doing that matters to you?', 'If OCD had less volume, what would you do differently this week?', 'What would you want someone who does not have OCD to understand about it?'] },
  ],
  ptsd: [
    { theme: 'Present-moment safety', questions: ['Right now, in this moment, what tells you that you are safe?', 'What grounding techniques have you tried — and which ones help?', 'What does your body need right now?'] },
    { theme: 'Triggers and responses', questions: ['What situations or stimuli tend to bring you back to the past?', 'When you are triggered, what is the first thing you notice — a thought, a feeling, or a body sensation?', 'What has helped you come back to the present after a flashback?'] },
    { theme: 'Making sense of it', questions: ['What meaning have you made of what happened — and does that meaning feel fair?', 'Are there beliefs about yourself that formed because of the trauma?', 'What would it mean to you to not be defined by what happened?'] },
    { theme: 'Rebuilding', questions: ['What parts of your life feel most "yours" right now?', 'What is one thing you have reclaimed since the trauma?', 'What does post-traumatic growth mean to you — is it even a concept that fits?'] },
  ],
  other: [
    { theme: 'Getting to know yourself', questions: ['What brought you to seek support — what was the moment you decided?', 'What do you most want to understand about yourself right now?', 'If therapy could give you one thing, what would it be?'] },
    { theme: 'Patterns and awareness', questions: ['What patterns do you notice in your thoughts or behaviour?', 'When do you feel most like yourself — and when do you feel furthest from it?', 'What would the people closest to you say you struggle with?'] },
    { theme: 'Coping and resources', questions: ['What do you already do that helps, even a little?', 'What has not worked — and what did you learn from that?', 'Who or what in your life is a source of strength?'] },
    { theme: 'Looking ahead', questions: ['What would "better" look like for you — not perfect, just better?', 'What are you most hopeful about?', 'What question do you wish someone would ask you?'] },
  ],
};

function generateReadinessBrief(checkIns: WaitingListCheckIn[], referralReason: string): string {
  if (checkIns.length === 0) return '';

  const themes = checkIns.map(c => {
    const weekThemes = WEEKLY_THEMES[referralReason] || WEEKLY_THEMES.other;
    const weekIdx = (c.weekNumber - 1) % weekThemes.length;
    return weekThemes[weekIdx].theme;
  });

  const keyResponses = checkIns
    .flatMap(c => c.responses)
    .filter(r => r.answer.length > 50)
    .slice(-3)
    .map(r => r.answer.slice(0, 200));

  const avgMood = checkIns
    .filter(c => c.moodScore !== null)
    .reduce((sum, c, _, arr) => sum + (c.moodScore || 0) / arr.length, 0);

  let brief = `Readiness Brief for First Appointment\n\n`;
  brief += `This person has been using Sorca while on the NHS Talking Therapies waiting list. `;
  brief += `They have completed ${checkIns.length} weekly check-in${checkIns.length > 1 ? 's' : ''} `;
  brief += `exploring themes including: ${[...new Set(themes)].join(', ')}.\n\n`;

  if (avgMood > 0) {
    brief += `Average self-reported mood: ${avgMood.toFixed(1)}/10. `;
    if (avgMood <= 4) brief += `Mood has been consistently low.\n\n`;
    else if (avgMood <= 6) brief += `Mood has been moderate with some fluctuation.\n\n`;
    else brief += `Mood has been relatively stable.\n\n`;
  }

  if (keyResponses.length > 0) {
    brief += `Key reflections in their own words:\n`;
    keyResponses.forEach((r, i) => {
      brief += `${i + 1}. "${r}${r.length >= 200 ? '...' : ''}"\n`;
    });
    brief += `\n`;
  }

  brief += `This summary was self-generated by the individual using Sorca, a Socratic reflection tool. `;
  brief += `It is not a clinical assessment and should not be treated as one. `;
  brief += `It is intended to help the individual bring structured reflections to their first appointment.`;

  return brief;
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/waiting-list', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || body.action;

    if (!isAdminConfigured()) {
      // Graceful fallback — return mock success so the UI doesn't break
      if (action === 'checkin') {
        return NextResponse.json({ checkIn: { id: 'offline', weekNumber: body.weekNumber || 1, responses: [], moodScore: null, createdAt: new Date().toISOString() } });
      }
      if (action === 'readiness-brief') {
        return NextResponse.json({ brief: 'Database is not configured. Please check your Firebase Admin setup.' });
      }
      return NextResponse.json({ profile: { userId, referralReason: body.referralReason || 'other', totalCheckIns: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    }

    const db = getAdminFirestore();

    // Save a check-in
    if (action === 'checkin') {
      const parsed = checkInSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { weekNumber, responses, moodScore } = parsed.data;

      const sanitizedResponses = responses.map(r => ({
        question: r.question,
        answer: sanitizeMessage(r.answer),
      }));

      const checkIn: WaitingListCheckIn = {
        id: crypto.randomUUID(),
        userId,
        weekNumber,
        responses: sanitizedResponses,
        moodScore: moodScore ?? null,
        readinessBriefSnippet: null,
        createdAt: new Date().toISOString(),
      };

      await db.collection('waitingListCheckIns').doc(checkIn.id).set(checkIn);

      // Update profile stats
      const profileRef = db.collection('waitingListProfiles').doc(userId);
      const profileDoc = await profileRef.get();
      if (profileDoc.exists) {
        const profile = profileDoc.data() as WaitingListProfile;
        await profileRef.update({
          totalCheckIns: (profile.totalCheckIns || 0) + 1,
          lastCheckInDate: checkIn.createdAt,
          updatedAt: checkIn.createdAt,
        });
      }

      log.info('Waiting list check-in saved', { userId, weekNumber });

      return NextResponse.json({ checkIn });
    }

    // Generate readiness brief
    if (action === 'readiness-brief') {
      const profileDoc = await db.collection('waitingListProfiles').doc(userId).get();
      const profile = profileDoc.exists ? profileDoc.data() as WaitingListProfile : null;

      const checkInsSnapshot = await db.collection('waitingListCheckIns')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .limit(52)
        .get();

      const checkIns = checkInsSnapshot.docs.map(d => d.data() as WaitingListCheckIn);
      const brief = generateReadinessBrief(checkIns, profile?.referralReason || 'other');

      // Save brief to profile
      if (profileDoc.exists) {
        await db.collection('waitingListProfiles').doc(userId).update({
          readinessBrief: brief,
          updatedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ brief });
    }

    // Update/create profile
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const profileRef = db.collection('waitingListProfiles').doc(userId);
    const existingDoc = await profileRef.get();
    const now = new Date().toISOString();

    if (existingDoc.exists) {
      const updates: Record<string, unknown> = { updatedAt: now };
      const data = parsed.data;
      if (data.referralReason !== undefined) updates.referralReason = data.referralReason;
      if (data.referralReasonOther !== undefined) updates.referralReasonOther = sanitizeMessage(data.referralReasonOther);
      if (data.waitingSince !== undefined) updates.waitingSince = data.waitingSince;
      if (data.gpName !== undefined) updates.gpName = sanitizeMessage(data.gpName);
      if (data.gpPractice !== undefined) updates.gpPractice = sanitizeMessage(data.gpPractice);
      if (data.nhsArea !== undefined) updates.nhsArea = sanitizeMessage(data.nhsArea);
      if (data.weeklyCheckInEnabled !== undefined) updates.weeklyCheckInEnabled = data.weeklyCheckInEnabled;

      await profileRef.update(updates);
      const updated = await profileRef.get();
      return NextResponse.json({ profile: updated.data() });
    } else {
      const profile: WaitingListProfile = {
        userId,
        referralReason: parsed.data.referralReason || 'other',
        referralReasonOther: parsed.data.referralReasonOther ? sanitizeMessage(parsed.data.referralReasonOther) : undefined,
        waitingSince: parsed.data.waitingSince || null,
        gpName: parsed.data.gpName ? sanitizeMessage(parsed.data.gpName) : null,
        gpPractice: parsed.data.gpPractice ? sanitizeMessage(parsed.data.gpPractice) : null,
        nhsArea: parsed.data.nhsArea ? sanitizeMessage(parsed.data.nhsArea) : null,
        weeklyCheckInEnabled: parsed.data.weeklyCheckInEnabled ?? true,
        totalCheckIns: 0,
        lastCheckInDate: null,
        readinessBrief: null,
        createdAt: now,
        updatedAt: now,
      };

      await profileRef.set(profile);
      log.info('Waiting list profile created', { userId });

      return NextResponse.json({ profile });
    }
  } catch (error) {
    log.error('Waiting list error', {}, error);
    return NextResponse.json({ error: 'Failed to process waiting list request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const log = createLogger({ route: '/api/waiting-list', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    if (!isAdminConfigured()) {
      return NextResponse.json({ profile: null, checkIns: [], themes: WEEKLY_THEMES.other });
    }

    const db = getAdminFirestore();

    // Get profile
    const profileDoc = await db.collection('waitingListProfiles').doc(userId).get();
    const profile = profileDoc.exists ? profileDoc.data() as WaitingListProfile : null;

    // Get check-ins
    const checkInsSnapshot = await db.collection('waitingListCheckIns')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(52)
      .get();

    const checkIns = checkInsSnapshot.docs.map(d => d.data() as WaitingListCheckIn);

    // Get themes for their referral reason
    const themes = WEEKLY_THEMES[profile?.referralReason || 'other'] || WEEKLY_THEMES.other;

    return NextResponse.json({ profile, checkIns, themes });
  } catch (error) {
    log.error('Waiting list fetch error', {}, error);
    return NextResponse.json({ profile: null, checkIns: [], themes: WEEKLY_THEMES.other });
  }
}
