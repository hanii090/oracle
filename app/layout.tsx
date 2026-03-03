import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Courier_Prime } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
