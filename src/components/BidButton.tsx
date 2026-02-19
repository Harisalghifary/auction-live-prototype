"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useAuctionStore } from "@/store/useAuctionStore";
import { supabase } from "@/lib/supabaseClient";
import { validateBidAmount, getMinimumBid, formatPrice } from "@/lib/bidUtils";
import { PlaceBidRequestSchema } from "@/types/auction";

interface BidButtonProps {
  lotId: string;
  currentPrice: number;
  disabled?: boolean;
}

export function BidButton({ lotId, currentPrice, disabled }: BidButtonProps) {
  const { bidState, setBidState, status } = useAuctionStore((s) => ({
    bidState: s.bidState,
    setBidState: s.setBidState,
    status: s.status,
  }));
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const minBid = getMinimumBid(currentPrice);
  const isPaused = status === "PAUSED" || status === "SOLD";
  const isDisabled = disabled || isPaused || bidState === "pending";

  const handleBid = async () => {
    const amount = parseFloat(inputValue);

    // Client-side validation (Zod)
    const parsed = PlaceBidRequestSchema.safeParse({ lot_id: lotId, amount });
    if (!parsed.success) {
      setBidState("error", "Invalid bid amount.");
      return;
    }

    // Domain validation
    const validationError = validateBidAmount(amount, currentPrice);
    if (validationError) {
      setBidState("error", validationError.message);
      return;
    }

    setBidState("pending");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBidState("error", "Your session has expired. Please log in again.");
      return;
    }

    const { error } = await supabase.from("bids").insert({
      lot_id: lotId,
      user_id: user.id,
      amount,
    });

    if (error) {
      setBidState("error", error.message);
    } else {
      // Optimistic: wait for WebSocket to confirm → set high_bidder
      // The useRealtimeBid hook will receive the broadcast and update store
      setBidState("high_bidder");
      setShowInput(false);
      setInputValue("");
    }
  };

  const stateConfig = {
    idle: { label: `Bid from ${formatPrice(minBid)}`, class: "bg-gold-500 hover:bg-gold-400 text-obsidian-950" },
    pending: { label: "Placing bid...", class: "bg-gold-600/60 text-obsidian-900 cursor-wait" },
    high_bidder: { label: "✓ You're the High Bidder!", class: "bg-green-600/80 text-white" },
    outbid: { label: "You've been outbid — Bid Again", class: "bg-auction-live/80 text-white" },
    error: { label: "Retry Bid", class: "bg-auction-live/80 text-white" },
  };

  const config = stateConfig[bidState];

  if (isPaused) {
    return (
      <div className="rounded-xl border border-auction-pending/30 bg-auction-pending/10 px-6 py-4 text-center font-body text-sm text-auction-pending">
        {status === "SOLD" ? "This lot has been sold." : "Auction is paused. Please wait."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bid input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-platinum-500">$</span>
              <input
                id="bid-amount-input"
                type="number"
                min={minBid}
                step={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={String(minBid)}
                className="w-full rounded-xl border border-obsidian-700 bg-obsidian-900 py-3 pl-7 pr-3 font-body text-platinum-200 placeholder:text-platinum-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
                aria-label="Enter your bid amount in USD"
                autoFocus
              />
            </div>
            <button
              onClick={handleBid}
              disabled={isDisabled || !inputValue}
              className="rounded-xl bg-gold-500 px-5 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-40"
              aria-label="Confirm bid"
            >
              Confirm
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {bidState === "error" && useAuctionStore.getState().bidError && (
        <p className="font-body text-sm text-auction-live" role="alert">
          {useAuctionStore.getState().bidError}
        </p>
      )}

      {/* Main CTA button */}
      <motion.button
        className={clsx(
          "w-full rounded-xl px-6 py-4 font-body text-base font-semibold transition-all",
          config.class,
          isDisabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => {
          if (bidState === "idle" || bidState === "outbid" || bidState === "error") {
            setShowInput(!showInput);
            setBidState("idle");
          }
        }}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        aria-label={config.label}
      >
        {config.label}
      </motion.button>
    </div>
  );
}
