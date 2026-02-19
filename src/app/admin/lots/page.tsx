import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { formatPrice } from "@/lib/bidUtils";

const STATUS_COLORS: Record<string, string> = {
  PRE_BID: "text-auction-pre border-auction-pre/30 bg-auction-pre/10",
  LIVE:    "text-auction-live border-auction-live/30 bg-auction-live/10",
  PAUSED:  "text-auction-pending border-auction-pending/30 bg-auction-pending/10",
  SOLD:    "text-platinum-400 border-obsidian-600 bg-obsidian-900",
};

export default async function AdminLotsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: lots } = await supabase
    .from("lots")
    .select("id, title, category, status, current_price, reserve_price, live_end_at, youtube_video_id")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-platinum-200">Lots</h1>
        <Link
          href="/admin/lots/new"
          className="rounded-xl bg-gold-500 px-4 py-2.5 font-body text-sm font-semibold text-obsidian-950 transition hover:bg-gold-400"
        >
          + New Lot
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-obsidian-700 bg-obsidian-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] font-body text-sm">
            <thead>
              <tr className="border-b border-obsidian-700 bg-obsidian-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-platinum-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-platinum-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-platinum-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-platinum-500">Current Bid</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-platinum-500">Reserve</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-platinum-500">Stream</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-platinum-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {(lots ?? []).map((lot) => {
                const statusCls = STATUS_COLORS[lot.status] ?? "";
                const reserveMet = lot.current_price >= lot.reserve_price;

                return (
                  <tr key={lot.id} className="group transition hover:bg-obsidian-700/20">
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate font-medium text-platinum-200">{lot.title}</p>
                    </td>
                    <td className="px-4 py-3 text-platinum-500">{lot.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base font-bold text-gold-400">
                      {formatPrice(lot.current_price)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${reserveMet ? "text-green-400" : "text-platinum-500"}`}>
                      {formatPrice(lot.reserve_price)}
                      {reserveMet && <span className="ml-1 text-[10px]">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lot.youtube_video_id ? (
                        <span className="font-body text-[10px] text-auction-live">● Linked</span>
                      ) : (
                        <span className="font-body text-[10px] text-platinum-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/lots/${lot.id}/edit`}
                        className="rounded-lg border border-obsidian-600 px-3 py-1 font-body text-xs text-platinum-300 transition hover:border-gold-500/40 hover:text-gold-400"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!lots?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-platinum-500">
                    No lots yet. <Link href="/admin/lots/new" className="text-gold-400 underline">Create one →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
