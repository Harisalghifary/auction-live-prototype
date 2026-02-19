"use client";

/**
 * LiveBidFeed — Animated real-time bid list for the Live Auction Room.
 *
 * Subscribes to the Zustand auction store and animates each new bid in
 * with a Framer Motion slide-in from the top. Shows the HIGH BIDDER crown
 * on the most recent entry.
 */

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuctionStore } from "@/store/useAuctionStore";
import { formatPrice } from "@/lib/bidUtils";
import type { Bid } from "@/types/auction";

interface LiveBidFeedProps {
  initialBids: Bid[];
  currentUserId?: string;
}

const bidVariants = {
  initial: { opacity: 0, y: -24, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.18 } },
};

export function LiveBidFeed({ initialBids, currentUserId }: LiveBidFeedProps) {
  const bids = useAuctionStore((s) => s.bids);
  const feedRef = useRef<HTMLDivElement>(null);

  // Merge initial server-side bids with real-time bids from the store
  const displayBids: Bid[] = bids.length > 0 ? bids : initialBids;

  // Auto-scroll to top when a new bid arrives
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [displayBids.length]);

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-obsidian-700 pb-3">
        <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
          Live Bid Feed
        </h3>
        {/* Pulsing live indicator */}
        <span className="flex items-center gap-1.5 font-body text-xs text-auction-live">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-auction-live opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-auction-live" />
          </span>
          LIVE
        </span>
      </div>

      {/* Feed list */}
      <div
        ref={feedRef}
        className="mt-3 flex max-h-[380px] flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin"
        aria-live="polite"
        aria-label="Live bid updates"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {displayBids.map((bid, i) => {
            const isHighBidder = i === 0;
            const isCurrentUser = bid.user_id === currentUserId;
            const shortId = bid.user_id.slice(-4).toUpperCase();

            return (
              <motion.div
                key={bid.id}
                variants={bidVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                  isHighBidder
                    ? "border border-gold-500/30 bg-gold-500/10"
                    : isCurrentUser
                    ? "border border-obsidian-700 bg-obsidian-900"
                    : "border border-transparent bg-obsidian-900/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Avatar circle */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                      isHighBidder
                        ? "bg-gold-500/20 text-gold-400"
                        : "bg-obsidian-700 text-platinum-300"
                    }`}
                  >
                    {isCurrentUser ? "YOU" : `···${shortId}`}
                  </div>

                  <div>
                    <span className="font-body text-xs text-platinum-500">
                      {isCurrentUser ? "You" : `Bidder ···${shortId}`}
                    </span>
                    {isHighBidder && (
                      <span className="ml-1.5 font-body text-[9px] font-bold uppercase tracking-widest text-gold-500">
                        ★ High Bidder
                      </span>
                    )}
                    {bid.is_proxy_bid && (
                      <span className="ml-1.5 font-body text-[9px] text-platinum-500 opacity-60">
                        auto
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-display text-sm font-bold ${
                      isHighBidder ? "text-gold-400" : "text-platinum-200"
                    }`}
                  >
                    {formatPrice(bid.amount)}
                  </span>
                  <p className="font-body text-[10px] text-platinum-500">
                    {new Date(bid.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {displayBids.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-platinum-500">
            No bids yet. Be the first to bid!
          </p>
        )}
      </div>
    </div>
  );
}
