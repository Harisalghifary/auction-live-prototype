"use client";

/**
 * useRealtimeBid — subscribes to Ably `lot:{id}` channel
 * and pushes incoming bids into the Zustand auction store.
 */

import { useEffect } from "react";
import type Ably from "ably";
import { getLotChannel } from "@/lib/ably";
import { useAuctionStore } from "@/store/useAuctionStore";
import { BidSchema } from "@/types/auction";

export function useRealtimeBid(lotId: string | undefined) {
  const onNewBid = useAuctionStore((s) => s.onNewBid);
  const setStatus = useAuctionStore((s) => s.setStatus);

  useEffect(() => {
    if (!lotId) return;

    const channel = getLotChannel(lotId);

    // Listen for new bids broadcast from the backend
    const bidHandler = (message: Ably.Message) => {
      const parsed = BidSchema.safeParse(message.data);
      if (parsed.success) {
        onNewBid(parsed.data);
      }
    };

    // Listen for lot status changes (e.g., LIVE → SOLD)
    const statusHandler = (message: Ably.Message) => {
      const { status } = message.data ?? {};
      if (status) setStatus(status);
    };

    channel.subscribe("bid.new", bidHandler);
    channel.subscribe("lot.status", statusHandler);

    return () => {
      channel.unsubscribe("bid.new", bidHandler);
      channel.unsubscribe("lot.status", statusHandler);
    };
  }, [lotId, onNewBid, setStatus]);
}
