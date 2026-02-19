import Ably from "ably";

let ablyInstance: Ably.Realtime | null = null;

/**
 * Returns a singleton Ably Realtime client.
 * Uses the NEXT_PUBLIC_ABLY_API_KEY environment variable.
 */
export function getAblyClient(): Ably.Realtime {
  if (!ablyInstance) {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_API_KEY!;

    // The env var may be either a raw API key (appId:secret format)
    // or a JWT token. Detect by checking for the colon separator.
    const isApiKey = ablyKey.includes(":");

    ablyInstance = new Ably.Realtime(
      isApiKey
        ? { key: ablyKey, clientId: "auction-live-client" }
        : { token: ablyKey, clientId: "auction-live-client" }
    );
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
