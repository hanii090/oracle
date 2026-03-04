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
    default: "SORCA — The Question That Changes Everything",
    template: "%s | SORCA",
  },
  description:
    "Sorca is a Socratic AI that never gives answers — only questions. Dive into the abyss of self-discovery through relentless, piercing inquiry.",
  keywords: [
    "AI",
    "Socratic questioning",
    "self-discovery",
    "philosophy",
    "deep questions",
    "introspection",
    "sorca",
    "AI therapy",
    "self-reflection",
  ],
  authors: [{ name: "Sorca" }],
  creator: "Sorca",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://sorca.life"
  ),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "SORCA",
    title: "SORCA — The Question That Changes Everything",
    description:
      "A Socratic AI that responds only with questions. No answers. No advice. Just the truth you're avoiding.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SORCA — The Question That Changes Everything",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SORCA — The Question That Changes Everything",
    description:
      "A Socratic AI that responds only with questions. Dive into the abyss.",
    images: ["/og-image.png"],
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
      <body
        className="antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-gold/30 selection:text-gold-bright"
        suppressHydrationWarning
      >
        <SkipNav />
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
