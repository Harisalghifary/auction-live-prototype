import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { NavBar } from "@/components/NavBar";
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
      <body suppressHydrationWarning className="min-h-screen bg-obsidian-950 font-body text-platinum-200 antialiased">
        <NavBar />
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
