import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SkipNav } from "@/components/SkipNav";

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
    default: "SORCA — The AI That Only Asks Questions",
    template: "%s | SORCA",
  },
  description:
    "Sorca is a Socratic AI for therapists, coaches, and anyone seeking radical self-honesty. No answers. No advice. Just questions so precise they change everything. 75% homework completion rate with AI-assisted therapy support. Used by clinical psychologists, executive coaches, and founders worldwide.",
  keywords: [
    "AI therapy tool",
    "Socratic questioning AI",
    "self-discovery AI",
    "AI for therapists",
    "AI for coaches",
    "deep questions AI",
    "introspection tool",
    "sorca",
    "self-reflection app",
    "AI mental health",
    "therapy companion",
    "executive coaching tool",
    "Socratic method",
    "philosophical AI",
    "grief and legacy AI",
    "end of life planning",
    "therapy homework app",
    "between-session support",
    "CBT companion app",
    "therapist dashboard",
    "clinical AI tool",
    "therapy session debrief",
    "pre-session primer",
    "coping strategies app",
    "GDPR compliant therapy",
    "UK therapy tool",
    "NHS compatible",
  ],
  authors: [{ name: "Sorca" }],
  creator: "Sorca",
  publisher: "Sorca",
  category: "Mental Health & Self-Discovery",
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
    title: "SORCA — The AI That Only Asks Questions",
    description:
      "No answers. No advice. Just questions so precise they change everything. Used by therapists, coaches, and founders seeking radical self-honesty.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "SORCA — The AI That Only Asks Questions",
    description:
      "A Socratic AI for therapists, coaches, and anyone brave enough to face themselves. No answers — only the questions you've been avoiding.",
    creator: "@saboracle",
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
              operatingSystem: "Web",
              url: "https://sorca.life",
              description:
                "A Socratic AI that responds only with questions. Used by therapists, coaches, and individuals for radical self-discovery.",
              offers: [
                {
                  "@type": "Offer",
                  name: "Seeker",
                  price: "0",
                  priceCurrency: "GBP",
                  description:
                    "5 sessions per month, basic Thread, depth level 5",
                },
                {
                  "@type": "Offer",
                  name: "Philosopher",
                  price: "12",
                  priceCurrency: "GBP",
                  description:
                    "Unlimited sessions, full Thread, Voice Sorca, Excavation Reports",
                },
                {
                  "@type": "Offer",
                  name: "Sorca Pro",
                  price: "49",
                  priceCurrency: "GBP",
                  description:
                    "Everything in Philosopher plus End of Life mode, Memory Portraits, Thread Archive",
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
