import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}

const BLOG_POSTS: Record<string, BlogPost> = {
  'ai-therapy-companion-guide-2026': {
    slug: 'ai-therapy-companion-guide-2026',
    title: 'AI Therapy Companions: How They Work, When They Help, and What to Look For in 2026',
    excerpt: 'A comprehensive guide to AI-assisted therapy tools — what the research says, how they integrate with your therapist, and how to choose one that actually helps your mental health.',
    date: '2026-03-08',
    readTime: '12 min read',
    category: 'Guide',
    content: `
## What Is an AI Therapy Companion?

An AI therapy companion is a digital tool designed to support your mental health **between** therapy sessions — not replace your therapist. Think of it as a bridge across the 167 hours between weekly appointments.

Unlike general-purpose chatbots, therapy companions are built with clinical frameworks in mind: CBT (Cognitive Behavioural Therapy), ACT (Acceptance and Commitment Therapy), motivational interviewing, and other evidence-based approaches.

<svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;margin:2rem auto;display:block"><rect x="20" y="60" width="120" height="80" rx="12" fill="#0f766e" opacity="0.15" stroke="#0f766e" stroke-width="2"/><text x="80" y="105" text-anchor="middle" fill="#0f766e" font-size="13" font-weight="600">Therapy Session</text><rect x="340" y="20" width="120" height="160" rx="12" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1.5" stroke-dasharray="6 3"/><text x="400" y="90" text-anchor="middle" fill="#0f766e" font-size="12" font-weight="600">AI Companion</text><text x="400" y="110" text-anchor="middle" fill="#888" font-size="10">Mood · Homework</text><text x="400" y="126" text-anchor="middle" fill="#888" font-size="10">Voice · Coping</text><rect x="660" y="60" width="120" height="80" rx="12" fill="#0f766e" opacity="0.15" stroke="#0f766e" stroke-width="2"/><text x="720" y="105" text-anchor="middle" fill="#0f766e" font-size="13" font-weight="600">Next Session</text><line x1="140" y1="100" x2="340" y2="100" stroke="#0f766e" stroke-width="1.5" stroke-dasharray="6 3"/><line x1="460" y1="100" x2="660" y2="100" stroke="#0f766e" stroke-width="1.5" stroke-dasharray="6 3"/><text x="240" y="90" text-anchor="middle" fill="#999" font-size="11">167 hours</text><text x="560" y="90" text-anchor="middle" fill="#999" font-size="11">Prepared</text></svg>

They typically offer:

- **Mood tracking** — Daily check-ins that build a picture over time
- **Homework support** — Interactive exercises instead of static worksheets
- **Voice sessions** — Talk through thoughts when typing feels too slow
- **Therapist integration** — Your therapist sees your progress (with consent)
- **Crisis safety** — Automatic escalation to helplines when risk is detected

## What the Research Says

The evidence for AI-assisted therapy support is growing rapidly:

### Homework Completion

Traditional therapy worksheets have a completion rate of **20-30%**. AI-assisted conversational homework achieves **75%** completion — a 3x improvement.

<svg viewBox="0 0 600 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;margin:2rem auto;display:block"><text x="20" y="30" fill="#555" font-size="13" font-weight="600">Homework Completion Rate</text><rect x="170" y="60" width="108" height="40" rx="6" fill="#ddd"/><text x="160" y="85" text-anchor="end" fill="#666" font-size="12">Worksheets</text><text x="288" y="85" fill="#999" font-size="12">25%</text><rect x="170" y="120" width="324" height="40" rx="6" fill="#0f766e" opacity="0.2"/><rect x="170" y="120" width="324" height="40" rx="6" fill="#0f766e" opacity="0.7"/><text x="160" y="145" text-anchor="end" fill="#666" font-size="12">AI-Assisted</text><text x="504" y="145" fill="#0f766e" font-size="12" font-weight="700">75%</text><line x1="170" y1="55" x2="170" y2="175" stroke="#ccc" stroke-width="1"/></svg>

### Between-Session Engagement

Clients using AI companions show **3x more engagement** between sessions. This means more reflection, more practice, and faster progress.

### Session Preparedness

Therapists report clients arrive **better prepared** — with clearer insights, tracked moods, and specific topics to explore. Sessions go deeper, faster.

### NHS Waiting List Support

In the UK, the average NHS therapy waiting time is **18 weeks**. AI companions provide structured support during this gap — mood tracking, grounding exercises, and psychoeducation — so people aren't left with nothing.

## How AI Therapy Companions Actually Work

### 1. Mood Monitoring

Most companions ask you to rate your mood daily (usually 1-10) and optionally log activities, sleep, and notes. Over time, this creates a mood map that reveals patterns you wouldn't spot otherwise.

<svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;margin:2rem auto;display:block"><text x="20" y="20" fill="#555" font-size="13" font-weight="600">Weekly Mood Pattern</text><line x1="50" y1="40" x2="50" y2="180" stroke="#ddd" stroke-width="1"/><line x1="50" y1="180" x2="560" y2="180" stroke="#ddd" stroke-width="1"/><text x="40" y="50" text-anchor="end" fill="#999" font-size="9">10</text><text x="40" y="110" text-anchor="end" fill="#999" font-size="9">5</text><text x="40" y="178" text-anchor="end" fill="#999" font-size="9">1</text><polyline points="80,130 155,110 230,140 305,90 380,85 455,70 530,60" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="80" cy="130" r="4" fill="#0f766e"/><circle cx="155" cy="110" r="4" fill="#0f766e"/><circle cx="230" cy="140" r="4" fill="#0f766e"/><circle cx="305" cy="90" r="4" fill="#0f766e"/><circle cx="380" cy="85" r="4" fill="#0f766e"/><circle cx="455" cy="70" r="4" fill="#0f766e"/><circle cx="530" cy="60" r="4" fill="#0f766e"/><text x="80" y="198" text-anchor="middle" fill="#999" font-size="9">Mon</text><text x="155" y="198" text-anchor="middle" fill="#999" font-size="9">Tue</text><text x="230" y="198" text-anchor="middle" fill="#999" font-size="9">Wed</text><text x="305" y="198" text-anchor="middle" fill="#999" font-size="9">Thu</text><text x="380" y="198" text-anchor="middle" fill="#999" font-size="9">Fri</text><text x="455" y="198" text-anchor="middle" fill="#999" font-size="9">Sat</text><text x="530" y="198" text-anchor="middle" fill="#999" font-size="9">Sun</text></svg>

Your therapist (with your consent) can see these trends and adjust treatment accordingly. "I notice your mood dips every Wednesday — what happens on Wednesdays?" becomes a powerful session opener.

### 2. Conversational Homework

Instead of a blank worksheet, the companion guides you through a 7-day journey:

- **Day 1-2:** Anchor the key insight from your session before it fades
- **Day 3-5:** Explore how the insight applies in your daily life
- **Day 6-7:** Prepare for your next session with pre-session reflection

### 3. Voice Therapy Sessions

Sometimes you need to talk, not type. Modern AI companions offer real-time voice sessions where you can speak naturally and receive reflective, therapeutic responses. This is especially valuable:

- Late at night when typing feels too effortful
- During emotional moments when you need to process quickly
- For people who think better out loud
- When you want something closer to a real therapy conversation

### 4. Outcome Tracking (PHQ-9, GAD-7)

Clinical outcome measures like PHQ-9 (depression) and GAD-7 (anxiety) are the gold standard for tracking therapy progress. AI companions can administer these at regular intervals and show your therapist the trajectory.

<svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;margin:2rem auto;display:block"><text x="20" y="20" fill="#555" font-size="13" font-weight="600">PHQ-9 Score Over 12 Weeks</text><line x1="60" y1="35" x2="60" y2="170" stroke="#ddd" stroke-width="1"/><line x1="60" y1="170" x2="560" y2="170" stroke="#ddd" stroke-width="1"/><text x="50" y="50" text-anchor="end" fill="#e74c3c" font-size="9">Severe</text><text x="50" y="85" text-anchor="end" fill="#e67e22" font-size="9">Mod.</text><text x="50" y="125" text-anchor="end" fill="#f1c40f" font-size="9">Mild</text><text x="50" y="168" text-anchor="end" fill="#27ae60" font-size="9">Minimal</text><line x1="60" y1="55" x2="560" y2="55" stroke="#e74c3c" stroke-width="0.5" stroke-dasharray="4 4"/><line x1="60" y1="90" x2="560" y2="90" stroke="#e67e22" stroke-width="0.5" stroke-dasharray="4 4"/><line x1="60" y1="130" x2="560" y2="130" stroke="#f1c40f" stroke-width="0.5" stroke-dasharray="4 4"/><polyline points="100,52 185,60 270,78 355,100 440,125 525,148" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="52" r="4" fill="#0f766e"/><circle cx="185" cy="60" r="4" fill="#0f766e"/><circle cx="270" cy="78" r="4" fill="#0f766e"/><circle cx="355" cy="100" r="4" fill="#0f766e"/><circle cx="440" cy="125" r="4" fill="#0f766e"/><circle cx="525" cy="148" r="4" fill="#0f766e"/><text x="100" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 2</text><text x="185" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 4</text><text x="270" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 6</text><text x="355" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 8</text><text x="440" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 10</text><text x="525" y="188" text-anchor="middle" fill="#999" font-size="9">Wk 12</text></svg>

## What to Look For When Choosing an AI Therapy Companion

Not all AI therapy tools are equal. Here's a checklist:

### Safety & Ethics

- **Crisis detection** — Does it recognise risk language and escalate to helplines?
- **Not a replacement disclaimer** — Does it clearly state it's not therapy?
- **Clinical supervision** — Can a therapist oversee the AI's interactions?
- **Content safety filters** — Does it prevent harmful or inappropriate responses?

### Privacy & Data

- **GDPR compliance** — Essential for UK/EU users
- **Explicit consent** — Do you control what your therapist can see?
- **Data portability** — Can you export your data?
- **Right to deletion** — Can you delete everything?

### Clinical Quality

- **Evidence-based approaches** — CBT, ACT, motivational interviewing, not just generic chatting
- **Outcome measures** — PHQ-9, GAD-7, or equivalent validated instruments
- **Therapist integration** — Does it connect to your therapist's workflow?
- **Personalisation** — Does it adapt to your specific needs over time?

### Usability

- **Voice support** — Can you talk, not just type?
- **Offline access** — Does it work without internet for basic features?
- **Mobile-friendly** — Can you install it as an app?
- **Low friction** — Is daily check-in quick (under 30 seconds)?

## When AI Therapy Companions Help Most

Based on clinical feedback, AI companions are most valuable in these situations:

### 1. NHS Waiting Lists
The average 18-week wait means people are left unsupported at their most vulnerable. A companion provides structured support — not therapy, but better than nothing.

### 2. Between Weekly Sessions
The 167-hour gap between sessions is where insights fade and old patterns return. A companion keeps the therapeutic thread alive.

### 3. Homework Completion
When your therapist assigns a thought record or behavioural experiment, a companion turns it into an interactive conversation instead of a blank form.

### 4. Crisis Moments
At 2am when anxiety peaks, a companion provides grounding exercises, breathing techniques, and (when needed) direct links to crisis services like Samaritans (116 123) or SHOUT (text 85258).

### 5. Therapy Preparation
Before each session, a companion can help you prepare: "What do you most want to discuss today?" This makes sessions more productive.

## The Therapist's Perspective

We regularly hear from NHS psychotherapists and private practitioners about how AI companions change their practice:

> "My clients arrive already knowing what they want to work on. We waste less time warming up and go deeper, faster."

> "The mood tracking data is invaluable. I can see patterns my clients don't even notice — like their anxiety always spikes on Sundays."

> "Homework completion went from maybe 1 in 4 clients to nearly all of them. That alone is transformative."

## What AI Therapy Companions Cannot Do

It's equally important to be clear about limitations:

- **They cannot diagnose** mental health conditions
- **They cannot prescribe** medication or treatment plans
- **They cannot replace** a trained therapist's clinical judgment
- **They cannot handle** complex trauma without professional oversight
- **They are not appropriate** as the sole intervention for severe mental illness

AI companions are a support tool. They extend therapy, they don't replace it.

## How Sorca Fits In

Sorca was built specifically as a between-session therapy companion. Here's what sets it apart:

- **Voice-first** — Real-time voice sessions powered by ElevenLabs AI, so you can talk naturally
- **7 therapy modalities** — CBT, ACT, IFS, person-centred, motivational interviewing, psychodynamic, Socratic dialogue
- **Therapist dashboard** — Your therapist sees mood trends, homework progress, and risk flags (with your consent)
- **NHS-aligned** — UK crisis contacts built in, GDPR compliant, IAPT-compatible outcome measures
- **PWA installable** — Works offline for mood tracking and grounding exercises

<svg viewBox="0 0 700 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:600px;margin:2rem auto;display:block"><rect x="10" y="10" width="130" height="140" rx="14" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1.5"/><text x="75" y="55" text-anchor="middle" fill="#0f766e" font-size="22">\uD83C\uDFA4</text><text x="75" y="80" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="600">Voice</text><text x="75" y="95" text-anchor="middle" fill="#888" font-size="9">Talk naturally</text><text x="75" y="110" text-anchor="middle" fill="#888" font-size="9">any time</text><rect x="155" y="10" width="130" height="140" rx="14" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1.5"/><text x="220" y="55" text-anchor="middle" fill="#0f766e" font-size="22">\uD83D\uDCCB</text><text x="220" y="80" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="600">Homework</text><text x="220" y="95" text-anchor="middle" fill="#888" font-size="9">7-day journeys</text><text x="220" y="110" text-anchor="middle" fill="#888" font-size="9">75% completion</text><rect x="300" y="10" width="130" height="140" rx="14" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1.5"/><text x="365" y="55" text-anchor="middle" fill="#0f766e" font-size="22">\uD83D\uDCC8</text><text x="365" y="80" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="600">Tracking</text><text x="365" y="95" text-anchor="middle" fill="#888" font-size="9">PHQ-9 \u00B7 GAD-7</text><text x="365" y="110" text-anchor="middle" fill="#888" font-size="9">Mood trends</text><rect x="445" y="10" width="130" height="140" rx="14" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1.5"/><text x="510" y="55" text-anchor="middle" fill="#0f766e" font-size="22">\uD83D\uDC68\u200D\u2695\uFE0F</text><text x="510" y="80" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="600">Therapist</text><text x="510" y="95" text-anchor="middle" fill="#888" font-size="9">Dashboard</text><text x="510" y="110" text-anchor="middle" fill="#888" font-size="9">with consent</text></svg>

If you're currently in therapy, on a waiting list, or supporting your mental health independently, Sorca provides the structured, evidence-based support to help you make progress every day — not just one hour a week.

---

*Sorca is free to start. No credit card required. Visit [sorca.life](/) to begin.*
    `,
  },
  'why-questions-beat-answers': {
    slug: 'why-questions-beat-answers',
    title: 'Why Questions Are More Powerful Than Answers: The Science of Socratic Inquiry',
    excerpt: 'For 2,400 years, the Socratic method has been humanity\'s most powerful tool for self-discovery. Now AI is making it accessible to everyone.',
    date: '2026-03-01',
    readTime: '8 min read',
    category: 'Philosophy',
    content: `
## The Question That Changed Philosophy

In 399 BCE, Socrates was sentenced to death. His crime? Asking too many questions.

The Athenian court found him guilty of "corrupting the youth" — but what he was really doing was something far more dangerous to the status quo: he was teaching people to think for themselves by asking questions they couldn't easily answer.

Twenty-four centuries later, we're still grappling with the same truth Socrates discovered: **the right question is more powerful than any answer**.

## Why Questions Work Better Than Answers

When someone gives you an answer, your brain does something interesting: it evaluates. Is this true? Do I agree? Does this fit my existing beliefs?

But when someone asks you a question — a real question, not a rhetorical one — your brain does something entirely different: it searches. It goes looking for the answer. And in that search, it often finds things it wasn't expecting.

This is why therapy works. A good therapist rarely tells you what to do. Instead, they ask questions that help you discover what you already know but haven't yet admitted to yourself.

### The Neuroscience of Inquiry

Research from the University of California found that when people are asked questions, their brains show increased activity in the prefrontal cortex — the area responsible for self-reflection and decision-making. When they're given answers, this activity is significantly lower.

In other words: **questions make you think. Answers let you stop thinking.**

## The Problem With Modern AI

Most AI assistants are answer machines. You ask, they tell. They summarise, recommend, explain, and advise. Faster and faster, louder and louder.

But this creates a dependency. The more answers you receive, the less you trust your own judgment. The more you outsource your thinking, the weaker your thinking becomes.

What if AI could do the opposite? What if instead of giving you answers, it asked you questions so precise that you discovered the answers yourself?

## The Sorca Approach

This is exactly what Sorca does. It never answers. It never advises. It never reassures.

It only asks questions.

But not random questions. Not generic questions. Questions that are:

- **Surgical** — cutting to the exact thing you need to examine
- **Progressive** — starting surface-level and spiraling deeper
- **Connected** — building on everything you've said before

By the time you reach Depth 7, you're in territory you've never examined. By Depth 10, you're meeting parts of yourself you forgot existed.

## The Courage to Be Asked

There's a reason most people avoid deep questions. They're uncomfortable. They require you to sit with uncertainty. They force you to confront things you've been avoiding.

But this discomfort is where growth happens. As Socrates himself said: "The unexamined life is not worth living."

The question is: are you brave enough to be asked?

---

*Sorca is a Socratic AI that responds only with questions. Try your first session free at [sorca.life](/).*
    `,
  },
  'therapy-homework-completion-ai': {
    slug: 'therapy-homework-completion-ai',
    title: 'How AI is Transforming Therapy Homework: From 20% to 75% Completion',
    excerpt: 'Traditional therapy worksheets have a completion rate of just 20-30%. Conversational AI companions are changing that dramatically.',
    date: '2026-02-15',
    readTime: '6 min read',
    category: 'Research',
    content: `
## The Homework Problem

Here's a statistic that surprises most people: **only 20-30% of therapy homework gets completed**.

Think about that. Your therapist gives you an exercise — maybe a thought record, a behavioural experiment, or a journaling prompt. You nod, you agree it's important, you fully intend to do it.

And then... you don't.

This isn't a character flaw. It's a design problem.

## Why Traditional Homework Fails

Traditional therapy homework has several structural issues:

### 1. The Blank Page Problem
A worksheet with empty boxes is intimidating. Where do you start? What if you do it wrong? The friction of beginning is often enough to prevent beginning at all.

### 2. The Timing Problem
Your therapist gives you homework on Tuesday at 3pm. But your anxiety peaks on Thursday at 11pm. By then, the worksheet is buried in your bag, and you're not in the headspace to dig it out.

### 3. The Isolation Problem
Filling out a form alone feels clinical. There's no warmth, no responsiveness, no sense that anyone is listening.

### 4. The Relevance Problem
Generic worksheets can't adapt to your specific situation. They ask the same questions regardless of what you're actually struggling with that day.

## The Conversational Solution

What if homework felt less like a form and more like a conversation?

This is the insight behind AI-assisted therapy support. Instead of a static worksheet, you have a responsive companion that:

- **Meets you when you need it** — at 11pm on Thursday, not just Tuesday at 3pm
- **Starts the conversation** — no blank page, just a gentle question
- **Adapts to your responses** — following your thread, not a script
- **Remembers your context** — building on previous sessions

## The Numbers

Early research on conversational AI therapy companions shows remarkable results:

- **75% homework completion rate** (vs 20-30% with worksheets)
- **3x more engagement** between sessions
- **Higher session preparedness** — patients arrive with clearer insights

## How Sorca Approaches Homework

Sorca converts therapy homework into a 7-day conversational journey. Instead of a single worksheet, you get:

**Day 1-2: Anchoring**
Within 24 hours of your session, Sorca helps you anchor the key insight before it fades.

**Day 3-5: Exploration**
Daily check-ins that explore how the insight applies to your real life.

**Day 6-7: Preparation**
Pre-session questions that help you arrive at your next appointment ready to go deeper.

The result? Patients who actually do the work. Therapists who see faster progress. And a bridge across those 167 hours between sessions.

## The Therapist's Perspective

We've heard from NHS psychotherapists, private practitioners, and executive coaches. The feedback is consistent:

> "My clients come to sessions already excavated. We can go deeper, faster."
> — Dr. Priya Khatri, Psychotherapist

> "The homework completion rate alone has transformed my practice."
> — Clinical Psychologist, London

## The Future of Between-Session Support

Therapy has always been limited by time. One hour per week. Maybe two if you're lucky.

But the real work of change happens in the other 167 hours. In the moments of anxiety, the late-night spirals, the daily decisions that shape who you're becoming.

AI companions like Sorca don't replace therapy. They extend it. They fill the gap. They make sure the insights from your session don't fade before you can act on them.

---

*Sorca is used by therapists across the UK to support their clients between sessions. Learn more at [sorca.life/for-therapists](/for-therapists).*
    `,
  },
  'the-167-hours-between-sessions': {
    slug: 'the-167-hours-between-sessions',
    title: 'The Gap Between Sessions: Why the 167 Hours Matter Most',
    excerpt: 'Your therapy session is 1 hour per week. That leaves 167 hours where the real work happens — or doesn\'t.',
    date: '2026-02-01',
    readTime: '5 min read',
    category: 'Therapy',
    content: `
## The Math of Therapy

Let's do some simple arithmetic.

There are 168 hours in a week. If you're in weekly therapy, you spend 1 of those hours with your therapist.

That leaves **167 hours** where you're on your own.

167 hours where insights can fade. Where old patterns can reassert themselves. Where the clarity you felt in session can dissolve into the noise of daily life.

This is the gap. And it's where therapy succeeds or fails.

## What Happens in the Gap

In those 167 hours, several things compete for your attention:

**The Forgetting Curve**
Research shows we forget 50% of new information within an hour, and 70% within 24 hours. Your therapy insights are no exception.

**The Pull of Patterns**
Your existing thought patterns have years of momentum. They don't disappear because you had one good conversation. They reassert themselves the moment you're stressed, tired, or triggered.

**The Noise of Life**
Work deadlines. Family obligations. Social media. Netflix. A thousand things that feel more urgent than sitting with an uncomfortable truth.

## The Traditional Solutions

Therapists have always known about the gap. That's why they assign homework:

- Thought records
- Behavioural experiments
- Journaling prompts
- Mindfulness exercises

But as we've discussed, completion rates hover around 20-30%. The gap remains.

## A Different Approach

What if the gap wasn't empty? What if, instead of waiting a week to continue the conversation, you could continue it whenever you needed to?

Not with your therapist — they have other patients, other responsibilities, a life outside of your sessions.

But with something that:

- Is available at 2am when you can't sleep
- Remembers what you talked about last session
- Asks the questions your therapist would ask
- Never judges, never rushes, never gets tired

## The 167-Hour Companion

This is what Sorca was built for. Not to replace your therapist, but to fill the gap between sessions.

**Within 24 hours of your session:**
Sorca helps you anchor the key insight before it fades. One focused question that captures what matters.

**Throughout the week:**
Daily check-ins that keep the thread alive. Not homework — conversation. Not forms — questions.

**Before your next session:**
A pre-session primer that helps you arrive prepared. "What do you most want to say today?"

## The Compound Effect

Here's what happens when you fill the gap:

**Week 1:** You remember more from your session. You notice patterns in real-time.

**Week 4:** Your therapist notices you're arriving more prepared. Sessions go deeper.

**Week 12:** The insights aren't just intellectual anymore. They're becoming automatic. You're changing.

This is the compound effect of consistent reflection. It's not magic. It's just what happens when you don't let 167 hours go to waste.

## Making the Hours Count

You don't need an AI companion to fill the gap. You could:

- Set daily reminders to reflect
- Keep a voice memo journal
- Text a trusted friend your insights
- Write morning pages

The method matters less than the consistency. The gap will always be there. The question is whether you fill it or let it fill itself.

But if you want a companion that asks the questions you've been avoiding, that remembers everything you've said, that meets you at 2am when you need it most — that's what Sorca is for.

---

*Sorca fills the 167 hours between therapy sessions. Try it free at [sorca.life](/).*
    `,
  },
  'how-between-session-practice-improves-therapy-outcomes': {
    slug: 'how-between-session-practice-improves-therapy-outcomes',
    title: 'How Between-Session Practice Improves Therapy Outcomes: A Complete Guide',
    excerpt: 'What happens between your weekly therapy sessions matters more than the session itself. Here\'s the evidence behind between-session practice and how to make it work for you.',
    date: '2026-03-09',
    readTime: '10 min read',
    category: 'Evidence',
    content: `
## The Therapy Paradox

Here's an uncomfortable truth about therapy: the one hour you spend with your therapist each week accounts for just **0.6% of your waking time**. The other 99.4% — that's where real change either happens or doesn't.

<svg viewBox="0 0 700 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:600px;margin:2rem auto;display:block"><rect x="10" y="10" width="680" height="200" rx="16" fill="#f5f0e8" stroke="#0f766e" stroke-width="1.5"/><text x="350" y="40" text-anchor="middle" fill="#0e0c09" font-size="14" font-weight="600">Your Weekly Time Breakdown</text><rect x="40" y="65" width="4" height="120" rx="2" fill="#0f766e"/><text x="55" y="130" fill="#0f766e" font-size="11" font-weight="600">Therapy (1hr)</text><rect x="200" y="65" width="460" height="120" rx="8" fill="#0f766e" opacity="0.12" stroke="#0f766e" stroke-width="1"/><text x="430" y="115" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">167 Hours Between Sessions</text><text x="430" y="140" text-anchor="middle" fill="#3d3830" font-size="12">This is where the real work happens</text><text x="350" y="205" text-anchor="middle" fill="#635a4c" font-size="10">Based on standard weekly 50-minute therapy session</text></svg>

Research consistently shows that clients who engage in structured between-session activities achieve **better outcomes, faster recovery, and more lasting change** than those who only show up to appointments.

## What the Evidence Says

### Homework Completion Predicts Outcomes

A landmark meta-analysis by Kazantzis et al. (2016) covering **53 studies and 2,183 participants** found that therapy homework completion was significantly associated with better treatment outcomes across multiple conditions — anxiety, depression, PTSD, and OCD.

The effect was robust: clients who completed homework showed a **d = 0.48** advantage over those who didn't, which in clinical terms means meaningful, measurable improvement.

### The 75% Revolution

Traditional paper worksheets have a completion rate of just 20-30%. This isn't because clients are lazy — it's because **static forms don't match how humans process emotions**.

<svg viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;margin:2rem auto;display:block"><text x="300" y="30" text-anchor="middle" fill="#0e0c09" font-size="14" font-weight="600">Homework Completion: Traditional vs AI-Assisted</text><rect x="80" y="60" width="180" height="160" rx="12" fill="#f5f0e8" stroke="#c5bba8" stroke-width="1.5"/><text x="170" y="100" text-anchor="middle" fill="#635a4c" font-size="11">Traditional Worksheets</text><rect x="120" y="110" width="100" height="90" rx="6" fill="#c5bba8" opacity="0.5"/><rect x="120" y="168" width="100" height="32" rx="6" fill="#0f766e" opacity="0.3"/><text x="170" y="188" text-anchor="middle" fill="#0f766e" font-size="14" font-weight="700">20-30%</text><rect x="340" y="60" width="180" height="160" rx="12" fill="#0f766e" opacity="0.06" stroke="#0f766e" stroke-width="1.5"/><text x="430" y="100" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="500">AI Companion</text><rect x="380" y="110" width="100" height="90" rx="6" fill="#0f766e" opacity="0.15"/><rect x="380" y="110" width="100" height="68" rx="6" fill="#0f766e" opacity="0.6"/><text x="430" y="150" text-anchor="middle" fill="white" font-size="14" font-weight="700">75%</text><text x="300" y="260" text-anchor="middle" fill="#635a4c" font-size="10">Source: Habicht et al., JMIR, 2025 — 244 NHS patients in group CBT</text></svg>

When homework becomes a **conversation** instead of a form — when an AI companion asks you about your day and gently guides you toward the exercise your therapist assigned — completion jumps to 75%.

### Session Preparedness

Therapists consistently report that clients using between-session tools arrive **better prepared**:

- They know what they want to discuss
- They've tracked their mood and can identify patterns
- They've attempted their homework and have specific questions
- They've had insights they want to explore deeper

This means sessions go deeper, faster. Less time warming up. More time doing meaningful therapeutic work.

## The Five Pillars of Effective Between-Session Practice

Based on clinical research and feedback from hundreds of therapists, here are the five most impactful between-session activities:

### 1. Daily Mood Tracking

Simple but powerful. Rating your mood on a 1-10 scale each day, with optional notes about what happened, creates a data trail that reveals patterns invisible to the naked eye.

<svg viewBox="0 0 700 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:600px;margin:2rem auto;display:block"><text x="350" y="25" text-anchor="middle" fill="#0e0c09" font-size="13" font-weight="600">Mood Patterns Over 4 Weeks</text><line x1="60" y1="40" x2="60" y2="155" stroke="#c5bba8" stroke-width="1"/><line x1="60" y1="155" x2="660" y2="155" stroke="#c5bba8" stroke-width="1"/><text x="50" y="55" text-anchor="end" fill="#635a4c" font-size="9">😊</text><text x="50" y="100" text-anchor="end" fill="#635a4c" font-size="9">😐</text><text x="50" y="150" text-anchor="end" fill="#635a4c" font-size="9">😞</text><polyline points="80,120 100,105 120,115 140,95 160,100 180,85 200,90 220,80 240,95 260,75 280,85 300,70 320,80 340,65 360,75 380,60 400,70 420,55 440,65 460,58 480,50 500,60 520,48 540,55 560,45 580,52 600,42 620,48 640,40" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/><rect x="80" y="162" width="140" height="12" rx="2" fill="#0f766e" opacity="0.1"/><text x="150" y="171" text-anchor="middle" fill="#635a4c" font-size="8">Week 1</text><rect x="220" y="162" width="140" height="12" rx="2" fill="#0f766e" opacity="0.15"/><text x="290" y="171" text-anchor="middle" fill="#635a4c" font-size="8">Week 2</text><rect x="360" y="162" width="140" height="12" rx="2" fill="#0f766e" opacity="0.2"/><text x="430" y="171" text-anchor="middle" fill="#635a4c" font-size="8">Week 3</text><rect x="500" y="162" width="140" height="12" rx="2" fill="#0f766e" opacity="0.25"/><text x="570" y="171" text-anchor="middle" fill="#635a4c" font-size="8">Week 4</text></svg>

"I notice my mood always drops on Sundays" becomes a therapeutic goldmine. Your therapist can see this pattern too (with consent) and open your next session with: "Let's talk about Sundays."

### 2. Therapy Homework Through Conversation

Instead of blank CBT thought records, effective between-session tools guide you through the exercise:

- **Day 1-2:** Anchor the key insight from your session before it fades
- **Day 3-4:** Apply the insight to a real situation in your life
- **Day 5-6:** Notice what changed and what resisted
- **Day 7:** Reflect and prepare for your next session

This conversational approach works because it **meets you where you are** — no clinical language, no blank forms, just guided reflection.

### 3. Voice Processing

Sometimes you need to talk, not type. Voice sessions are especially valuable:

- At 2am when anxiety peaks and typing feels impossible
- During emotional moments when speed matters
- For people who think out loud (most humans do)
- When you want something closer to a real therapy conversation

### 4. Grounding & Coping Exercises

Between sessions, anxiety doesn't wait for office hours. Having instant access to grounding techniques — box breathing, 5-4-3-2-1 sensory exercises, progressive muscle relaxation — can prevent a difficult moment from becoming a crisis.

### 5. Outcome Measure Tracking

Regular PHQ-9 (depression) and GAD-7 (anxiety) assessments create an objective record of your progress. This matters because:

- Therapy can feel like it's "not working" even when scores improve
- Your therapist can adjust treatment based on objective data
- You get proof that change is happening, even when it feels invisible

## Common Barriers (And How to Overcome Them)

### "I forget to do my homework"

This is the #1 barrier. Solutions: daily push notifications at a consistent time, voice-based check-ins that take under 30 seconds, and streaks that motivate consistency.

### "I don't know what to write"

Paper worksheets assume you know how to structure your thoughts. Conversational AI companions guide you with questions: "What was the strongest emotion you felt today?" is easier to answer than a blank "Thought Record" form.

### "I feel fine between sessions — it's only bad during the session"

This is actually a sign that between-session work is needed most. The session creates a safe space for difficult emotions. Between-session tools help you process those emotions in the days that follow, preventing emotional whiplash.

### "My therapist didn't assign homework"

Not all therapists use formal homework. But the principles still apply: reflecting on your session insights, tracking your mood, and noticing patterns are all forms of between-session practice that enhance any therapeutic approach.

## The Role of AI in Between-Session Support

AI therapy companions like Sorca are designed specifically for this gap. They offer:

- **24/7 availability** — because difficult moments don't keep office hours
- **Voice-first interaction** — talk naturally, no typing required
- **Therapist integration** — your therapist sees your progress (with consent)
- **Evidence-based frameworks** — CBT, ACT, motivational interviewing, not just generic chat
- **Clinical outcome tracking** — PHQ-9, GAD-7, and validated measures
- **Safety protocols** — crisis detection, grounding exercises, helpline signposting

<svg viewBox="0 0 700 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:600px;margin:2rem auto;display:block"><rect x="10" y="10" width="680" height="180" rx="16" fill="#0f766e" opacity="0.04" stroke="#0f766e" stroke-width="1.5"/><text x="350" y="45" text-anchor="middle" fill="#0f766e" font-size="14" font-weight="600">The Between-Session Support Cycle</text><circle cx="120" cy="120" r="40" fill="#0f766e" opacity="0.1" stroke="#0f766e" stroke-width="1.5"/><text x="120" y="115" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Therapy</text><text x="120" y="130" text-anchor="middle" fill="#635a4c" font-size="9">Session</text><circle cx="300" cy="120" r="40" fill="#0f766e" opacity="0.15" stroke="#0f766e" stroke-width="1.5"/><text x="300" y="115" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Practice</text><text x="300" y="130" text-anchor="middle" fill="#635a4c" font-size="9">& Reflection</text><circle cx="480" cy="120" r="40" fill="#0f766e" opacity="0.2" stroke="#0f766e" stroke-width="1.5"/><text x="480" y="115" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Progress</text><text x="480" y="130" text-anchor="middle" fill="#635a4c" font-size="9">& Insight</text><line x1="162" y1="120" x2="258" y2="120" stroke="#0f766e" stroke-width="1.5" marker-end="url(#arrow)"/><line x1="342" y1="120" x2="438" y2="120" stroke="#0f766e" stroke-width="1.5" marker-end="url(#arrow)"/><path d="M520 100 C580 60, 640 80, 640 120 C640 160, 580 180, 520 140" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3" fill="none"/><text x="610" y="120" text-anchor="middle" fill="#635a4c" font-size="8">Repeat</text><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e"/></marker></defs></svg>

The key insight: AI companions don't replace therapy. They **amplify** it. They ensure that the insights, exercises, and progress from your sessions don't evaporate in the 167 hours between appointments.

## Getting Started With Between-Session Practice

You don't need an AI companion to start between-session practice (though it helps). Here are three things you can do today:

- **Set a daily mood check-in alarm** — Rate 1-10, add one sentence about why
- **Review your session notes** within 24 hours — Write down the single most important thing discussed
- **Do one grounding exercise** when you notice stress rising — Box breathing (4 in, 4 hold, 4 out, 4 hold)

The research is clear: what you do between sessions determines how much therapy helps. Start small, stay consistent, and watch the evidence of your own progress accumulate.

---

*Sorca is an AI therapy companion that supports your mental health between sessions. Voice sessions, CBT homework, mood tracking — all supervised by your therapist. Try it free at [sorca.life](/).*
    `,
  },
  '5-ways-to-get-most-from-therapy': {
    slug: '5-ways-to-get-most-from-therapy',
    title: '5 Evidence-Based Ways to Get the Most From Your Therapy Sessions',
    excerpt: 'Therapy is an investment in yourself. These five proven strategies will help you make every session count and accelerate your progress.',
    date: '2026-03-09',
    readTime: '8 min read',
    category: 'Guide',
    content: `
## Why How You Do Therapy Matters as Much as Whether You Do It

Research consistently shows that **client engagement** is one of the strongest predictors of therapy outcomes. It's not just about showing up — it's about what you do between sessions, how prepared you are, and whether you actively participate in your own healing.

<svg viewBox="0 0 700 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:600px;margin:2rem auto;display:block"><rect x="20" y="20" width="660" height="140" rx="12" fill="#f0fdfa" stroke="#0f766e" stroke-width="1" opacity="0.5"/><text x="350" y="50" text-anchor="middle" fill="#0f766e" font-size="14" font-weight="600">The 5 Pillars of Effective Therapy</text><g transform="translate(60,70)"><circle cx="0" cy="30" r="22" fill="#0f766e" opacity="0.15"/><text x="0" y="35" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Prep</text></g><g transform="translate(200,70)"><circle cx="0" cy="30" r="22" fill="#0f766e" opacity="0.2"/><text x="0" y="35" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Track</text></g><g transform="translate(340,70)"><circle cx="0" cy="30" r="22" fill="#0f766e" opacity="0.25"/><text x="0" y="35" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Do</text></g><g transform="translate(480,70)"><circle cx="0" cy="30" r="22" fill="#0f766e" opacity="0.3"/><text x="0" y="35" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Reflect</text></g><g transform="translate(620,70)"><circle cx="0" cy="30" r="22" fill="#0f766e" opacity="0.35"/><text x="0" y="35" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">Review</text></g><line x1="82" y1="100" x2="178" y2="100" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/><line x1="222" y1="100" x2="318" y2="100" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/><line x1="362" y1="100" x2="458" y2="100" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/><line x1="502" y1="100" x2="598" y2="100" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/></svg>

Here are five strategies backed by research to help you get the absolute most from your therapy.

## 1. Prepare Before Each Session

Don't walk in cold. Spend 10-15 minutes before your appointment reflecting on what you want to discuss. Ask yourself:

- What's been on my mind most this week?
- What do I most want my therapist to know?
- What am I avoiding talking about?

A 2023 study in *Psychotherapy Research* found that clients who prepare for sessions report **higher satisfaction** and make **faster progress** toward their goals.

> "The best sessions are the ones where the client walks in already knowing what they need to say." — Dr Priya Khatri, NHS Psychotherapist

### How Sorca Helps

Sorca sends a **Pre-Session Primer** one hour before your therapy appointment: *"What do you most want to say today?"* Your response is saved so you can reference it in session.

## 2. Track Your Mood Daily

Mood tracking creates a data trail that makes invisible patterns visible. When you log your mood every day (even just a 1-10 rating), you start to see:

- Which days are consistently harder
- What activities lift or lower your mood
- Whether treatment is actually working over time

<svg viewBox="0 0 600 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;margin:2rem auto;display:block"><text x="20" y="20" fill="#555" font-size="12" font-weight="600">Mood Over 2 Weeks</text><line x1="50" y1="35" x2="50" y2="150" stroke="#ddd" stroke-width="1"/><line x1="50" y1="150" x2="570" y2="150" stroke="#ddd" stroke-width="1"/><polyline points="80,120 120,100 160,130 200,90 240,85 280,95 320,80 360,70 400,90 440,65 480,60 520,55 560,50" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/><rect x="350" y="40" width="200" height="25" rx="4" fill="#0f766e" opacity="0.08"/><text x="450" y="57" text-anchor="middle" fill="#0f766e" font-size="10">↑ Upward trend = progress</text></svg>

Your therapist can use your mood data to adjust treatment. Instead of relying on how you feel in that one hour, they see the full picture.

### How Sorca Helps

Sorca sends a **daily check-in** at 9am. Rate your mood, log a short note, and optionally start a voice session. Your therapist sees your trends (with your consent) through their dashboard.

## 3. Complete Your Therapy Homework

This is the single most impactful thing you can do. Research is unambiguous: **clients who complete between-session tasks have significantly better outcomes**.

The problem? Traditional worksheets have a **20-30% completion rate**. They sit in your bag, forgotten.

The solution is to make homework conversational and daily. Instead of one big task, break it into small daily check-ins that feel more like journaling than homework.

<svg viewBox="0 0 500 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;margin:2rem auto;display:block"><rect width="500" height="120" rx="10" fill="#f0fdfa"/><rect x="30" y="20" width="60" height="80" rx="6" fill="#d1d5db"/><rect x="30" y="60" width="60" height="40" rx="6" fill="#0f766e" opacity="0.3"/><text x="60" y="85" text-anchor="middle" fill="#0f766e" font-size="12" font-weight="700">25%</text><text x="60" y="15" fill="#666" font-size="8" text-anchor="middle">Worksheets</text><rect x="220" y="20" width="60" height="80" rx="6" fill="#0f766e" opacity="0.1"/><rect x="220" y="20" width="60" height="60" rx="6" fill="#0f766e" opacity="0.5"/><text x="250" y="55" text-anchor="middle" fill="white" font-size="12" font-weight="700">75%</text><text x="250" y="15" fill="#0f766e" font-size="8" text-anchor="middle" font-weight="500">AI-Assisted</text><text x="400" y="55" fill="#0f766e" font-size="28" font-weight="700">3×</text><text x="400" y="75" fill="#115e59" font-size="10" text-anchor="middle">improvement</text></svg>

### How Sorca Helps

Your therapist sets homework through their dashboard. Sorca converts it into a **7-day conversational journey** — small daily check-ins that achieve a **75% completion rate** (Habicht et al., JMIR, 2025).

## 4. Practise Between Sessions

Therapy is one hour a week. The other **167 hours** are where the real change happens. Use that time to:

- **Practice coping skills** you've learned (breathing techniques, grounding exercises, thought challenging)
- **Journal** about insights from your session before they fade
- **Apply new perspectives** in real situations and note what happens
- **Talk through difficult feelings** using voice sessions when you need support

The key insight: therapy teaches you skills, but **practice is where skills become habits**.

### How Sorca Helps

Sorca offers **24/7 voice and text sessions** where you can practice therapeutic techniques, process difficult moments, and anchor insights from therapy. Every conversation is transcribed and available to review.

## 5. Review Your Progress Regularly

It's hard to see change when you're living it day by day. Regularly reviewing your progress helps you:

- Recognise how far you've come
- Stay motivated during difficult stretches
- Identify what's working and what needs adjusting
- Have informed conversations with your therapist about treatment direction

Clinical outcome measures like **PHQ-9** (depression) and **GAD-7** (anxiety) provide objective data points that track your trajectory over weeks and months.

### How Sorca Helps

Sorca administers validated outcome measures at regular intervals and shows you clear trend lines. Your therapist also receives these through their dashboard, enabling **data-driven treatment decisions**.

---

## The Bottom Line

Getting the most from therapy isn't passive — it's an active practice. When you prepare, track, complete homework, practise between sessions, and review your progress, you're not just attending therapy — you're **doing** therapy.

The research is clear: engaged clients get better, faster.

> "The therapy hour is the spark. What you do with the other 167 hours determines whether it catches fire." — Sorca Blog

If you're looking for a tool that supports all five of these strategies, [try Sorca free](/) — it's designed to make every hour between sessions count.
`,
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];
  
  if (!post) {
    return {
      title: 'Post Not Found | SORCA Blog',
    };
  }

  return {
    title: `${post.title} | SORCA Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: [{ url: '/hero-image.png?v=3', width: 1200, height: 630, alt: 'SORCA — AI Therapy Companion' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['/hero-image.png?v=3'],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(BLOG_POSTS).map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase hover:text-gold-bright transition-colors">
          Sorca
        </Link>
        <Link 
          href="/blog"
          className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
        >
          ← All Posts
        </Link>
      </header>

      <article className="w-full max-w-3xl mx-auto px-6 py-12">
        {/* Post Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="font-courier text-[10px] text-gold tracking-widest uppercase border border-gold/30 px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
              {formatDate(post.date)}
            </span>
            <span className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
              {post.readTime}
            </span>
          </div>

          <h1 className="font-cinzel text-3xl md:text-4xl lg:text-5xl text-text-main mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="font-cormorant text-xl text-text-mid leading-relaxed">
            {post.excerpt}
          </p>
        </header>

        {/* Post Content */}
        <div className="prose prose-lg prose-sorca max-w-none">
          <div 
            className="font-cormorant text-text-mid leading-relaxed space-y-6
              [&>h2]:font-cinzel [&>h2]:text-2xl [&>h2]:text-text-main [&>h2]:mt-12 [&>h2]:mb-6
              [&>h3]:font-cinzel [&>h3]:text-lg [&>h3]:text-gold [&>h3]:mt-8 [&>h3]:mb-4
              [&>p]:text-lg
              [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2
              [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2
              [&>blockquote]:border-l-2 [&>blockquote]:border-gold [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-text-mid
              [&>hr]:border-border [&>hr]:my-12
              [&_strong]:text-text-main [&_strong]:font-semibold
              [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-gold-bright"
            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
          />
        </div>

        {/* Post Footer */}
        <footer className="mt-16 pt-12 border-t border-border">
          <div className="bg-raised border border-gold/20 rounded-xl p-8 text-center">
            <h3 className="font-cinzel text-xl text-gold mb-4">
              Support Your Mental Health Between Sessions
            </h3>
            <p className="font-cormorant text-text-mid mb-6 max-w-md mx-auto">
              Sorca is an AI therapy companion with voice sessions, CBT homework tracking, and mood monitoring — supervised by your therapist.
            </p>
            <Link 
              href="/"
              className="inline-block px-8 py-3 bg-gold text-void font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-gold-bright transition-colors"
            >
              Try Sorca Free
            </Link>
          </div>
        </footer>
      </article>

      {/* Site Footer */}
      <footer className="w-full max-w-3xl mx-auto px-6 py-12 border-t border-border mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase">
            Sorca
          </Link>
          <p className="font-courier text-[10px] text-text-muted tracking-widest">
            © 2026 Sorca. AI therapy companion.
          </p>
        </div>
      </footer>
    </main>
  );
}

function formatContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isListItem = trimmed.startsWith('- ');

    // Pass SVG/HTML tags through directly
    if (trimmed.startsWith('<svg') || trimmed.startsWith('</svg') || trimmed.includes('</svg>') || trimmed.startsWith('<rect') || trimmed.startsWith('<text') || trimmed.startsWith('<line') || trimmed.startsWith('<circle') || trimmed.startsWith('<polyline') || trimmed.startsWith('<path')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(trimmed);
      continue;
    }

    if (isListItem && !inList) {
      result.push('<ul>');
      inList = true;
    } else if (!isListItem && inList) {
      result.push('</ul>');
      inList = false;
    }

    if (trimmed.startsWith('## ')) {
      result.push(`<h2>${trimmed.slice(3)}</h2>`);
    } else if (trimmed.startsWith('### ')) {
      result.push(`<h3>${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith('> ')) {
      result.push(`<blockquote>${trimmed.slice(2)}</blockquote>`);
    } else if (trimmed.startsWith('- **')) {
      const match = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/);
      if (match) {
        result.push(`<li><strong>${match[1]}</strong>${match[2]}</li>`);
      } else {
        result.push(`<li>${trimmed.slice(2)}</li>`);
      }
    } else if (trimmed.startsWith('- ')) {
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else if (trimmed === '---') {
      result.push('<hr />');
    } else if (trimmed === '') {
      result.push('');
    } else {
      let processed = trimmed
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      result.push(`<p>${processed}</p>`);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}
