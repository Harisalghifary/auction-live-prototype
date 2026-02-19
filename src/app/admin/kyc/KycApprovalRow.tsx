"use client";

import { useState, useTransition } from "react";

interface ProfileRow {
  id: string;
  username: string | null;
  kyc_status: string;
  is_verified_bidder: boolean;
  created_at: string;
}

export function KycApprovalRow({ profile }: { profile: ProfileRow }) {
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const decide = (action: "approve" | "reject") => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/kyc/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setDecision(action === "approve" ? "approved" : "rejected");
      }
    });
  };

  if (decision) {
    return (
      <div className="flex items-center justify-between px-5 py-3 opacity-60">
        <p className="font-body text-sm text-platinum-200">{profile.username ?? "Anonymous"}</p>
        <span className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${
          decision === "approved" ? "bg-green-500/20 text-green-400" : "bg-auction-live/20 text-auction-live"
        }`}>
          {decision}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <p className="font-body text-sm font-medium text-platinum-200">
          {profile.username ?? "Anonymous"}
        </p>
        <p className="font-body text-xs text-platinum-500">
          {profile.id.slice(0, 8)}… · Submitted {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => decide("reject")}
          disabled={isPending}
          className="rounded-lg border border-auction-live/30 px-3 py-1.5 font-body text-xs text-auction-live transition hover:bg-auction-live/10 disabled:opacity-40"
        >
          Reject
        </button>
        <button
          onClick={() => decide("approve")}
          disabled={isPending}
          className="rounded-lg bg-green-600/20 border border-green-600/30 px-3 py-1.5 font-body text-xs text-green-400 transition hover:bg-green-600/30 disabled:opacity-40"
        >
          {isPending ? "…" : "Approve"}
        </button>
      </div>
    </div>
  );
}
