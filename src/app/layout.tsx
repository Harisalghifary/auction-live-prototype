import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anti-Gravity Auction | Live Antique Auctions",
  description:
    "Bid on rare antiques in real-time. High-stakes live auctions with AI-powered authenticity verification.",
  keywords: ["antique auction", "live auction", "rare collectibles", "bid online"],
  openGraph: {
    title: "Anti-Gravity Auction",
    description: "Real-time antique auctions powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-obsidian-950 font-body text-platinum-200 antialiased">
        {/* Top nav */}
        <header className="sticky top-0 z-50 border-b border-obsidian-700 bg-obsidian-950/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <a href="/" className="font-display text-xl font-bold tracking-wide text-gold-400">
              Anti-Gravity<span className="text-platinum-300"> Auction</span>
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/login"
                className="rounded-lg border border-obsidian-700 px-4 py-2 font-body text-sm text-platinum-300 transition hover:border-gold-600/50 hover:text-gold-400"
              >
                Sign In
              </a>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-obsidian-700 py-8 text-center">
          <p className="font-body text-xs text-platinum-500">
            © 2026 Anti-Gravity Auction. All lots subject to Buyer&apos;s Premium of 20%.
          </p>
        </footer>
      </body>
    </html>
  );
}
