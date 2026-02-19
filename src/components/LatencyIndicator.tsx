"use client";

/**
 * LatencyIndicator — shows WebSocket connection quality in the live room.
 * Reuses the shared Ably client from src/lib/ably.ts.
 * Measures round-trip latency via Ably's server time() call every 5 seconds.
 */

import { useEffect, useState, useRef } from "react";
import { getAblyClient } from "@/lib/ably";

type Quality = "excellent" | "good" | "poor" | "offline";

const qualityConfig: Record<Quality, { label: string; color: string }> = {
  excellent: { label: "<100ms",  color: "text-green-400" },
  good:      { label: "100-300ms", color: "text-yellow-400" },
  poor:      { label: ">300ms",  color: "text-auction-live" },
  offline:   { label: "Offline", color: "text-platinum-500" },
};

function getQuality(latencyMs: number | null): Quality {
  if (latencyMs === null) return "offline";
  if (latencyMs < 100) return "excellent";
  if (latencyMs < 300) return "good";
  return "poor";
}

export function LatencyIndicator() {
  const [latency, setLatency] = useState<number | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const client = getAblyClient();

    client.connection.on("disconnected", () => setLatency(null));
    client.connection.on("failed", () => setLatency(null));

    const measureLatency = async () => {
      try {
        const start = performance.now();
        await client.time();
        setLatency(Math.round(performance.now() - start));
      } catch {
        setLatency(null);
      }
    };

    measureLatency();
    pingRef.current = setInterval(measureLatency, 5000);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, []);

  const quality = getQuality(latency);
  const cfg = qualityConfig[quality];
  const filledBars = quality === "excellent" ? 3 : quality === "good" ? 2 : quality === "poor" ? 1 : 0;

  return (
    <div
      className="flex items-center gap-2"
      title={`WebSocket latency: ${latency !== null ? `${latency}ms` : "not connected"}`}
      aria-label={`Connection quality: ${cfg.label}`}
    >
      {/* Signal bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all duration-500 ${
              bar <= filledBars ? cfg.color.replace("text-", "bg-") : "bg-obsidian-700"
            }`}
            style={{ height: `${bar * 4 + 2}px` }}
          />
        ))}
      </div>
      <span className={`font-body text-[10px] ${cfg.color}`}>
        {latency !== null ? `${latency}ms` : cfg.label}
      </span>
    </div>
  );
}
