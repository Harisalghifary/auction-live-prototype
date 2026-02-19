import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatPrice } from "@/lib/bidUtils";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  pending_payment:   "bg-platinum-500/10 text-platinum-400",
  payment_submitted: "bg-auction-pending/10 text-auction-pending",
  paid:              "bg-green-500/10 text-green-400",
  shipped:           "bg-blue-500/10 text-blue-400",
  delivered:         "bg-obsidian-600 text-platinum-300",
};

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, lots(id, title), profiles!winner_id(username)")
    .order("created_at", { ascending: false });

  const pendingCount = orders?.filter((o) => o.payment_status === "payment_submitted").length ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-platinum-200">Orders</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-auction-pending/20 px-3 py-1 font-body text-xs font-bold text-auction-pending">
            {pendingCount} payment{pendingCount > 1 ? "s" : ""} to confirm
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-obsidian-700 bg-obsidian-800">
        {orders?.length ? (
          <div className="divide-y divide-obsidian-700">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 font-body text-[10px] font-semibold uppercase tracking-widest text-platinum-500">
              <span>Lot / Winner</span>
              <span className="text-right">Total Due</span>
              <span className="text-right">Status</span>
              <span className="text-right">Action</span>
            </div>

            {orders.map((order) => {
              const lot = order.lots as { id: string; title: string } | null;
              const winner = order.profiles as { username: string | null } | null;
              return (
                <div key={order.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5">
                  <div>
                    <p className="font-body text-sm text-platinum-200 truncate max-w-[220px]">{lot?.title ?? order.lot_id}</p>
                    <p className="font-body text-xs text-platinum-500">{winner?.username ?? order.winner_id.slice(0, 8)}</p>
                    {order.bank_reference && (
                      <p className="font-mono text-[10px] text-platinum-400 mt-0.5">Ref: {order.bank_reference}</p>
                    )}
                  </div>

                  <span className="font-display text-sm font-bold text-gold-400 text-right">
                    {formatPrice(order.total_due)}
                  </span>

                  <span className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold whitespace-nowrap ${STATUS_COLOR[order.payment_status] ?? ""}`}>
                    {order.payment_status.replace(/_/g, " ")}
                  </span>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded-lg border border-obsidian-600 px-3 py-1 font-body text-xs text-platinum-300 transition hover:border-gold-500 hover:text-gold-400"
                  >
                    Manage →
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-10 text-center font-body text-sm text-platinum-500">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
