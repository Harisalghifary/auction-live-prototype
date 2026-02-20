/**
 * Supabase Edge Function: broadcast-bid
 *
 * Called via Database Webhook when a new row is INSERTed into `bids`.
 * 1. Broadcasts the bid to all connected Ably clients on the lot's channel.
 * 2. Sends an "outbid" email to the previous high bidder (if any).
 *
 * Channel format: `lot:{lot_id}`
 * Environment secrets required:
 *   ABLY_API_KEY       — server-side Ably key
 *   SUPABASE_URL       — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — for reading bids + auth.users
 *   RESEND_API_KEY     — for sending outbid emails
 */

import Ably from "https://esm.sh/ably@2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── 1. Broadcast via Ably ──────────────────────────────────────────────────
    const ably = new Ably.Rest(Deno.env.get("ABLY_API_KEY")!);
    const channel = ably.channels.get(`lot:${record.lot_id}`);

    await channel.publish("bid.new", {
      id: record.id,
      lot_id: record.lot_id,
      user_id: record.user_id,
      amount: record.amount,
      is_proxy_bid: record.is_proxy_bid,
      created_at: record.created_at,
    });

    console.log(`[broadcast-bid] Published bid $${record.amount} to lot:${record.lot_id}`);

    // ── 2. Outbid email to previous high bidder ────────────────────────────────
    try {
      // Find the previous highest bidder (the bid just before this one)
      const { data: prevBids } = await supabase
        .from("bids")
        .select("user_id, amount")
        .eq("lot_id", record.lot_id)
        .neq("user_id", record.user_id) // not the current bidder
        .order("amount", { ascending: false })
        .limit(1);

      const prevBidder = prevBids?.[0];

      if (prevBidder) {
        // Get lot title
        const { data: lot } = await supabase
          .from("lots")
          .select("id, title, starting_price")
          .eq("id", record.lot_id)
          .single();

        // Get outbid user's email
        const { data: authData } = await supabase.auth.admin.getUserById(prevBidder.user_id);
        const outbidEmail = authData?.user?.email;

        if (outbidEmail && lot) {
          // Calculate minimum next bid (simple 5% increment)
          const minNextBid = record.amount * 1.05;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Anti-Gravity Auction <onboarding@resend.dev>",
              to: outbidEmail,
              subject: `You've been outbid on "${lot.title}"`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0d0d14;padding:32px;border-radius:16px">
                  <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Anti-Gravity Auction</p>
                  <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#f1f5f9">You've been outbid!</h1>
                  <p style="color:#94a3b8;margin:0 0 24px">Someone placed a higher bid of <strong style="color:#c9a227">$${record.amount.toLocaleString()}</strong> on <strong style="color:#f1f5f9">${lot.title}</strong>.</p>
                  <p style="color:#94a3b8;margin:0 0 24px">The minimum next bid is <strong style="color:#f1f5f9">$${minNextBid.toFixed(2)}</strong>.</p>
                  <a href="${SUPABASE_URL.replace("supabase.co", "vercel.app").replace("https://kvuexwjppbxarukftvqo.", "https://auction-live.")}/lot/${lot.id}" style="display:inline-block;background:#c9a227;color:#0d0d14;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Place a Higher Bid →</a>
                </div>
              `,
            }),
          });

          console.log(`[broadcast-bid] Outbid email sent to ${outbidEmail}`);
        }
      }
    } catch (emailErr) {
      // Email failure is non-fatal — bid was already broadcast
      console.error("[broadcast-bid] Outbid email failed:", emailErr);
    }

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
