import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | SORCA',
  description: 'Insights on Socratic questioning, therapy support, and the science of self-discovery. Learn how AI is transforming mental health support between therapy sessions.',
  keywords: [
    'therapy blog',
    'Socratic questioning',
    'AI therapy support',
    'mental health insights',
    'therapy homework',
    'between session support',
    'self-discovery',
    'CBT companion',
  ],
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-questions-beat-answers',
    title: 'Why Questions Are More Powerful Than Answers: The Science of Socratic Inquiry',
    excerpt: 'For 2,400 years, the Socratic method has been humanity\'s most powerful tool for self-discovery. Now AI is making it accessible to everyone. Here\'s why being asked the right question changes everything.',
    date: '2026-03-01',
    readTime: '8 min read',
    category: 'Philosophy',
    featured: true,
  },
  {
    slug: 'therapy-homework-completion-ai',
    title: 'How AI is Transforming Therapy Homework: From 20% to 75% Completion',
    excerpt: 'Traditional therapy worksheets have a completion rate of just 20-30%. Conversational AI companions are changing that dramatically. Here\'s the research behind the revolution.',
    date: '2026-02-15',
    readTime: '6 min read',
    category: 'Research',
  },
  {
    slug: 'the-167-hours-between-sessions',
    title: 'The Gap Between Sessions: Why the 167 Hours Matter Most',
    excerpt: 'Your therapy session is 1 hour per week. That leaves 167 hours where the real work happens — or doesn\'t. Here\'s how to make those hours count.',
    date: '2026-02-01',
    readTime: '5 min read',
    category: 'Therapy',
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
            Explorations in Socratic questioning, therapy support, and the science of asking better questions.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="block mb-16 group">
            <article className="bg-surface border border-gold/20 rounded-xl p-8 md:p-12 relative overflow-hidden hover:border-gold/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(192,57,43,0.08)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />
              
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
            </article>
          </Link>
        )}

        {/* Other Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-surface border border-border rounded-lg p-8 h-full hover:border-gold/30 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(192,57,43,0.05)]">
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
              </article>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 bg-raised border border-gold/20 rounded-xl p-8 md:p-12 text-center">
          <h3 className="font-cinzel text-xl text-gold mb-4">
            Get Weekly Questions
          </h3>
          <p className="font-cormorant text-text-mid mb-6 max-w-md mx-auto">
            One question per week that might change how you see yourself. No spam. Unsubscribe anytime.
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
            © 2026 Sorca. The AI that only asks questions.
          </p>
        </div>
      </footer>
    </main>
  );
}
