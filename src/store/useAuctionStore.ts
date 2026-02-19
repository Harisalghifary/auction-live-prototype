/**
 * useAuctionStore — Global Zustand store for real-time auction state.
 * Manages the current lot's live bidding state across all components.
 */

import { create } from "zustand";
import { AuctionStatus, Bid, BidState } from "@/types/auction";

interface AuctionState {
  // Current lot state
  lotId: string | null;
  currentPrice: number;
  status: AuctionStatus;
  liveEndAt: string | null;
  highBidderId: string | null;

  // Bid feed
  bids: Bid[];

  // Current user's bid state
  bidState: BidState;
  bidError: string | null;

  // Actions
  setLot: (lotId: string, price: number, status: AuctionStatus, liveEndAt: string | null) => void;
  onNewBid: (bid: Bid) => void;
  setBidState: (state: BidState, error?: string) => void;
  setStatus: (status: AuctionStatus) => void;
  reset: () => void;
}

const initialState = {
  lotId: null,
  currentPrice: 0,
  status: "PRE_BID" as AuctionStatus,
  liveEndAt: null,
  highBidderId: null,
  bids: [] as Bid[],
  bidState: "idle" as BidState,
  bidError: null,
};

export const useAuctionStore = create<AuctionState>((set) => ({
  ...initialState,

  setLot: (lotId, price, status, liveEndAt) =>
    set({ lotId, currentPrice: price, status, liveEndAt }),

  onNewBid: (bid: Bid) =>
    set((state) => ({
      currentPrice: bid.amount,
      highBidderId: bid.user_id,
      bids: [bid, ...state.bids].slice(0, 50), // Keep last 50 bids in memory
    })),

  setBidState: (bidState, bidError?: string) =>
    set({ bidState, bidError: bidError ?? null }),

  setStatus: (status) => set({ status }),

  reset: () => set(initialState),
}));
