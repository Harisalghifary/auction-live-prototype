import Ably from "ably";

let ablyInstance: Ably.Realtime | null = null;

/**
 * Returns a singleton Ably Realtime client.
 * Uses the NEXT_PUBLIC_ABLY_API_KEY environment variable.
 */
export function getAblyClient(): Ably.Realtime {
  if (!ablyInstance) {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;

    ablyInstance = new Ably.Realtime({
      // Prefer server-issued short-lived tokens via /api/ably-token.
      // Falls back to the static key/JWT only for local dev without a server.
      authUrl: "/api/ably-token",
      authMethod: "GET",
      // Fallback: if authUrl fails (e.g. unauthenticated), use the env var
      ...(ablyKey?.includes(":")
        ? { key: ablyKey }
        : ablyKey
        ? { token: ablyKey }
        : {}),
      clientId: "auction-live-client",
      autoConnect: true,
    });
  }
  return ablyInstance;
}

/**
 * Subscribe to a lot's real-time channel.
 * Channel name pattern: `lot:{lotId}`
 */
export function getLotChannel(lotId: string): Ably.RealtimeChannel {
  return getAblyClient().channels.get(`lot:${lotId}`);
}
