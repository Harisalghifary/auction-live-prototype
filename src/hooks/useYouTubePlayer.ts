"use client";

/**
 * useYouTubePlayer — wraps the YouTube IFrame Player API.
 *
 * Loads the YT script once (singleton), then exposes player state,
 * current stream timestamp, and control methods.
 *
 * Docs: https://developers.google.com/youtube/iframe_api_reference
 */

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type PlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued";

const YT_STATE_MAP: Record<number, PlayerState> = {
  [-1]: "unstarted",
  [0]: "ended",
  [1]: "playing",
  [2]: "paused",
  [3]: "buffering",
  [5]: "cued",
};

let ytApiLoaded = false;
let ytApiLoading = false;
const ytReadyCallbacks: Array<() => void> = [];

function loadYTApi(onReady: () => void) {
  if (ytApiLoaded) { onReady(); return; }
  ytReadyCallbacks.push(onReady);
  if (ytApiLoading) return;

  ytApiLoading = true;
  const existingCb = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiLoading = false;
    ytReadyCallbacks.forEach((cb) => cb());
    ytReadyCallbacks.length = 0;
    if (existingCb) existingCb();
  };

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

interface UseYouTubePlayerOptions {
  videoId: string;
  containerId: string;
  /** Called whenever the player current time changes (throttled ~1s) */
  onTimeUpdate?: (currentTime: number) => void;
}

export function useYouTubePlayer({
  videoId,
  containerId,
  onTimeUpdate,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YT.Player | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("unstarted");
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const t = playerRef.current.getCurrentTime?.() ?? 0;
        setCurrentTime(t);
        onTimeUpdate?.(t);
      }
    }, 1000);
  }, [onTimeUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadYTApi(() => {
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (event: YT.OnStateChangeEvent) => {
            const state = YT_STATE_MAP[event.data] ?? "unstarted";
            setPlayerState(state);
            if (state === "playing") startPolling();
            else stopPolling();
          },
        },
      });
    });

    return () => {
      stopPolling();
      playerRef.current?.destroy();
    };
  }, [videoId, containerId, startPolling, stopPolling]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  return { playerState, currentTime, isReady, seekTo };
}
