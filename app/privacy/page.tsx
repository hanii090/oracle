import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sorca',
  description: 'How Sorca collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-void py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="font-cinzel text-gold tracking-[0.3em] text-xs uppercase hover:text-gold-bright transition-colors mb-12 inline-block">
          ← Sorca
        </Link>

        <h1 className="font-cinzel text-4xl text-gold mb-4">Privacy Policy</h1>
        <p className="font-courier text-xs text-text-muted mb-12 tracking-widest uppercase">
          Last updated: March 2026
        </p>

        <div className="prose max-w-none font-cormorant text-lg text-text-mid space-y-8">
          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">1. Information We Collect</h2>
            <p><strong>Account data:</strong> When you sign in with Google, we receive your name, email, and profile picture from Google OAuth.</p>
            <p><strong>Session data:</strong> The messages you exchange with Sorca during sessions, including timestamps and depth levels.</p>
            <p><strong>Payment data:</strong> Subscription payments are processed by Stripe. We do not store your card details. We store your Stripe customer ID and subscription status.</p>
            <p><strong>Usage data:</strong> Session counts, feature usage, and basic analytics.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">2. How We Use Your Data</h2>
            <p><strong>Session continuity:</strong> Your session history powers the Thread feature, allowing Sorca to reference past conversations.</p>
            <p><strong>Service improvement:</strong> Aggregated, anonymised usage patterns help us improve Sorca.</p>
            <p><strong>Billing:</strong> To manage your subscription and enforce usage limits.</p>
            <p>We do not sell your data. We do not use your conversations to train AI models.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">3. Data Storage</h2>
            <p>Your data is stored in Google Cloud Firestore (Firebase). Data is encrypted at rest and in transit. Servers are located in the United States and Europe.</p>
            <p>Session data is also cached in your browser&apos;s localStorage as a fallback.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">4. Third-Party Services</h2>
            <p><strong>Google Gemini:</strong> Your messages are sent to Google&apos;s Gemini API to generate Sorca&apos;s questions. See Google&apos;s AI privacy policy for details.</p>
            <p><strong>Stripe:</strong> Payment processing. See Stripe&apos;s privacy policy.</p>
            <p><strong>Firebase Authentication:</strong> For secure sign-in. See Google&apos;s privacy policy.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">5. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">6. Your Rights</h2>
            <p>Under GDPR and similar regulations, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access all data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing of your data</li>
            </ul>
            <p>To exercise these rights, contact us at the project repository.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">7. Data Retention</h2>
            <p>Session data is retained for as long as your account exists. If you delete your account, all associated data will be permanently deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">8. Children</h2>
            <p>Sorca is not intended for users under 16 years of age. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="font-cinzel text-xl text-text-main mb-4">9. Changes to This Policy</h2>
            <p>We may update this policy periodically. We will notify you of significant changes via the application.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
