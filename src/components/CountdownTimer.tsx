"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

interface CountdownTimerProps {
  liveEndAt: string | null;
  className?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean; // < 60s remaining
}

function computeTimeLeft(endAt: string | null): TimeLeft | null {
  if (!endAt) return null;
  const diff = Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000));
  if (diff <= 0) return null;

  return {
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    isUrgent: diff < 60,
  };
}

export function CountdownTimer({ liveEndAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => computeTimeLeft(liveEndAt));

  useEffect(() => {
    if (!liveEndAt) return;
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(liveEndAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [liveEndAt]);

  if (!timeLeft) {
    return (
      <div className={clsx("font-display text-sm text-platinum-500", className)}>
        Closing...
      </div>
    );
  }

  const { hours, minutes, seconds, isUrgent } = timeLeft;

  return (
    <div
      className={clsx(
        "flex items-center gap-1 font-mono text-2xl font-bold tabular-nums transition-colors",
        isUrgent ? "text-auction-live animate-pulse-live" : "text-gold-400",
        className
      )}
      role="timer"
      aria-label={`Time remaining: ${hours > 0 ? `${hours} hours ` : ""}${minutes} minutes ${seconds} seconds`}
      aria-live="polite"
    >
      {hours > 0 && (
        <>
          <span>{String(hours).padStart(2, "0")}</span>
          <span className="text-platinum-500 text-lg">h</span>
        </>
      )}
      <span>{String(minutes).padStart(2, "0")}</span>
      <span className="text-platinum-500 text-lg">m</span>
      <span>{String(seconds).padStart(2, "0")}</span>
      <span className="text-platinum-500 text-lg">s</span>
    </div>
  );
}
