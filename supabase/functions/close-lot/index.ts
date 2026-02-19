/**
 * Supabase Edge Function: close-lot
 *
 * Closes all LIVE lots whose live_end_at has passed.
 * Intended to be called by the Supabase pg_cron scheduler every 15 seconds
 * OR triggered manually from the Admin Panel.
 *
 * After closing, broadcasts lot.status event to Ably so clients update instantly.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find all LIVE lots whose timer has expired
    const { data: expiredLots, error } = await supabase
      .from("lots")
      .select("id, title")
      .eq("status", "LIVE")
      .lt("live_end_at", new Date().toISOString());

    if (error) throw error;
    if (!expiredLots || expiredLots.length === 0) {
      return new Response(
        JSON.stringify({ message: "No lots to close." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ably = new Ably.Rest(Deno.env.get("ABLY_API_KEY")!);
    const results = [];

    for (const lot of expiredLots) {
      // Call the SQL close_lot function (handles race conditions safely)
      const { data: result, error: rpcError } = await supabase.rpc("close_lot", {
        p_lot_id: lot.id,
      });

      if (rpcError) {
        console.error(`[close-lot] RPC error for ${lot.id}:`, rpcError);
        results.push({ id: lot.id, error: rpcError.message });
        continue;
      }

      console.log(`[close-lot] ${lot.title}: ${JSON.stringify(result)}`);
      results.push({ id: lot.id, ...result });

      // Broadcast status change to Ably so all live room clients update instantly
      const channel = ably.channels.get(`lot:${lot.id}`);
      await channel.publish("lot.status", {
        lot_id: lot.id,
        status: result.outcome === "sold" ? "SOLD" : "PAUSED",
        final_price: result.final_price,
      });
    }

    return new Response(
      JSON.stringify({ success: true, closed: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[close-lot] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
