# AI_INSTRUCTIONS.md: Anti-Gravity Antique Auction

## 1. Project Vision
**Goal:** Build a high-stakes, real-time antique auction platform merging YouTube Live streams with an Agentic Bidding Engine.
**Core Philosophy:** "The Agent is the Auctioneer." The AI is the **Source of Truth** for bid timing, authenticity verification, and "Hammer" moments.

---

## 2. The 2026 Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Framer Motion |
| **Real-time** | Ably or Pusher (WebSockets) - Goal: <100ms propagation |
| **Database/Auth** | Supabase (Postgres) + Row Level Security (RLS) |
| **Media** | YouTube Data API & IFrame Player API |
| **State** | React Server Components + Zustand (Client State) |
| **Orchestration** | LangGraph (Agentic Reasoning Loops) |

---

## 3. Strict Coding Standards
* **Type Safety:** 100% TypeScript. No `any`. Use `Zod` for all schema validations.
* **Server-Side Validation:** All bids must be confirmed via `validateBid()` Edge Function. Never trust the client state.
* **Optimistic UI:** Show "Pending" state immediately; transition to "High Bidder" only upon WebSocket confirmation.
* **Error Handling:** Provide specific feedback for: `BID_TOO_LOW`, `INSUFFICIENT_FUNDS`, `AUCTION_PAUSED`, or `EXPIRED_SESSION`.

---

## 4. Domain-Specific Logic (The Rules)
### Anti-Sniping Rule
If a bid is placed within the **last 15 seconds** of a lot, the timer automatically extends by **30 seconds**.

### Bid Increments
- **$0 - $500:** $25 increments.
- **$500 - $2,000:** $100 increments.
- **$2,000+:** $250 increments.

### Pre-Bidding vs. Live
- Pre-bids serve as the "Starting Bid" for the live event.
- **Proxy Bids:** The `AuctioneerAgent` must auto-bid on behalf of the user up to their defined limit.

---

## 5. Agentic Workflows
Prioritize these autonomous behaviors during code generation:
1.  **Sentry Mode:** Monitor and flag "Shill Bidding" (unnatural bidding patterns).
2.  **Latency Compensation:** The **Bid Log** is the Master Clock. Video lag (2-3s) must not affect bid validity.
3.  **Audit Trail:** Every bid must log `timestamp`, `UserID`, and `IP_address` for compliance.

---

## 6. Reference Benchmarks
* **Primary UX Inspiration:** [Sotheby’s Live](https://www.sothebys.com) — Aim for "High-End Prestige" aesthetic.
* **Functionality Goal:** [Whatnot](https://www.whatnot.com) — Aim for "Low-Latency" mobile-first engagement.
* **State Management:** Follow **Vercel Ship** dashboard patterns for real-time data streaming.
* **Feature references:**
[Syailendra](https://bid.syailendra-auction.com/) - Indonesian auction live that using whitelabel from https://www.auctionmobility.com/

## 7. Cannonical Folder Structure
auction-live/
├── .context/               <-- The "Agentic Brain" (AI Context)
│   ├── AI_INSTRUCTIONS.md  (Tech stack, standards, and persona)
│   ├── ARCHITECTURE.md     (The logic split: Supabase vs. Backend)
│   ├── KNOWLEDGE.md        (Antique categories and auction laws)
│   ├── SCHEMA.sql          (Database tables, RLS, and triggers)
│   └── BENCHMARKS.md       (UI/UX references: Sotheby's, Whatnot)
├── supabase/               <-- Supabase Config & Edge Functions
│   ├── migrations/         (SQL versioning)
│   └── functions/          (Backend Logic)
│       └── process-proxy-bid/ (The Proxy Bidding Engine)
├── src/                    <-- Next.js Frontend
│   ├── app/                (App Router: /auction, /profile, etc.)
│   ├── components/         (UI: BiddingButton, LiveStream, LotCard)
│   ├── hooks/              (useAuctionEvents, useRealtimeBid)
│   ├── lib/                (Ably.ts, supabaseClient.ts)
│   └── store/              (Zustand: useAuctionStore)
├── package.json
└── tailwind.config.ts

---

## 8. Definition of Done (DoD)
- [ ] Feature is mobile-responsive (critical for live event bidders).
- [ ] Edge Function unit tests pass for complex bid logic.
- [ ] WebSocket "Pulse" verified < 200ms globally.
- [ ] A11y compliant for screen readers during rapid bidding.