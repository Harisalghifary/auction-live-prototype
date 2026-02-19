import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Prestige dark palette inspired by Sotheby's
        obsidian: {
          950: "#0A0A0B",
          900: "#111113",
          800: "#1A1A1E",
          700: "#232329",
        },
        gold: {
          300: "#F5D897",
          400: "#EEC96A",
          500: "#D4A017",
          600: "#B8860B",
        },
        platinum: {
          200: "#F4F4F5",
          300: "#D1D1D6",
          500: "#8E8E93",
        },
        auction: {
          live: "#FF3B30",     // pulsing red for LIVE
          pending: "#FF9500",  // amber for PAUSED
          sold: "#636366",     // muted gray for SOLD
          pre: "#0A84FF",      // blue for PRE_BID
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-live": "pulse-live 1.5s ease-in-out infinite",
        "bid-flash": "bid-flash 0.4s ease-out",
        "fade-up": "fade-up 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "bid-flash": {
          "0%": { backgroundColor: "rgba(212, 160, 23, 0.4)" },
          "100%": { backgroundColor: "transparent" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "prestige-gradient":
          "linear-gradient(135deg, #111113 0%, #1A1A1E 50%, #111113 100%)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.15) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
