"use client";

/**
 * YouTubePlayer — renders the YouTube IFrame Player in the live room.
 * Wraps the useYouTubePlayer hook and exposes timestamp to the parent
 * for stream sync functionality.
 */

import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
}

const PLAYER_CONTAINER_ID = "yt-player-container";

export function YouTubePlayer({ videoId, onTimeUpdate }: YouTubePlayerProps) {
  const { playerState, isReady } = useYouTubePlayer({
    videoId,
    containerId: PLAYER_CONTAINER_ID,
    onTimeUpdate,
  });

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-obsidian-900">
      {/* Aspect ratio wrapper — 16:9 */}
      <div className="relative aspect-video w-full">
        {/* Loading skeleton */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian-900">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-obsidian-700 border-t-gold-500" />
              <p className="font-body text-sm text-platinum-500">Connecting to stream…</p>
            </div>
          </div>
        )}

        {/* The actual YT IFrame is injected here by the API */}
        <div
          id={PLAYER_CONTAINER_ID}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Stream status bar */}
      <div className="flex items-center justify-between border-t border-obsidian-700 px-4 py-2">
        <div className="flex items-center gap-2">
          {playerState === "playing" ? (
            <span className="flex items-center gap-1.5 font-body text-xs text-auction-live">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-auction-live opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-auction-live" />
              </span>
              LIVE
            </span>
          ) : playerState === "paused" ? (
            <span className="font-body text-xs text-auction-pending">⏸ Paused</span>
          ) : playerState === "buffering" ? (
            <span className="font-body text-xs text-platinum-500 animate-pulse">⟳ Buffering…</span>
          ) : null}
        </div>
        <p className="font-body text-[10px] text-platinum-500">
          Anti-Gravity Auction Live Stream
        </p>
      </div>
    </div>
  );
}
