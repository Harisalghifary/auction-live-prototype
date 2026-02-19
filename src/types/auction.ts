// Centralized Zod schemas and inferred TypeScript types for the auction domain.
// These are the source of truth for all data shapes.

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const AuctionStatusSchema = z.enum(["PRE_BID", "LIVE", "SOLD", "PAUSED"]);
export type AuctionStatus = z.infer<typeof AuctionStatusSchema>;

export const BidErrorCodeSchema = z.enum([
  "BID_TOO_LOW",
  "INSUFFICIENT_FUNDS",
  "AUCTION_PAUSED",
  "EXPIRED_SESSION",
  "NOT_VERIFIED",
]);
export type BidErrorCode = z.infer<typeof BidErrorCodeSchema>;

// ─── Database Row Types ───────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(30).nullable(),
  is_verified_bidder: z.boolean().default(false),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const LotSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  starting_price: z.number().nonnegative(),
  current_price: z.number().nonnegative(),
  reserve_price: z.number().nonnegative(),
  status: AuctionStatusSchema,
  live_end_at: z.string().datetime({ offset: true }).nullable(),
  image_urls: z.array(z.string().url()).nullable(),
  youtube_video_id: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
});
export type Lot = z.infer<typeof LotSchema>;

export const BidSchema = z.object({
  id: z.string().uuid(),
  lot_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  is_proxy_bid: z.boolean().default(false),
  created_at: z.string().datetime({ offset: true }),
});
export type Bid = z.infer<typeof BidSchema>;

export const ProxyBidSchema = z.object({
  id: z.string().uuid(),
  lot_id: z.string().uuid(),
  user_id: z.string().uuid(),
  max_amount: z.number().positive(),
});
export type ProxyBid = z.infer<typeof ProxyBidSchema>;

export const PaymentStatusSchema = z.enum([
  "pending_payment",
  "payment_submitted",
  "paid",
  "shipped",
  "delivered",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  lot_id: z.string().uuid(),
  winner_id: z.string().uuid(),
  final_amount: z.number(),
  buyers_premium: z.number(),
  total_due: z.number(),
  payment_status: PaymentStatusSchema,
  bank_reference: z.string().nullable(),
  payment_notes: z.string().nullable(),
  tracking_id: z.string().nullable(),
  courier: z.string().nullable(),
  admin_notes: z.string().nullable(),
  paid_at: z.string().datetime({ offset: true }).nullable(),
  shipped_at: z.string().datetime({ offset: true }).nullable(),
  delivered_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type Order = z.infer<typeof OrderSchema>;

// ─── API Request Schemas ──────────────────────────────────────────────────────

export const PlaceBidRequestSchema = z.object({
  lot_id: z.string().uuid(),
  amount: z.number().positive(),
});
export type PlaceBidRequest = z.infer<typeof PlaceBidRequestSchema>;

export const PlaceProxyBidRequestSchema = z.object({
  lot_id: z.string().uuid(),
  max_amount: z.number().positive(),
});
export type PlaceProxyBidRequest = z.infer<typeof PlaceProxyBidRequestSchema>;

// ─── UI State Types ───────────────────────────────────────────────────────────

export type BidState = "idle" | "pending" | "high_bidder" | "outbid" | "error";

export interface BidError {
  code: BidErrorCode;
  message: string;
}
