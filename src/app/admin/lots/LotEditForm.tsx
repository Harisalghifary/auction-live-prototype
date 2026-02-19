"use client";

/**
 * LotEditForm — shared form for creating and editing auction lots.
 * Used by /admin/lots/new and /admin/lots/[id]/edit.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const STATUSES = ["PRE_BID", "LIVE", "PAUSED", "SOLD"] as const;

interface LotFormData {
  title: string;
  description: string;
  category: string;
  starting_price: number;
  reserve_price: number;
  status: string;
  youtube_video_id: string;
  live_end_at: string;
}

interface LotEditFormProps {
  lotId?: string;
  initial?: Partial<LotFormData>;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  starting_price: z.number().positive("Must be positive"),
  reserve_price: z.number().positive("Must be positive"),
});

export function LotEditForm({ lotId, initial }: LotEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [form, setForm] = useState<LotFormData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    starting_price: initial?.starting_price ?? 0,
    reserve_price: initial?.reserve_price ?? 0,
    status: initial?.status ?? "PRE_BID",
    youtube_video_id: initial?.youtube_video_id ?? "",
    live_end_at: initial?.live_end_at
      ? new Date(initial.live_end_at).toISOString().slice(0, 16)
      : "",
  });

  const update = (key: keyof LotFormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const parsed = formSchema.safeParse({
      title: form.title,
      starting_price: form.starting_price,
      reserve_price: form.reserve_price,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const endpoint = lotId ? `/api/admin/lots/${lotId}` : "/api/admin/lots";
      const method = lotId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          live_end_at: form.live_end_at ? new Date(form.live_end_at).toISOString() : null,
          youtube_video_id: form.youtube_video_id || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(body.error ?? "Something went wrong.");
        return;
      }

      router.push("/admin/lots");
      router.refresh();
    });
  };

  const inputCls = "w-full rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2.5 font-body text-sm text-platinum-200 focus:border-gold-500 focus:outline-none";
  const labelCls = "mb-1.5 block font-body text-xs font-semibold uppercase tracking-widest text-platinum-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {serverError && (
        <div className="rounded-xl border border-auction-live/30 bg-auction-live/10 p-3 font-body text-sm text-auction-live">
          {serverError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className={labelCls} htmlFor="lot-title">Title *</label>
        <input id="lot-title" className={inputCls} value={form.title} onChange={(e) => update("title", e.target.value)} />
        {errors.title && <p className="mt-1 font-body text-xs text-auction-live">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelCls} htmlFor="lot-desc">Description</label>
        <textarea id="lot-desc" rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="lot-category">Category</label>
          <input id="lot-category" className={inputCls} value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="e.g. Horology" />
        </div>
        <div>
          <label className={labelCls} htmlFor="lot-status">Status</label>
          <select id="lot-status" className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="lot-start">Starting Price ($) *</label>
          <input id="lot-start" type="number" min={0} step={0.01} className={inputCls} value={form.starting_price} onChange={(e) => update("starting_price", parseFloat(e.target.value))} />
          {errors.starting_price && <p className="mt-1 font-body text-xs text-auction-live">{errors.starting_price}</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="lot-reserve">Reserve Price ($) *</label>
          <input id="lot-reserve" type="number" min={0} step={0.01} className={inputCls} value={form.reserve_price} onChange={(e) => update("reserve_price", parseFloat(e.target.value))} />
          {errors.reserve_price && <p className="mt-1 font-body text-xs text-auction-live">{errors.reserve_price}</p>}
        </div>
      </div>

      {/* Live timer */}
      <div>
        <label className={labelCls} htmlFor="lot-endtime">Live End At (local time)</label>
        <input id="lot-endtime" type="datetime-local" className={inputCls} value={form.live_end_at} onChange={(e) => update("live_end_at", e.target.value)} />
        <p className="mt-1 font-body text-xs text-platinum-500">Required when status is LIVE.</p>
      </div>

      {/* YouTube */}
      <div>
        <label className={labelCls} htmlFor="lot-yt">YouTube Video ID</label>
        <input id="lot-yt" className={inputCls} value={form.youtube_video_id} onChange={(e) => update("youtube_video_id", e.target.value)} placeholder="e.g. dQw4w9WgXcQ" />
        <p className="mt-1 font-body text-xs text-platinum-500">The 11-char ID from the YouTube Live URL.</p>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 border-t border-obsidian-700 pt-5">
        <button type="button" onClick={() => router.back()} className="rounded-xl border border-obsidian-600 px-4 py-2.5 font-body text-sm text-platinum-400 transition hover:text-platinum-200">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-gold-500 px-5 py-2.5 font-body text-sm font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {isPending ? "Saving…" : lotId ? "Save Changes" : "Create Lot"}
        </button>
      </div>
    </form>
  );
}
