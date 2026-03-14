import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SkipNav } from "@/components/SkipNav";

// NOTE: Variable names are legacy — they map to CSS classes used across the entire app.
// font-cinzel = headings (actually Playfair Display)
// font-cormorant = body text (actually DM Sans)
// font-courier = labels/mono (actually Bebas Neue)
const cinzel = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-cinzel",
});

const cormorant = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const courier = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: {
    default: "SORCA — AI Therapy Companion for Between-Session Support",
    template: "%s | SORCA",
  },
  description:
    "Sorca is an AI therapy companion that supports your mental health between sessions. Voice therapy sessions, CBT homework tracking, mood monitoring, and therapist-supervised care. 75% homework completion rate. GDPR compliant. Used by NHS therapists and private practitioners across the UK.",
  keywords: [
    // ── High-volume UK therapy search terms ──
    "AI therapy companion",
    "online therapy support UK",
    "mental health app UK",
    "therapy between sessions",
    "AI counselling app",
    "CBT app UK",
    "mental health companion app",
    "therapy homework app",
    "voice therapy session",
    "AI mental health support",
    "therapy app UK",
    "online CBT tools",
    "digital therapy support",
    "mental health chatbot UK",
    "AI therapy assistant",
    // ── Clinical / therapist-facing ──
    "therapist dashboard software",
    "therapy outcome measures",
    "PHQ-9 GAD-7 tracking",
    "between-session support tool",
    "digital therapy companion",
    "therapy session notes AI",
    "clinical psychology software UK",
    "therapist client portal",
    "IAPT compatible software",
    "therapy practice management",
    "clinical outcome tracking",
    "therapy homework tracking software",
    // ── Condition & modality terms ──
    "anxiety support app UK",
    "depression self-help app",
    "CBT companion app",
    "ACT therapy app",
    "DBT skills app",
    "mindfulness therapy app",
    "grief support app",
    "trauma recovery app",
    "stress management app UK",
    "panic attack support app",
    "OCD therapy tools",
    "PTSD support between sessions",
    // ── Long-tail / intent-based ──
    "how to do therapy homework",
    "therapy app that works with my therapist",
    "AI therapy UK GDPR compliant",
    "mood tracker for therapy",
    "NHS therapy waiting list support",
    "between therapy sessions what to do",
    "best mental health app 2026",
    "relapse prevention app",
    "daily mental health check-in",
    "therapy progress tracker",
    "free mental health app UK",
    "voice therapy app at night",
    "therapy companion for anxiety",
    "CBT homework completion app",
    "talk therapy app online",
    // ── Brand ──
    "sorca",
    "sorca therapy",
    "sorca.life",
    "sorca AI therapy",
  ],
  authors: [{ name: "Sorca" }],
  creator: "Sorca",
  publisher: "Sorca",
  category: "Health & Fitness",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://sorca.life"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "SORCA",
    title: "SORCA — AI Therapy Companion for Between-Session Support",
    description:
      "Voice therapy sessions, CBT homework, mood tracking & therapist-supervised AI care. 75% homework completion. GDPR compliant. Try free.",
    url: "/",
    images: [
      {
        url: "/hero-image.png?v=3",
        width: 1200,
        height: 630,
        alt: "SORCA — AI Therapy Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SORCA — AI Therapy Companion",
    description:
      "Voice therapy sessions, CBT homework tracking & mood monitoring between sessions. Used by NHS therapists. GDPR compliant. Try free.",
    creator: "@saboracle",
    images: ["/hero-image.png?v=3"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Sorca",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0f766e",
    "theme-color": "#0f766e",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${courier.variable}`}
    >
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4J6DRMTKFR"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4J6DRMTKFR');
            `,
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-gold/30 selection:text-gold-bright"
        suppressHydrationWarning
      >
        <SkipNav />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "SORCA",
              applicationCategory: "HealthApplication",
              applicationSubCategory: "Mental Health",
              operatingSystem: "Web, iOS, Android",
              url: "https://sorca.life",
              description:
                "AI therapy companion for between-session mental health support. Voice therapy sessions, CBT homework tracking, mood monitoring, and therapist-supervised care. GDPR compliant.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "312",
              },
              offers: [
                {
                  "@type": "Offer",
                  name: "Free",
                  price: "0",
                  priceCurrency: "GBP",
                  description:
                    "5 therapy sessions per month, daily mood check-ins, grounding exercises",
                },
                {
                  "@type": "Offer",
                  name: "Philosopher",
                  price: "9",
                  priceCurrency: "GBP",
                  description:
                    "Unlimited sessions, voice therapy, homework journeys, outcome tracking (PHQ-9, GAD-7)",
                },
                {
                  "@type": "Offer",
                  name: "Pro",
                  price: "19",
                  priceCurrency: "GBP",
                  description:
                    "Everything in Philosopher plus 5 hours voice therapy, advanced analytics, memory portraits",
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Sorca?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sorca is an AI therapy companion designed to support your mental health between therapy sessions. It offers voice therapy sessions, CBT-based homework journeys, daily mood tracking, and tools like PHQ-9 and GAD-7 outcome measures — all supervised by your therapist through a secure dashboard.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Sorca help therapists?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sorca provides therapists with a clinical dashboard showing client mood trends, homework completion (75% vs 20-30% with traditional worksheets), pattern alerts, PHQ-9/GAD-7 outcome measures, and session preparation briefs. It supports clients in the 167 hours between weekly sessions.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Sorca a replacement for therapy?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. Sorca is not therapy and does not diagnose, treat, or provide clinical advice. It is a between-session support tool that complements professional therapy by helping clients track mood, complete homework, and practise coping skills.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Sorca GDPR compliant?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Sorca is fully GDPR compliant. All data sharing requires explicit opt-in consent, patients control what is shared with therapists, and consent is revocable at any time. Data can be exported or deleted on request.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I use Sorca while on an NHS waiting list?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Sorca provides mental health support while you wait for NHS therapy. You can use mood tracking, grounding exercises, and guided reflection sessions for free. When your NHS therapy begins, Sorca integrates as a between-session companion.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What therapy approaches does Sorca use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sorca supports CBT (Cognitive Behavioural Therapy), ACT (Acceptance and Commitment Therapy), person-centred therapy, motivational interviewing, psychodynamic approaches, and IFS (Internal Family Systems). Your therapist can configure which approaches are used.",
                  },
                },
              ],
            }),
          }}
        />
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
