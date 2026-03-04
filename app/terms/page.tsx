import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Sorca',
  description: 'Sorca terms of service and conditions of use.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-void py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase hover:text-gold-bright transition-colors mb-12 inline-block">
          ← Sorca
        </Link>

        <h1 className="font-cinzel text-4xl text-gold mb-4">Terms of Service</h1>
        <p className="font-courier text-xs text-text-muted mb-12 tracking-widest uppercase">
          Last updated: March 2026
        </p>

        <div className="prose prose-invert max-w-none font-cormorant text-lg text-text-mid space-y-8">
          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Sorca (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">2. Description of Service</h2>
            <p>Sorca is an AI-powered reflective questioning tool designed to facilitate self-discovery through Socratic dialogue. Sorca does not provide medical, psychological, or therapeutic advice. It is not a substitute for professional mental health services.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">3. Account &amp; Authentication</h2>
            <p>You may sign in via Google OAuth. You are responsible for maintaining the security of your account. You must not share your account with others.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">4. Subscription Tiers</h2>
            <p><strong>Seeker (Free):</strong> 5 sessions per month, up to depth level 5.</p>
            <p><strong>Philosopher (£12/month):</strong> Unlimited sessions, all depth levels, additional features.</p>
            <p><strong>Sorca Pro (£49/month):</strong> Professional tier with client management (coming soon).</p>
            <p>Subscriptions are billed through Stripe. You may cancel at any time. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">5. User Content</h2>
            <p>You retain ownership of all content you submit during sessions. Sorca stores your session data to provide the Thread feature. You may delete your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">6. Prohibited Use</h2>
            <p>You must not use Sorca to: generate harmful content; attempt to bypass rate limits or security measures; reverse-engineer the service; or use the service in any way that violates applicable law.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">7. Disclaimer</h2>
            <p>Sorca is provided &quot;as is&quot; without warranties. We do not guarantee uninterrupted access. AI-generated responses may be inaccurate or inappropriate. Use at your own discretion.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Sorca and its creators shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">9. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">10. Contact</h2>
            <p>For questions about these terms, contact us at the project repository.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
