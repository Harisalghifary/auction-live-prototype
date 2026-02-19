import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { OrderSchema } from "@/types/auction";
import { formatPrice } from "@/lib/bidUtils";
import { BankTransferForm } from "./BankTransferForm";
import Link from "next/link";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STEPS = [
  { key: "pending_payment",   label: "Awaiting Payment",    icon: "🏦" },
  { key: "payment_submitted", label: "Payment Submitted",   icon: "📤" },
  { key: "paid",              label: "Payment Confirmed",   icon: "✅" },
  { key: "shipped",           label: "Shipped",             icon: "📦" },
  { key: "delivered",         label: "Delivered",           icon: "🎉" },
];

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/orders/${id}`);

  const { data: orderData, error } = await supabase
    .from("orders")
    .select("*, lots(id, title, image_urls, category)")
    .eq("id", id)
    .single();

  if (error || !orderData) notFound();

  const order = OrderSchema.parse(orderData);
  const lot = orderData.lots as { id: string; title: string; image_urls: string[] | null; category: string | null } | null;

  // Block if not the winner
  if (order.winner_id !== user.id) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) redirect("/profile");
  }

  const activeStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.payment_status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Back */}
      <Link href="/profile" className="mb-6 flex items-center gap-1.5 font-body text-xs text-platinum-500 hover:text-platinum-300 transition">
        ← Back to Profile
      </Link>

      <h1 className="mb-2 font-display text-3xl font-bold text-platinum-200">Your Order</h1>
      <p className="mb-8 font-body text-xs text-platinum-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>

      {/* Progress tracker */}
      <div className="mb-8 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
        <div className="flex items-start justify-between">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i < activeStepIndex;
            const isActive = i === activeStepIndex;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
                {/* Connector line */}
                <div className="flex w-full items-center">
                  {i > 0 && <div className={`h-0.5 flex-1 ${isDone || isActive ? "bg-gold-500" : "bg-obsidian-600"}`} />}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition ${
                    isActive ? "bg-gold-500 shadow-lg shadow-gold-500/20" : isDone ? "bg-gold-500/20" : "bg-obsidian-700"
                  }`}>
                    {step.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`h-0.5 flex-1 ${isDone ? "bg-gold-500" : "bg-obsidian-600"}`} />}
                </div>
                <p className={`font-body text-[9px] text-center leading-tight ${isActive ? "text-gold-400 font-semibold" : isDone ? "text-platinum-300" : "text-platinum-500"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lot summary */}
      <div className="mb-5 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
        <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">Won Lot</h2>
        <div className="flex items-start gap-4">
          {lot?.image_urls?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lot.image_urls[0]} alt={lot?.title} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
          )}
          <div>
            {lot?.category && <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-gold-500">{lot.category}</p>}
            <p className="font-display text-lg font-bold text-platinum-200">{lot?.title}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="mt-4 space-y-2 border-t border-obsidian-700 pt-4">
          <div className="flex justify-between font-body text-sm">
            <span className="text-platinum-500">Winning bid</span>
            <span className="text-platinum-200">{formatPrice(order.final_amount)}</span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-platinum-500">Buyer&apos;s premium (20%)</span>
            <span className="text-platinum-200">{formatPrice(order.buyers_premium)}</span>
          </div>
          <div className="flex justify-between border-t border-obsidian-700 pt-2 font-body text-base font-bold">
            <span className="text-platinum-200">Total Due</span>
            <span className="text-gold-400">{formatPrice(order.total_due)}</span>
          </div>
        </div>
      </div>

      {/* Bank transfer instructions (shown until paid) */}
      {["pending_payment", "payment_submitted"].includes(order.payment_status) && (
        <div className="mb-5 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5">
          <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-gold-400">Payment Instructions</h2>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-platinum-500">Bank</span>
              <span className="font-semibold text-platinum-200">Bank Central Asia (BCA)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-platinum-500">Account No.</span>
              <span className="font-semibold text-platinum-200">1234-5678-90</span>
            </div>
            <div className="flex justify-between">
              <span className="text-platinum-500">Account Name</span>
              <span className="font-semibold text-platinum-200">PT Anti-Gravity Auction</span>
            </div>
            <div className="flex justify-between">
              <span className="text-platinum-500">Amount</span>
              <span className="font-bold text-gold-400">{formatPrice(order.total_due)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-platinum-500">Reference</span>
              <span className="font-mono font-semibold text-platinum-200 text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <p className="mt-3 font-body text-xs text-platinum-500">
            Use the reference code above in your transfer description. After payment, fill in your transfer details below.
          </p>
        </div>
      )}

      {/* Buyer: submit bank reference */}
      {["pending_payment", "payment_submitted"].includes(order.payment_status) && order.winner_id === user.id && (
        <BankTransferForm
          orderId={order.id}
          existingReference={order.bank_reference}
          existingNotes={order.payment_notes}
          isSubmitted={order.payment_status === "payment_submitted"}
        />
      )}

      {/* Tracking info (shown once shipped) */}
      {["shipped", "delivered"].includes(order.payment_status) && (
        <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
          <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">Shipment Tracking</h2>
          <div className="space-y-2 font-body text-sm">
            {order.courier && (
              <div className="flex justify-between">
                <span className="text-platinum-500">Courier</span>
                <span className="font-semibold text-platinum-200">{order.courier}</span>
              </div>
            )}
            {order.tracking_id && (
              <div className="flex justify-between">
                <span className="text-platinum-500">Tracking ID</span>
                <span className="font-mono font-bold text-gold-400">{order.tracking_id}</span>
              </div>
            )}
            {order.shipped_at && (
              <div className="flex justify-between">
                <span className="text-platinum-500">Shipped</span>
                <span className="text-platinum-200">{new Date(order.shipped_at).toLocaleDateString()}</span>
              </div>
            )}
            {order.delivered_at && (
              <div className="flex justify-between">
                <span className="text-platinum-500">Delivered</span>
                <span className="text-platinum-200">{new Date(order.delivered_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
