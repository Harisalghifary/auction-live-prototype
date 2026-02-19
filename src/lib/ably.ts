import Ably from "ably";

let ablyInstance: Ably.Realtime | null = null;

/**
 * Returns a singleton Ably Realtime client.
 * Uses the NEXT_PUBLIC_ABLY_API_KEY environment variable.
 */
export function getAblyClient(): Ably.Realtime {
  if (!ablyInstance) {
    ablyInstance = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
      clientId: "auction-live-client",
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
