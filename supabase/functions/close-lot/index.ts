/**
 * Supabase Edge Function: close-lot
 *
 * Closes all LIVE lots whose live_end_at has passed.
 * Intended to be called by the Supabase pg_cron scheduler every 15 seconds
 * OR triggered manually from the Admin Panel.
 *
 * After closing:
 *  1. Broadcasts lot.status event to Ably so clients update instantly.
 *  2. Sends a "won" email to the winner via Resend.
 *
 * Environment secrets required:
 *   ABLY_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Ably from "https://esm.sh/ably@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = "https://auction-live.vercel.app"; // TODO: update to your prod domain

async function sendWonEmail(opts: {
  to: string;
  lotTitle: string;
  orderId: string;
  finalAmount: number;
  buyersPremium: number;
  totalDue: number;
}) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Anti-Gravity Auction <onboarding@resend.dev>",
      to: opts.to,
      subject: `Congratulations! You won "${opts.lotTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0d0d14;padding:32px;border-radius:16px">
          <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Anti-Gravity Auction</p>
          <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#f1f5f9">🎉 Congratulations!</h1>
          <p style="color:#94a3b8;margin:0 0 24px">You won <strong style="color:#f1f5f9">${opts.lotTitle}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #1e2030">Winning bid</td><td style="padding:8px 0;text-align:right;color:#f1f5f9;border-bottom:1px solid #1e2030">$${opts.finalAmount.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #1e2030">Buyer's premium (20%)</td><td style="padding:8px 0;text-align:right;color:#f1f5f9;border-bottom:1px solid #1e2030">$${opts.buyersPremium.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;color:#f1f5f9">Total Due</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#c9a227">$${opts.totalDue.toLocaleString()}</td></tr>
          </table>
          <p style="color:#94a3b8;margin:0 0 24px">Please complete payment via bank transfer within 3 business days.</p>
          <a href="${SITE_URL}/orders/${opts.orderId}" style="display:inline-block;background:#c9a227;color:#0d0d14;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">View Payment Instructions →</a>
        </div>
      `,
    }),
  });
}

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
      // Call the SQL close_lot function (handles race conditions + creates order)
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

      // Broadcast status change to all live room clients
      const channel = ably.channels.get(`lot:${lot.id}`);
      await channel.publish("lot.status", {
        lot_id: lot.id,
        status: result.outcome === "sold" ? "SOLD" : "PAUSED",
        final_price: result.final_price,
      });

      // Send "won" email to the winner
      if (result.outcome === "sold" && result.winner_id) {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(result.winner_id);
          const winnerEmail = authData?.user?.email;

          if (winnerEmail) {
            // Fetch the order that was just created
            const { data: order } = await supabase
              .from("orders")
              .select("id, final_amount, buyers_premium, total_due")
              .eq("lot_id", lot.id)
              .single();

            if (order) {
              await sendWonEmail({
                to: winnerEmail,
                lotTitle: lot.title,
                orderId: order.id,
                finalAmount: order.final_amount,
                buyersPremium: order.buyers_premium,
                totalDue: order.total_due,
              });
              console.log(`[close-lot] Won email sent to ${winnerEmail} for lot ${lot.id}`);
            }
          }
        } catch (emailErr) {
          // Email failure is non-fatal
          console.error(`[close-lot] Won email failed for lot ${lot.id}:`, emailErr);
        }
      }
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
