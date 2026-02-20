import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatPrice } from "@/lib/bidUtils";
import { AdminOrderForm } from "./AdminOrderForm";
import Link from "next/link";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STEPS = [
  "pending_payment",
  "payment_submitted",
  "paid",
  "shipped",
  "delivered",
];

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // 1. Fetch order + lot
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, lots(id, title, image_urls)")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  // 2. Fetch winner profile separately to avoid join issues
  const { data: winner } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", order.winner_id)
    .single();

  const lot = order.lots as { id: string; title: string; image_urls: string[] | null } | null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/orders" className="font-body text-xs text-platinum-500 hover:text-platinum-300">← Orders</Link>
        <span className="text-platinum-500">/</span>
        <h1 className="font-display text-xl font-bold text-platinum-200 truncate">{lot?.title}</h1>
      </div>

      {/* Summary */}
      <div className="mb-5 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
        <div className="grid grid-cols-2 gap-3 font-body text-sm">
          <div>
            <p className="text-xs text-platinum-500 uppercase tracking-widest">Order ID</p>
            <p className="font-mono text-platinum-200">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-platinum-500 uppercase tracking-widest">Winner</p>
            <p className="text-platinum-200">{winner?.username ?? winner?.id?.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-xs text-platinum-500 uppercase tracking-widest">Winning Bid</p>
            <p className="text-platinum-200">{formatPrice(order.final_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-platinum-500 uppercase tracking-widest">Total Due</p>
            <p className="font-bold text-gold-400">{formatPrice(order.total_due)}</p>
          </div>
          {order.bank_reference && (
            <div className="col-span-2">
              <p className="text-xs text-platinum-500 uppercase tracking-widest">Bank Reference</p>
              <p className="font-mono text-platinum-200">{order.bank_reference}</p>
            </div>
          )}
          {order.payment_notes && (
            <div className="col-span-2">
              <p className="text-xs text-platinum-500 uppercase tracking-widest">Winner Notes</p>
              <p className="text-platinum-200 text-xs">{order.payment_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin update form */}
      <AdminOrderForm
        orderId={order.id}
        currentStatus={order.payment_status}
        currentTrackingId={order.tracking_id}
        currentCourier={order.courier}
        currentAdminNotes={order.admin_notes}
        statusSteps={STATUS_STEPS}
      />
    </div>
  );
}
