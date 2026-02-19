"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface AdminOrderFormProps {
  orderId: string;
  currentStatus: string;
  currentTrackingId: string | null;
  currentCourier: string | null;
  currentAdminNotes: string | null;
  statusSteps: string[];
}

export function AdminOrderForm({
  orderId,
  currentStatus,
  currentTrackingId,
  currentCourier,
  currentAdminNotes,
  statusSteps,
}: AdminOrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [trackingId, setTrackingId] = useState(currentTrackingId ?? "");
  const [courier, setCourier] = useState(currentCourier ?? "");
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: status,
          tracking_id: trackingId || null,
          courier: courier || null,
          admin_notes: adminNotes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  const inputCls = "w-full rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2.5 font-body text-sm text-platinum-200 focus:border-gold-500 focus:outline-none";
  const labelCls = "mb-1.5 block font-body text-xs font-semibold uppercase tracking-widest text-platinum-500";

  return (
    <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
      <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">Update Order</h2>

      {error && (
        <div className="mb-3 rounded-xl border border-auction-live/30 bg-auction-live/10 p-3 font-body text-xs text-auction-live">{error}</div>
      )}
      {saved && (
        <div className="mb-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3 font-body text-xs text-green-400">✓ Saved successfully</div>
      )}

      <div className="flex flex-col gap-4">
        {/* Status */}
        <div>
          <label className={labelCls} htmlFor="order-status">Payment Status</label>
          <select id="order-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusSteps.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Courier + Tracking (shown when shipping info is relevant) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="courier">Courier</label>
            <input id="courier" className={inputCls} placeholder="e.g. JNE, J&T, SiCepat" value={courier} onChange={(e) => setCourier(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tracking">Tracking ID</label>
            <input id="tracking" className={inputCls} placeholder="e.g. JNE1234567890" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
          </div>
        </div>

        {/* Admin notes */}
        <div>
          <label className={labelCls} htmlFor="admin-notes">Admin Notes</label>
          <textarea id="admin-notes" rows={2} className={`${inputCls} resize-none`} placeholder="Internal notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl bg-gold-500 py-3 font-body text-sm font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
