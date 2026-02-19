"use client";

/**
 * PreBidForm — lets users place a proxy (max) bid on a PRE_BID lot.
 * Stores to the `proxy_bids` table. One proxy bid per user per lot (upsert).
 * The AuctioneerAgent (Edge Function) will auto-bid up to this limit during the live event.
 */

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatPrice, getMinimumBid, validateBidAmount } from "@/lib/bidUtils";
import { PlaceProxyBidRequestSchema } from "@/types/auction";

interface PreBidFormProps {
  lotId: string;
  startingPrice: number;
  existingProxyBid?: number | null; // user's current proxy max
}

export function PreBidForm({ lotId, startingPrice, existingProxyBid }: PreBidFormProps) {
  const minBid = getMinimumBid(startingPrice);
  const [amount, setAmount] = useState<string>(existingProxyBid ? String(existingProxyBid) : "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const numAmount = parseFloat(amount);

    // Zod schema validation
    const parsed = PlaceProxyBidRequestSchema.safeParse({
      lot_id: lotId,
      max_amount: numAmount,
    });

    if (!parsed.success) {
      setStatus("error");
      setMessage("Please enter a valid bid amount.");
      return;
    }

    // Domain rule validation
    const err = validateBidAmount(numAmount, startingPrice);
    if (err) {
      setStatus("error");
      setMessage(err.message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setMessage("Please sign in to place a pre-bid.");
      return;
    }

    // Upsert the proxy bid (one per user per lot)
    const { error } = await supabase
      .from("proxy_bids")
      .upsert(
        { lot_id: lotId, user_id: user.id, max_amount: numAmount },
        { onConflict: "lot_id,user_id" }
      );

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage(
        `Your proxy bid of up to ${formatPrice(numAmount)} has been set. The auctioneer will auto-bid on your behalf when the lot goes live.`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Existing proxy bid display */}
      {existingProxyBid && status !== "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-gold-600/30 bg-gold-600/10 px-4 py-3">
          <svg className="h-4 w-4 flex-shrink-0 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-body text-sm text-gold-400">
            You have a proxy bid up to <strong>{formatPrice(existingProxyBid)}</strong>
          </span>
        </div>
      )}

      {/* Input */}
      <div>
        <label htmlFor="proxy-bid-amount" className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">
          Your Maximum Bid
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-platinum-500">$</span>
          <input
            id="proxy-bid-amount"
            type="number"
            min={minBid}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minBid)}
            className="w-full rounded-xl border border-obsidian-700 bg-obsidian-900 py-3 pl-7 pr-3 font-body text-platinum-200 placeholder:text-platinum-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
            aria-label="Enter your maximum proxy bid amount"
          />
        </div>
        <p className="mt-1.5 font-body text-xs text-platinum-500">
          Minimum: <span className="text-platinum-300">{formatPrice(minBid)}</span>
          {" · "}The system will never bid more than this amount on your behalf.
        </p>
      </div>

      {/* Status feedback */}
      {message && (
        <p
          className={`rounded-xl px-4 py-3 font-body text-sm ${
            status === "success"
              ? "border border-green-600/30 bg-green-600/10 text-green-400"
              : "border border-auction-live/30 bg-auction-live/10 text-auction-live"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading" || !amount}
        className="w-full rounded-xl bg-gold-500/20 border border-gold-500/40 py-3 font-body font-semibold text-gold-400 transition hover:bg-gold-500/30 disabled:opacity-40"
      >
        {status === "loading"
          ? "Placing pre-bid..."
          : existingProxyBid
          ? "Update My Pre-Bid"
          : "Set Pre-Bid →"}
      </button>
    </form>
  );
}
