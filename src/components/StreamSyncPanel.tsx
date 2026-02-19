"use client";

/**
 * StreamSyncPanel — lets the auctioneer or admin manually sync the
 * stream offset if there is viewer lag. Stores the offset (in seconds)
 * so all clients display timestamps relative to the stream rather than
 * wall clock.
 *
 * Also shows the current stream timestamp from the YouTube player.
 */

import { useState } from "react";

interface StreamSyncPanelProps {
  /** Current stream playback time in seconds (from useYouTubePlayer) */
  streamCurrentTime: number;
  /** Known bid timestamp (seconds since stream start) to validate sync */
  onOffsetChange?: (offsetSeconds: number) => void;
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function StreamSyncPanel({ streamCurrentTime, onOffsetChange }: StreamSyncPanelProps) {
  const [offset, setOffset] = useState(0);
  const [inputVal, setInputVal] = useState("0");
  const [synced, setSynced] = useState(false);

  const handleApply = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed)) {
      setOffset(parsed);
      onOffsetChange?.(parsed);
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
    }
  };

  // Adjusted timestamp = stream time + offset
  const adjustedTime = streamCurrentTime + offset;

  return (
    <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
      <h4 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
        Stream Sync
      </h4>

      {/* Stream clock */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-xs text-platinum-500">Stream Time</span>
        <span className="font-display text-sm font-bold text-platinum-200 tabular-nums">
          {formatSeconds(streamCurrentTime)}
        </span>
      </div>

      {/* Offset control */}
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="stream-offset" className="font-body text-xs text-platinum-500 whitespace-nowrap">
          Offset (s)
        </label>
        <input
          id="stream-offset"
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="w-20 rounded-lg border border-obsidian-700 bg-obsidian-800 px-2 py-1.5 font-body text-xs text-platinum-200 focus:border-gold-500 focus:outline-none tabular-nums"
          step={1}
        />
        <button
          onClick={handleApply}
          className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition ${
            synced
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : "bg-obsidian-700 text-platinum-300 hover:bg-obsidian-600"
          }`}
        >
          {synced ? "✓ Applied" : "Apply"}
        </button>
      </div>

      {/* Adjusted time */}
      {offset !== 0 && (
        <div className="flex items-center justify-between border-t border-obsidian-700 pt-2">
          <span className="font-body text-xs text-platinum-500">Adjusted Time</span>
          <span className="font-display text-sm font-bold text-gold-400 tabular-nums">
            {formatSeconds(adjustedTime)}
          </span>
        </div>
      )}
    </div>
  );
}
