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
      images: [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'SORCA — The AI That Only Asks Questions' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['/hero-image.png'],
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
              Ready to Ask Yourself the Hard Questions?
            </h3>
            <p className="font-cormorant text-text-mid mb-6 max-w-md mx-auto">
              Sorca is a Socratic AI that responds only with questions. No answers. No advice. Just the questions you&apos;ve been avoiding.
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
            © 2026 Sorca. The AI that only asks questions.
          </p>
        </div>
      </footer>
    </main>
  );
}

function formatContent(content: string): string {
  return content
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        return `<h2>${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3>${trimmed.slice(4)}</h3>`;
      }
      if (trimmed.startsWith('> ')) {
        return `<blockquote>${trimmed.slice(2)}</blockquote>`;
      }
      if (trimmed.startsWith('- **')) {
        const match = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/);
        if (match) {
          return `<li><strong>${match[1]}</strong>${match[2]}</li>`;
        }
      }
      if (trimmed.startsWith('- ')) {
        return `<li>${trimmed.slice(2)}</li>`;
      }
      if (trimmed === '---') {
        return '<hr />';
      }
      if (trimmed === '') {
        return '';
      }
      // Handle bold and italic
      let processed = trimmed
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      return `<p>${processed}</p>`;
    })
    .join('\n');
}
