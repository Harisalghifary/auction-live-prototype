/**
 * src/lib/email.ts
 * Resend email client + typed email sending functions.
 *
 * Emails sent:
 *  1. sendOutbidEmail    — when a bidder is outbid on a live lot
 *  2. sendWonEmail       — when a bidder wins a closed lot
 *  3. sendShippedEmail   — when an admin marks an order as shipped
 *
 * From address: onboarding@resend.dev works on Resend free tier.
 * Replace with your verified domain when ready (e.g. noreply@antigravity.auction).
 */

import { Resend } from "resend";
import { formatPrice } from "./bidUtils";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM   = "Anti-Gravity Auction <onboarding@resend.dev>";
const SITE   = "https://auction-live.vercel.app"; // update with your prod URL

// ─── 1. Outbid ───────────────────────────────────────────────────────────────

interface OutbidParams {
  to: string;
  lotTitle: string;
  lotId: string;
  newBid: number;
  minNextBid: number;
}

export async function sendOutbidEmail(params: OutbidParams) {
  const { to, lotTitle, lotId, newBid, minNextBid } = params;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been outbid on "${lotTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0d0d14;padding:32px;border-radius:16px">
        <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Anti-Gravity Auction</p>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#f1f5f9">You've been outbid!</h1>
        <p style="color:#94a3b8;margin:0 0 24px">Someone placed a higher bid of <strong style="color:#c9a227">${formatPrice(newBid)}</strong> on <strong style="color:#f1f5f9">${lotTitle}</strong>.</p>
        <p style="color:#94a3b8;margin:0 0 24px">The minimum next bid is <strong style="color:#f1f5f9">${formatPrice(minNextBid)}</strong>.</p>
        <a href="${SITE}/lot/${lotId}" style="display:inline-block;background:#c9a227;color:#0d0d14;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Place a Higher Bid →</a>
        <p style="margin:24px 0 0;font-size:11px;color:#475569">You received this because you placed a bid on this lot.</p>
      </div>
    `,
  });
}

// ─── 2. Won ───────────────────────────────────────────────────────────────────

interface WonParams {
  to: string;
  lotTitle: string;
  orderId: string;
  finalAmount: number;
  buyersPremium: number;
  totalDue: number;
}

export async function sendWonEmail(params: WonParams) {
  const { to, lotTitle, orderId, finalAmount, buyersPremium, totalDue } = params;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Congratulations! You won "${lotTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0d0d14;padding:32px;border-radius:16px">
        <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Anti-Gravity Auction</p>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#f1f5f9">🎉 Congratulations!</h1>
        <p style="color:#94a3b8;margin:0 0 24px">You won <strong style="color:#f1f5f9">${lotTitle}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #1e2030">Winning bid</td><td style="padding:8px 0;text-align:right;color:#f1f5f9;border-bottom:1px solid #1e2030">${formatPrice(finalAmount)}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #1e2030">Buyer's premium (20%)</td><td style="padding:8px 0;text-align:right;color:#f1f5f9;border-bottom:1px solid #1e2030">${formatPrice(buyersPremium)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#f1f5f9">Total Due</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#c9a227">${formatPrice(totalDue)}</td></tr>
        </table>
        <p style="color:#94a3b8;margin:0 0 24px">Please proceed to your order page to complete payment via bank transfer.</p>
        <a href="${SITE}/orders/${orderId}" style="display:inline-block;background:#c9a227;color:#0d0d14;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">View Payment Instructions →</a>
        <p style="margin:24px 0 0;font-size:11px;color:#475569">Payment must be received within 3 business days.</p>
      </div>
    `,
  });
}

// ─── 3. Shipped ───────────────────────────────────────────────────────────────

interface ShippedParams {
  to: string;
  lotTitle: string;
  orderId: string;
  courier: string;
  trackingId: string;
}

export async function sendShippedEmail(params: ShippedParams) {
  const { to, lotTitle, orderId, courier, trackingId } = params;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your item has been shipped — ${lotTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0d0d14;padding:32px;border-radius:16px">
        <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Anti-Gravity Auction</p>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#f1f5f9">📦 Your item is on the way!</h1>
        <p style="color:#94a3b8;margin:0 0 24px"><strong style="color:#f1f5f9">${lotTitle}</strong> has been shipped.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #1e2030">Courier</td><td style="padding:8px 0;text-align:right;color:#f1f5f9;border-bottom:1px solid #1e2030">${courier}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Tracking ID</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#c9a227;font-family:monospace">${trackingId}</td></tr>
        </table>
        <a href="${SITE}/orders/${orderId}" style="display:inline-block;background:#c9a227;color:#0d0d14;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Track Your Order →</a>
      </div>
    `,
  });
}
