"use client";

/**
 * AuctionRoomClient — the interactive Live Auction Room.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────┬────────────────┐
 *   │      YouTube Stream (16:9)   │  Bidding Panel │
 *   │──────────────────────────────│  ─────────────  │
 *   │  StreamSyncPanel             │  LiveBidFeed   │
 *   └──────────────────────────────┴────────────────┘
 *
 * Real-time: useRealtimeBid hook keeps the store updated via Ably.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useRealtimeBid } from "@/hooks/useRealtimeBid";
import { formatPrice, getBidIncrement, applyBuyersPremium } from "@/lib/bidUtils";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BidButton } from "@/components/BidButton";
import { KycGuard } from "@/components/KycGuard";
import { LiveBidFeed } from "@/components/LiveBidFeed";
import { LatencyIndicator } from "@/components/LatencyIndicator";
import { StreamSyncPanel } from "@/components/StreamSyncPanel";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import type { Lot, Bid } from "@/types/auction";

interface AuctionRoomClientProps {
  lot: Lot;
  initialBids: Bid[];
  currentUserId: string;
  isVerifiedBidder: boolean;
  youtubeVideoId: string | null;
}

export function AuctionRoomClient({
  lot,
  initialBids,
  currentUserId,
  isVerifiedBidder,
  youtubeVideoId,
}: AuctionRoomClientProps) {
  // Hydrate store with server-fetched lot data
  const setLot = useAuctionStore((s) => s.setLot);
  const currentPrice = useAuctionStore((s) => s.currentPrice) || lot.current_price;
  const status = useAuctionStore((s) => s.status) || lot.status;
  const liveEndAt = useAuctionStore((s) => s.liveEndAt) ?? lot.live_end_at;

  // Bootstrap store once
  useState(() => {
    setLot(lot.id, lot.current_price, lot.status, lot.live_end_at);
  });

  // Subscribe to real-time Ably updates
  useRealtimeBid(lot.id);

  // Stream sync state
  const [streamCurrentTime, setStreamCurrentTime] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0);

  const handleTimeUpdate = useCallback((t: number) => {
    setStreamCurrentTime(t);
  }, []);

  const increment = getBidIncrement(currentPrice);
  const buyersPremium = applyBuyersPremium(currentPrice);

  return (
    <div className="flex min-h-screen flex-col bg-obsidian-950">
      {/* Top bar — lot context */}
      <div className="border-b border-obsidian-700 bg-obsidian-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/lot/${lot.id}`}
              className="font-body text-xs text-platinum-500 transition hover:text-platinum-300"
            >
              ← Back
            </Link>
            <span className="text-platinum-500">/</span>
            <span className="max-w-[200px] truncate font-body text-sm text-platinum-200 sm:max-w-none">
              {lot.title}
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-4">
            <LatencyIndicator />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_380px] lg:items-start">

        {/* LEFT: Stream + sync */}
        <div className="flex flex-col gap-4">
          {/* YouTube or placeholder */}
          {youtubeVideoId ? (
            <YouTubePlayer videoId={youtubeVideoId} onTimeUpdate={handleTimeUpdate} />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-obsidian-700 bg-obsidian-900">
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  {/* YouTube logo */}
                  <svg className="h-12 w-12 text-auction-live/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <p className="font-body text-sm text-platinum-500">No live stream connected</p>
                <p className="mt-1 font-body text-xs text-platinum-500">
                  Add <code className="text-gold-400">?v=YOUTUBE_VIDEO_ID</code> to the URL
                </p>
              </div>
            </div>
          )}

          {/* Stream sync panel */}
          <StreamSyncPanel
            streamCurrentTime={streamCurrentTime}
            onOffsetChange={setSyncOffset}
          />

          {/* Lot description — visible on desktop below the stream */}
          <div className="hidden rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5 lg:block">
            <h2 className="mb-1 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">About This Lot</h2>
            <h3 className="mb-2 font-display text-lg font-bold text-platinum-200">{lot.title}</h3>
            {lot.category && (
              <span className="mb-3 inline-block rounded-full border border-gold-600/30 bg-gold-600/10 px-2.5 py-0.5 font-body text-xs text-gold-400">
                {lot.category}
              </span>
            )}
            {lot.description && (
              <p className="font-body text-sm leading-relaxed text-platinum-500">{lot.description}</p>
            )}
          </div>
        </div>

        {/* RIGHT: Bidding panel + feed */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[57px] lg:max-h-[calc(100vh-57px)] lg:overflow-y-auto">

          {/* Price + Bid action */}
          <motion.div
            layout
            className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5"
          >
            {/* Status + Timer */}
            <div className="mb-4 flex items-center justify-between">
              <StatusBadge status={status} />
              {liveEndAt && status === "LIVE" && (
                <CountdownTimer liveEndAt={liveEndAt} />
              )}
            </div>

            {/* Live price */}
            <div className="mb-1">
              <p className="font-body text-xs uppercase tracking-widest text-platinum-500">Current Bid</p>
              <motion.p
                key={currentPrice}
                initial={{ scale: 1.06, color: "#C9A84C" }}
                animate={{ scale: 1, color: "#C9A84C" }}
                transition={{ duration: 0.4 }}
                className="font-display text-4xl font-bold text-gold-400"
              >
                {formatPrice(currentPrice)}
              </motion.p>
            </div>

            <p className="mb-5 font-body text-xs text-platinum-500">
              Min. increment: <span className="text-platinum-300">{formatPrice(increment)}</span>
              {" · "}Est. total with 20% premium:{" "}
              <span className="text-platinum-300">{formatPrice(buyersPremium)}</span>
            </p>

            {/* Bid action */}
            <KycGuard>
              <BidButton lotId={lot.id} currentPrice={currentPrice} />
            </KycGuard>
          </motion.div>

          {/* Live Bid Feed */}
          <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
            <LiveBidFeed initialBids={initialBids} currentUserId={currentUserId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
