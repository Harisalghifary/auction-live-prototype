"use client";

import { useState, useTransition } from "react";

interface BankTransferFormProps {
  orderId: string;
  existingReference: string | null;
  existingNotes: string | null;
  isSubmitted: boolean;
}

export function BankTransferForm({
  orderId,
  existingReference,
  existingNotes,
  isSubmitted,
}: BankTransferFormProps) {
  const [isPending, startTransition] = useTransition();
  const [reference, setReference] = useState(existingReference ?? "");
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [submitted, setSubmitted] = useState(isSubmitted);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) { setError("Please enter your bank transfer reference."); return; }
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_reference: reference.trim(), payment_notes: notes.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    });
  };

  const inputCls = "w-full rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2.5 font-body text-sm text-platinum-200 focus:border-gold-500 focus:outline-none";

  if (submitted) {
    return (
      <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
        <p className="font-body text-sm font-semibold text-green-400">✓ Payment details submitted</p>
        <p className="mt-1 font-body text-xs text-platinum-500">
          Reference: <span className="font-mono text-platinum-200">{reference}</span>
        </p>
        <p className="mt-1 font-body text-xs text-platinum-500">
          We&apos;re confirming your payment. You&apos;ll see an update here once verified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
      <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
        Confirm Your Transfer
      </h2>

      {error && (
        <div className="mb-3 rounded-xl border border-auction-live/30 bg-auction-live/10 p-3 font-body text-xs text-auction-live">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-widest text-platinum-500" htmlFor="bank-ref">
            Bank Transfer Reference / Receipt No. *
          </label>
          <input
            id="bank-ref"
            className={inputCls}
            placeholder="e.g. TRF20260220123456"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-widets text-platinum-500" htmlFor="payment-notes">
            Additional Notes (optional)
          </label>
          <textarea
            id="payment-notes"
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="e.g. Transferred on 20 Feb from BCA mobile..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gold-500 py-3 font-body text-sm font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit Payment Details"}
        </button>
      </div>
    </form>
  );
}
