import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Therapy & Mental Health Blog | SORCA',
  description: 'Evidence-based insights on AI therapy support, between-session mental health strategies, CBT homework techniques, voice therapy, and tools for therapists and clients. Expert guidance from UK mental health professionals.',
  keywords: [
    'AI therapy blog',
    'mental health between sessions',
    'CBT homework tips',
    'therapy companion app blog',
    'voice therapy sessions',
    'therapy homework completion',
    'anxiety self-help strategies',
    'therapist technology tools',
    'mood tracking for therapy',
    'digital mental health UK',
    'therapy blog UK',
    'mental health articles',
    'CBT techniques blog',
    'therapy homework strategies',
    'between session therapy support',
    'AI mental health blog',
    'therapy progress tips',
    'mental health self-help UK',
    'therapy waiting list support',
    'evidence based therapy blog',
  ],
  openGraph: {
    title: 'Therapy & Mental Health Blog | SORCA',
    description: 'Evidence-based insights on AI therapy support, between-session strategies, and tools for therapists and clients.',
    url: '/blog',
    type: 'website',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
  /** SVG illustration thumbnail */
  illustration: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-between-session-practice-improves-therapy-outcomes',
    title: 'How Between-Session Practice Improves Therapy Outcomes: A Complete Guide',
    excerpt: 'What happens between your weekly therapy sessions matters more than the session itself. Here\'s the evidence behind between-session practice and how to make it work for you.',
    date: '2026-03-09',
    readTime: '10 min read',
    category: 'Evidence',
    featured: true,
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#f0fdfa"/><circle cx="80" cy="100" r="35" fill="#0f766e" opacity="0.15" stroke="#0f766e" stroke-width="1.5"/><text x="80" y="95" text-anchor="middle" fill="#0f766e" font-size="9" font-weight="600">Therapy</text><text x="80" y="108" text-anchor="middle" fill="#115e59" font-size="8">1 hour</text><rect x="140" y="70" width="220" height="60" rx="8" fill="#0f766e" opacity="0.08" stroke="#0f766e" stroke-width="1" stroke-dasharray="4 3"/><text x="250" y="95" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="600">167 Hours</text><text x="250" y="112" text-anchor="middle" fill="#115e59" font-size="9">Between Sessions</text><polyline points="150,150 180,140 210,145 240,130 270,135 300,120 330,125 360,115" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" opacity="0.6"/><circle cx="360" cy="115" r="4" fill="#0f766e"/><text x="200" y="180" text-anchor="middle" fill="#115e59" font-size="8">Evidence-based between-session support</text></svg>`,
  },
  {
    slug: '5-ways-to-get-most-from-therapy',
    title: '5 Evidence-Based Ways to Get the Most From Your Therapy Sessions',
    excerpt: 'Therapy is an investment in yourself. These five proven strategies — from homework completion to mood tracking — will help you make every session count and accelerate your progress.',
    date: '2026-03-09',
    readTime: '8 min read',
    category: 'Guide',
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#f0fdfa"/><g transform="translate(30,25)"><rect x="0" y="10" width="28" height="28" rx="6" fill="#0f766e" opacity="0.2"/><text x="14" y="30" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">1</text><text x="40" y="28" fill="#115e59" font-size="10">Prepare before sessions</text></g><g transform="translate(30,60)"><rect x="0" y="10" width="28" height="28" rx="6" fill="#0f766e" opacity="0.25"/><text x="14" y="30" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">2</text><text x="40" y="28" fill="#115e59" font-size="10">Track your mood daily</text></g><g transform="translate(30,95)"><rect x="0" y="10" width="28" height="28" rx="6" fill="#0f766e" opacity="0.3"/><text x="14" y="30" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">3</text><text x="40" y="28" fill="#115e59" font-size="10">Complete homework exercises</text></g><g transform="translate(30,130)"><rect x="0" y="10" width="28" height="28" rx="6" fill="#0f766e" opacity="0.35"/><text x="14" y="30" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">4</text><text x="40" y="28" fill="#115e59" font-size="10">Practice between sessions</text></g><g transform="translate(30,165)"><rect x="0" y="10" width="28" height="28" rx="6" fill="#0f766e" opacity="0.4"/><text x="14" y="30" text-anchor="middle" fill="#0f766e" font-size="16" font-weight="700">5</text><text x="40" y="28" fill="#115e59" font-size="10">Review your progress regularly</text></g><g transform="translate(240,30)"><circle cx="70" cy="70" r="60" fill="none" stroke="#0f766e" stroke-width="2" opacity="0.15"/><circle cx="70" cy="70" r="45" fill="none" stroke="#0f766e" stroke-width="2" opacity="0.2"/><circle cx="70" cy="70" r="30" fill="none" stroke="#0f766e" stroke-width="2" opacity="0.3"/><circle cx="70" cy="70" r="15" fill="#0f766e" opacity="0.15"/><text x="70" y="75" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">You</text></g></svg>`,
  },
  {
    slug: 'ai-therapy-companion-guide-2026',
    title: 'AI Therapy Companions: How They Work, When They Help, and What to Look For in 2026',
    excerpt: 'A comprehensive guide to AI-assisted therapy tools — what the research says, how they integrate with your therapist, and how to choose one that actually helps your mental health.',
    date: '2026-03-08',
    readTime: '12 min read',
    category: 'Guide',
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#f0fdf4"/><circle cx="120" cy="90" r="30" fill="#2a6b6b" opacity="0.12" stroke="#2a6b6b" stroke-width="1.5"/><text x="120" y="87" text-anchor="middle" fill="#2a6b6b" font-size="20">🤖</text><text x="120" y="105" text-anchor="middle" fill="#2a6b6b" font-size="8">AI Companion</text><circle cx="280" cy="90" r="30" fill="#0f766e" opacity="0.12" stroke="#0f766e" stroke-width="1.5"/><text x="280" y="87" text-anchor="middle" fill="#0f766e" font-size="20">🧠</text><text x="280" y="105" text-anchor="middle" fill="#0f766e" font-size="8">Your Therapist</text><line x1="152" y1="90" x2="248" y2="90" stroke="#635a4c" stroke-width="1.5" stroke-dasharray="6 3"/><text x="200" y="82" text-anchor="middle" fill="#635a4c" font-size="9">Works Together</text><rect x="100" y="140" width="200" height="35" rx="8" fill="#0f766e" opacity="0.06" stroke="#0f766e" stroke-width="1"/><text x="200" y="162" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="500">Comprehensive 2026 Guide</text></svg>`,
  },
  {
    slug: 'why-questions-beat-answers',
    title: 'Why Questions Are More Powerful Than Answers: The Science of Socratic Inquiry',
    excerpt: 'For 2,400 years, the Socratic method has been humanity\'s most powerful tool for self-discovery. Now AI is making it accessible to everyone. Here\'s why being asked the right question changes everything.',
    date: '2026-03-01',
    readTime: '8 min read',
    category: 'Research',
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#faf5ff"/><text x="200" y="70" text-anchor="middle" fill="#5b4a8a" font-size="48" font-weight="700" opacity="0.15">?</text><text x="140" y="100" text-anchor="middle" fill="#5b4a8a" font-size="32" font-weight="700" opacity="0.1">?</text><text x="270" y="110" text-anchor="middle" fill="#5b4a8a" font-size="24" font-weight="700" opacity="0.08">?</text><circle cx="200" cy="120" r="40" fill="none" stroke="#5b4a8a" stroke-width="1.5" opacity="0.3"/><circle cx="200" cy="120" r="25" fill="none" stroke="#5b4a8a" stroke-width="1" opacity="0.2"/><circle cx="200" cy="120" r="10" fill="#5b4a8a" opacity="0.15"/><text x="200" y="170" text-anchor="middle" fill="#5b4a8a" font-size="10" font-weight="500">The Science of Socratic Inquiry</text></svg>`,
  },
  {
    slug: 'therapy-homework-completion-ai',
    title: 'How AI is Transforming Therapy Homework: From 20% to 75% Completion',
    excerpt: 'Traditional therapy worksheets have a completion rate of just 20-30%. Conversational AI companions are changing that dramatically. Here\'s the research behind the revolution.',
    date: '2026-02-15',
    readTime: '6 min read',
    category: 'Research',
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#f0fdfa"/><rect x="60" y="60" width="60" height="100" rx="6" fill="#c5bba8" opacity="0.3"/><rect x="60" y="120" width="60" height="40" rx="6" fill="#0f766e" opacity="0.25"/><text x="90" y="145" text-anchor="middle" fill="#0f766e" font-size="11" font-weight="700">25%</text><text x="90" y="55" text-anchor="middle" fill="#635a4c" font-size="8">Worksheets</text><rect x="180" y="60" width="60" height="100" rx="6" fill="#0f766e" opacity="0.1"/><rect x="180" y="60" width="60" height="75" rx="6" fill="#0f766e" opacity="0.5"/><text x="210" y="100" text-anchor="middle" fill="white" font-size="11" font-weight="700">75%</text><text x="210" y="55" text-anchor="middle" fill="#0f766e" font-size="8" font-weight="500">AI-Assisted</text><path d="M280 140 L300 120 L320 130 L340 100 L360 90" stroke="#0f766e" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="360" cy="90" r="4" fill="#0f766e"/><text x="320" y="80" text-anchor="middle" fill="#0f766e" font-size="8">3x improvement</text><text x="200" y="185" text-anchor="middle" fill="#115e59" font-size="9">Habicht et al., JMIR, 2025</text></svg>`,
  },
  {
    slug: 'the-167-hours-between-sessions',
    title: 'The Gap Between Sessions: Why the 167 Hours Matter Most',
    excerpt: 'Your therapy session is 1 hour per week. That leaves 167 hours where the real work happens — or doesn\'t. Here\'s how to make those hours count.',
    date: '2026-02-01',
    readTime: '5 min read',
    category: 'Therapy',
    illustration: `<svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" rx="12" fill="#f0fdfa"/><circle cx="200" cy="95" r="60" fill="none" stroke="#0f766e" stroke-width="2" opacity="0.2"/><circle cx="200" cy="95" r="60" fill="none" stroke="#0f766e" stroke-width="3" stroke-dasharray="3 93.7" stroke-dashoffset="0" opacity="0.8"/><text x="200" y="90" text-anchor="middle" fill="#0f766e" font-size="22" font-weight="700">167</text><text x="200" y="108" text-anchor="middle" fill="#115e59" font-size="10">hours</text><text x="200" y="175" text-anchor="middle" fill="#635a4c" font-size="10">The gap where therapy works — or doesn't</text></svg>`,
  },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const featuredPost = BLOG_POSTS.find(post => post.featured);
  const otherPosts = BLOG_POSTS.filter(post => !post.featured);

  return (
    <main className="min-h-screen bg-paper">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase hover:text-gold-bright transition-colors">
          Sorca
        </Link>
        <Link 
          href="/"
          className="text-text-muted hover:text-gold transition-colors font-courier text-xs tracking-widest uppercase"
        >
          Back to Home
        </Link>
      </header>

      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-16">
          <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
            Insights
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
          </div>
          <h1 className="font-cinzel font-semibold text-4xl md:text-5xl mb-6 text-text-main">
            The Sorca <em className="font-cormorant italic font-light text-gold">Blog</em>
          </h1>
          <p className="font-cormorant text-xl text-text-mid max-w-2xl">
            Evidence-based insights on AI-assisted therapy, mental health between sessions, and tools that help therapists and clients achieve better outcomes.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="block mb-16 group">
            <article className="bg-surface border border-gold/20 rounded-xl overflow-hidden hover:border-gold/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(15,118,110,0.08)]">
              {/* Illustration Thumbnail */}
              <div 
                className="w-full aspect-[2/1] bg-raised"
                dangerouslySetInnerHTML={{ __html: featuredPost.illustration }}
              />
              
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-courier text-[10px] text-gold tracking-widest uppercase border border-gold/30 px-3 py-1 rounded-full">
                    Featured
                  </span>
                  <span className="font-courier text-[10px] text-text-muted tracking-widest uppercase">
                    {featuredPost.category}
                  </span>
                </div>

                <h2 className="font-cinzel text-2xl md:text-3xl text-text-main mb-4 group-hover:text-gold transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="font-cormorant text-lg text-text-mid leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-4 text-text-muted">
                  <span className="font-courier text-[10px] tracking-widest uppercase">
                    {formatDate(featuredPost.date)}
                  </span>
                  <span className="text-border">·</span>
                  <span className="font-courier text-[10px] tracking-widest uppercase">
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Other Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-surface border border-border rounded-lg overflow-hidden h-full hover:border-gold/30 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(15,118,110,0.05)]">
                {/* Illustration Thumbnail */}
                <div 
                  className="w-full aspect-[2/1] bg-raised"
                  dangerouslySetInnerHTML={{ __html: post.illustration }}
                />

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-courier text-[9px] text-gold/70 tracking-widest uppercase">
                      {post.category}
                    </span>
                  </div>

                  <h2 className="font-cinzel text-lg text-text-main mb-3 group-hover:text-gold transition-colors leading-tight">
                    {post.title}
                  </h2>

                  <p className="font-cormorant text-text-mid text-sm leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-3 text-text-muted mt-auto">
                    <span className="font-courier text-[9px] tracking-widest uppercase">
                      {formatDate(post.date)}
                    </span>
                    <span className="text-border">·</span>
                    <span className="font-courier text-[9px] tracking-widest uppercase">
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 bg-raised border border-gold/20 rounded-xl p-8 md:p-12 text-center">
          <h3 className="font-cinzel text-xl text-gold mb-4">
            Weekly Therapy Insights
          </h3>
          <p className="font-cormorant text-text-mid mb-6 max-w-md mx-auto">
            Evidence-based mental health tips, therapy strategies, and between-session guidance. No spam. Unsubscribe anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg font-courier text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button className="px-6 py-3 bg-gold text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold-bright transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-12 border-t border-border mt-12">
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
