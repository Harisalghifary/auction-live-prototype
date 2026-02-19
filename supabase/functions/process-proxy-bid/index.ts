/**
 * Supabase Edge Function: process-proxy-bid
 *
 * Triggered after a new bid is inserted (via Database Webhook).
 * Checks for competing proxy bids and auto-counters on behalf of the proxy bidder.
 *
 * Architecture: ARCHITECTURE.md — "Proxy Engine: Application Level"
 * This function runs with the SERVICE_ROLE key to bypass RLS.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Database Webhook payload from Supabase
    const { record } = body as {
      record: {
        id: string;
        lot_id: string;
        user_id: string;
        amount: number;
        is_proxy_bid: boolean;
      };
    };

    // Don't trigger proxy engine on proxy bids (prevents infinite loops)
    if (record.is_proxy_bid) {
      return new Response(
        JSON.stringify({ message: "Skipping proxy bid — already a proxy bid." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // bypasses RLS for proxy logic
    );

    // Call the SQL proxy engine function
    const { data, error } = await supabase.rpc("process_proxy_bid", {
      p_lot_id: record.lot_id,
      p_triggering_bid_amount: record.amount,
      p_triggering_user_id: record.user_id,
    });

    if (error) {
      console.error("[process-proxy-bid] RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data?.[0];

    if (result?.was_triggered) {
      console.log(`[process-proxy-bid] Proxy bid placed: $${result.new_bid_amount} for user ${result.proxy_user_id}`);
    } else {
      console.log("[process-proxy-bid] No competing proxy bid found.");
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[process-proxy-bid] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
