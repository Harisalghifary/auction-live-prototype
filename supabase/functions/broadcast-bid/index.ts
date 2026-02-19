/**
 * Supabase Edge Function: broadcast-bid
 *
 * Called via Database Webhook when a new row is INSERTed into `bids`.
 * Broadcasts the bid to all connected Ably clients on the lot's channel.
 *
 * Channel format: `lot:{lot_id}`
 * Events:
 *   - `bid.new`      → { id, lot_id, user_id, amount, is_proxy_bid, created_at }
 *   - `lot.status`   → emitted when lot status changes (handled in a separate trigger)
 *
 * Architecture: ARCHITECTURE.md — "Real-time: Ably broadcast from Edge Function"
 */

import Ably from "https://esm.sh/ably@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { record, table } = body as {
      table: string;
      record: {
        id: string;
        lot_id: string;
        user_id: string;
        amount: number;
        is_proxy_bid: boolean;
        created_at: string;
      };
    };

    if (table !== "bids") {
      return new Response(
        JSON.stringify({ error: "Unexpected table", table }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Ably with the server-side API key (full access)
    const ably = new Ably.Rest(Deno.env.get("ABLY_API_KEY")!);
    const channel = ably.channels.get(`lot:${record.lot_id}`);

    // Broadcast bid to all subscribers
    await channel.publish("bid.new", {
      id: record.id,
      lot_id: record.lot_id,
      user_id: record.user_id,
      amount: record.amount,
      is_proxy_bid: record.is_proxy_bid,
      created_at: record.created_at,
    });

    console.log(
      `[broadcast-bid] Published bid $${record.amount} to lot:${record.lot_id}`
    );

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[broadcast-bid] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
