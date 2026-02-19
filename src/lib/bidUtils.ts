/**
 * bidUtils.ts — Domain-specific bid logic.
 * All rules are sourced from AI_INSTRUCTIONS.md § 4.
 *
 * Bid Increments:
 *  $0 - $500    → $25
 *  $500 - $2000 → $100
 *  $2000+       → $250
 *
 * Anti-Sniping: handled at DB level via trigger (see SCHEMA.sql).
 */

import { BidError } from "@/types/auction";

/**
 * Returns the required bid increment for a given current price.
 */
export function getBidIncrement(currentPrice: number): number {
  if (currentPrice < 500) return 25;
  if (currentPrice < 2000) return 100;
  return 250;
}

/**
 * Returns the minimum valid bid amount given the current price.
 */
export function getMinimumBid(currentPrice: number): number {
  return currentPrice + getBidIncrement(currentPrice);
}

/**
 * Validates a proposed bid amount against the current price.
 * Returns null if valid, or a BidError if invalid.
 */
export function validateBidAmount(
  proposedBid: number,
  currentPrice: number
): BidError | null {
  const minBid = getMinimumBid(currentPrice);

  if (proposedBid < minBid) {
    return {
      code: "BID_TOO_LOW",
      message: `Minimum bid is $${minBid.toLocaleString()}. Your bid: $${proposedBid.toLocaleString()}.`,
    };
  }

  return null;
}

/**
 * Applies Buyer's Premium (20%) to a hammer price per KNOWLEDGE.md § 3.
 */
export function applyBuyersPremium(hammerPrice: number): number {
  return hammerPrice * 1.2;
}

/**
 * Formats a price as USD currency string.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Returns a human-readable error message for a BidErrorCode.
 */
export function getBidErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    BID_TOO_LOW: "Your bid is too low. Please increase your amount.",
    INSUFFICIENT_FUNDS: "Insufficient funds. Please add funds to your account.",
    AUCTION_PAUSED: "The auction is currently paused. Please wait.",
    EXPIRED_SESSION: "Your session has expired. Please log in again.",
    NOT_VERIFIED: "You must verify your account before bidding.",
  };
  return messages[code] ?? "An unexpected error occurred.";
}
