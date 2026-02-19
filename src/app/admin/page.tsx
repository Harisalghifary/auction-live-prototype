import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatPrice } from "@/lib/bidUtils";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Quick stats
  const [
    { count: totalLots },
    { count: liveLots },
    { count: pendingKyc },
    { count: totalBids },
  ] = await Promise.all([
    supabase.from("lots").select("*", { count: "exact", head: true }),
    supabase.from("lots").select("*", { count: "exact", head: true }).eq("status", "LIVE"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "pending"),
    supabase.from("bids").select("*", { count: "exact", head: true }),
  ]);

  // Recent bids
  const { data: recentBids } = await supabase
    .from("bids")
    .select("id, amount, created_at, lot_id, lots(title)")
    .order("created_at", { ascending: false })
    .limit(8);

  const stats = [
    { label: "Total Lots", value: totalLots ?? 0, href: "/admin/lots", color: "text-platinum-200" },
    { label: "Live Now", value: liveLots ?? 0, href: "/admin/lots", color: "text-auction-live" },
    { label: "KYC Pending", value: pendingKyc ?? 0, href: "/admin/kyc", color: "text-auction-pending" },
    { label: "Total Bids", value: totalBids ?? 0, href: "#", color: "text-gold-400" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-platinum-200">Dashboard</h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5 transition hover:border-obsidian-600">
            <p className="mb-1 font-body text-xs uppercase tracking-widest text-platinum-500">{s.label}</p>
            <p className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent bids */}
      <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800">
        <div className="flex items-center justify-between border-b border-obsidian-700 px-5 py-4">
          <h2 className="font-body text-sm font-semibold text-platinum-300">Recent Bids</h2>
        </div>
        <div className="divide-y divide-obsidian-700">
          {(recentBids ?? []).map((bid) => {
            const lot = bid.lots as unknown as { title: string } | null;
            return (
              <div key={bid.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm text-platinum-200 truncate max-w-[240px]">
                    {lot?.title ?? "Unknown lot"}
                  </p>
                  <p className="font-body text-xs text-platinum-500">
                    {new Date(bid.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-display text-base font-bold text-gold-400">
                  {formatPrice(bid.amount)}
                </span>
              </div>
            );
          })}
          {!recentBids?.length && (
            <p className="px-5 py-6 text-center font-body text-sm text-platinum-500">No bids yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
