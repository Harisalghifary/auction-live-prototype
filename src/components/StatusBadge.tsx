import { AuctionStatus } from "@/types/auction";
import { clsx } from "clsx";

interface StatusBadgeProps {
  status: AuctionStatus;
  className?: string;
}

const CONFIG: Record<AuctionStatus, { label: string; className: string }> = {
  LIVE: {
    label: "● LIVE",
    className: "bg-auction-live/20 text-auction-live border-auction-live/40 animate-pulse-live",
  },
  PRE_BID: {
    label: "PRE-BID",
    className: "bg-auction-pre/15 text-auction-pre border-auction-pre/30",
  },
  PAUSED: {
    label: "⏸ PAUSED",
    className: "bg-auction-pending/15 text-auction-pending border-auction-pending/30",
  },
  SOLD: {
    label: "SOLD",
    className: "bg-auction-sold/15 text-auction-sold border-platinum-500/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: statusClass } = CONFIG[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
        statusClass,
        className
      )}
    >
      {label}
    </span>
  );
}
