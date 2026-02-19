import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatPrice } from "@/lib/bidUtils";

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  none:     { label: "Not Started",       color: "text-platinum-400",   description: "You haven't begun KYC verification." },
  pending:  { label: "Pending Review",    color: "text-auction-pending", description: "Your submission is under review. We'll notify you soon." },
  approved: { label: "Verified ✓",        color: "text-green-400",       description: "You are a verified bidder. You can bid live." },
  rejected: { label: "Rejected",          color: "text-auction-live",    description: "Your KYC was rejected. Please resubmit." },
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, is_verified_bidder, is_admin, kyc_status, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const kyc_status = (profile?.kyc_status as string) ?? "none";
  const kycCfg = KYC_STATUS_CONFIG[kyc_status] ?? KYC_STATUS_CONFIG.none;

  // Bid history — last 20 bids with lot info
  const { data: bidHistory } = await supabase
    .from("bids")
    .select("id, amount, is_proxy_bid, created_at, lot_id, lots(id, title, status, current_price)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Orders (lots won) — user's own orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, lot_id, total_due, payment_status, tracking_id, courier, lots(id, title)")
    .eq("winner_id", user.id)
    .order("created_at", { ascending: false });


  // Proxy bids active
  const { data: proxyBids } = await supabase
    .from("proxy_bids")
    .select("id, max_amount, lot_id, lots(id, title, status)")
    .eq("user_id", user.id)
    .order("lot_id");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold text-platinum-200">My Profile</h1>

      {/* Account info */}
      <section className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/20 text-xl font-bold text-gold-400">
            {(user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <p className="font-body text-base font-semibold text-platinum-200">
              {profile?.username ?? user.email}
            </p>
            <p className="font-body text-xs text-platinum-500">{user.email}</p>
            {profile?.is_admin && (
              <span className="mt-1 inline-block rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 font-body text-[10px] text-gold-400">
                Admin
              </span>
            )}
          </div>
        </div>
      </section>

      {/* KYC status */}
      <section className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-1 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
              Bidder Verification
            </h2>
            <p className={`font-body text-sm font-semibold ${kycCfg.color}`}>{kycCfg.label}</p>
            <p className="mt-0.5 font-body text-xs text-platinum-500">{kycCfg.description}</p>
          </div>
          {kyc_status !== "approved" && (
            <Link
              href="/profile/verify"
              className="rounded-xl bg-gold-500 px-4 py-2 font-body text-sm font-semibold text-obsidian-950 transition hover:bg-gold-400"
            >
              {kyc_status === "none" ? "Get Verified" : "Resubmit"}
            </Link>
          )}
        </div>
      </section>

      {/* Proxy bids manager */}
      {(proxyBids?.length ?? 0) > 0 && (
        <section className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
          <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
            Active Proxy Bids
          </h2>
          <div className="flex flex-col gap-2">
            {proxyBids!.map((pb) => {
              const lot = pb.lots as unknown as { id: string; title: string; status: string } | null;
              return (
                <div key={pb.id} className="flex items-center justify-between rounded-xl border border-obsidian-700 bg-obsidian-900 px-4 py-2.5">
                  <div>
                    <Link href={`/lot/${pb.lot_id}`} className="font-body text-sm text-platinum-200 hover:text-gold-400 transition">
                      {lot?.title ?? pb.lot_id}
                    </Link>
                    <p className="font-body text-xs text-platinum-500">{lot?.status}</p>
                  </div>
                  <span className="font-display text-sm font-bold text-gold-400">
                    Max {formatPrice(pb.max_amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Orders (Lots Won) */}
      {(orders?.length ?? 0) > 0 && (
        <section className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
          <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
            My Orders
          </h2>
          <div className="flex flex-col gap-2">
            {orders!.map((order) => {
              const lot = order.lots as unknown as { id: string; title: string } | null;
              const isActionNeeded = order.payment_status === "pending_payment";
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between rounded-xl border border-gold-500/20 bg-gold-500/5 px-4 py-2.5 hover:bg-gold-500/10 transition"
                >
                  <div>
                    <p className="font-body text-sm text-platinum-200">{lot?.title ?? order.lot_id}</p>
                    <p className="font-body text-[10px] text-platinum-500">
                      {order.payment_status.replace(/_/g, " ")}
                      {order.tracking_id && ` · ${order.courier ?? ""} ${order.tracking_id}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-gold-400">
                      {formatPrice(order.total_due)}
                    </span>
                    {isActionNeeded && (
                      <span className="rounded-full bg-auction-pending/20 px-2 py-0.5 font-body text-[10px] font-bold text-auction-pending">
                        Pay Now
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Bid history */}
      <section className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
          Bid History
        </h2>
        {(bidHistory?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {bidHistory!.map((bid) => {
              const lot = bid.lots as unknown as { id: string; title: string; status: string; current_price: number } | null;
              const isHighBidder = lot?.current_price === bid.amount;
              return (
                <div key={bid.id} className="flex items-center justify-between rounded-xl border border-obsidian-700 bg-obsidian-900 px-4 py-2.5">
                  <div>
                    <Link href={`/lot/${bid.lot_id}`} className="font-body text-sm text-platinum-200 hover:text-gold-400 transition">
                      {lot?.title ?? bid.lot_id}
                    </Link>
                    <p className="font-body text-[10px] text-platinum-500">
                      {new Date(bid.created_at).toLocaleString()}
                      {bid.is_proxy_bid && " · auto"}
                      {isHighBidder && <span className="ml-1.5 text-gold-500">★ High Bidder</span>}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-platinum-200">
                    {formatPrice(bid.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center font-body text-sm text-platinum-500">
            No bids yet. <Link href="/" className="text-gold-400 hover:underline">Browse lots →</Link>
          </p>
        )}
      </section>

      {/* Admin shortcut */}
      {profile?.is_admin && (
        <div className="mt-6 text-center">
          <Link href="/admin" className="font-body text-sm text-gold-400 hover:underline">
            Go to Admin Panel →
          </Link>
        </div>
      )}
    </div>
  );
}
