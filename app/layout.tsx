import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Courier_Prime } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SkipNav } from "@/components/SkipNav";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const courier = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: "ORACLE",
  description: "The AI that never answers.",
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
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
