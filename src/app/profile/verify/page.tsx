"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Step = "intro" | "identity" | "payment" | "submitted";

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity fields
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmitKyc = async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: fullName,
        kyc_status: "pending",
        kyc_submitted_at: new Date().toISOString(),
        payment_method_on_file: true, // Simulated — Phase 2 will integrate Stripe
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("submitted");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      {/* Progress bar */}
      <div className="mb-8 flex gap-1.5">
        {(["intro", "identity", "payment", "submitted"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              ["intro", "identity", "payment", "submitted"].indexOf(step) >= i
                ? "bg-gold-500"
                : "bg-obsidian-700"
            }`}
          />
        ))}
      </div>

      {/* Step: Intro */}
      {step === "intro" && (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-platinum-200">Bidder Verification</h1>
          <p className="mb-6 font-body text-sm leading-relaxed text-platinum-500">
            To comply with international auction regulations and protect our community, all bidders must verify their identity before participating in live auctions. This process takes approximately 2 minutes.
          </p>

          <div className="mb-6 space-y-3 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5 text-left">
            {["Government-issued ID (passport or driver's license)", "Date of birth confirmation", "Payment method on file (for bid deposits)"].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-gold-500">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-body text-sm text-platinum-300">{item}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("identity")}
            className="w-full rounded-xl bg-gold-500 py-3.5 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400"
          >
            Begin Verification →
          </button>
        </div>
      )}

      {/* Step: Identity */}
      {step === "identity" && (
        <div>
          <h2 className="mb-1 font-display text-2xl font-bold text-platinum-200">Identity Details</h2>
          <p className="mb-6 font-body text-sm text-platinum-500">Enter your details exactly as they appear on your government ID.</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">Full Legal Name</label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As shown on your passport/ID"
                className="w-full rounded-xl border border-obsidian-700 bg-obsidian-900 px-4 py-3 font-body text-sm text-platinum-200 placeholder:text-platinum-500 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dob" className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">Date of Birth</label>
              <input
                id="dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-obsidian-700 bg-obsidian-900 px-4 py-3 font-body text-sm text-platinum-200 [color-scheme:dark] focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">Country of Residence</label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-obsidian-700 bg-obsidian-900 px-4 py-3 font-body text-sm text-platinum-200 focus:border-gold-500 focus:outline-none"
              >
                <option value="">Select country...</option>
                {["Indonesia", "United States", "United Kingdom", "Singapore", "Malaysia", "Australia", "Japan", "Other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep("intro")}
              className="flex-1 rounded-xl border border-obsidian-700 py-3 font-body text-sm text-platinum-500 transition hover:border-gold-600/30"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep("payment")}
              disabled={!fullName || !dateOfBirth || !country}
              className="flex-1 rounded-xl bg-gold-500 py-3 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step: Payment */}
      {step === "payment" && (
        <div>
          <h2 className="mb-1 font-display text-2xl font-bold text-platinum-200">Add Payment Method</h2>
          <p className="mb-6 font-body text-sm text-platinum-500">A payment method is required to secure your bids. No charges will be made until you win a lot.</p>

          <div className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-10 rounded bg-[#1A1F71]" />
              <div className="h-6 w-10 rounded bg-[#EB001B]" style={{ background: "linear-gradient(90deg, #EB001B 50%, #F79E1B 50%)" }} />
              <span className="ml-1 font-body text-xs text-platinum-500">Visa, Mastercard accepted</span>
            </div>

            {/* Simulated card input — Phase 2 will use Stripe Elements */}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">Card Number</label>
                <input disabled placeholder="•••• •••• •••• ••••" className="w-full cursor-not-allowed rounded-xl border border-obsidian-700 bg-obsidian-900/50 px-4 py-3 font-body text-sm text-platinum-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">Expiry</label>
                  <input disabled placeholder="MM / YY" className="w-full cursor-not-allowed rounded-xl border border-obsidian-700 bg-obsidian-900/50 px-4 py-3 font-body text-sm text-platinum-500" />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-medium uppercase tracking-widest text-platinum-500">CVC</label>
                  <input disabled placeholder="•••" className="w-full cursor-not-allowed rounded-xl border border-obsidian-700 bg-obsidian-900/50 px-4 py-3 font-body text-sm text-platinum-500" />
                </div>
              </div>
            </div>

            <p className="mt-3 font-body text-[10px] text-platinum-500">
              ⚠️ Stripe payment integration coming in Phase 2. Click &quot;Simulate &amp; Submit&quot; to mark as complete for now.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-auction-live/10 px-3 py-2 font-body text-sm text-auction-live">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("identity")}
              className="flex-1 rounded-xl border border-obsidian-700 py-3 font-body text-sm text-platinum-500 transition hover:border-gold-600/30"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmitKyc}
              disabled={loading}
              className="flex-1 rounded-xl bg-gold-500 py-3 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Simulate & Submit →"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Submitted */}
      {step === "submitted" && (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-auction-pending/10 text-auction-pending">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-3 font-display text-3xl font-bold text-platinum-200">Verification Submitted</h2>
          <p className="mb-6 font-body text-sm leading-relaxed text-platinum-500">
            Your verification is under review. You will be notified within 1–2 business days. Until then, you can browse lots and place pre-bids.
          </p>
          <a
            href="/"
            className="inline-block rounded-xl bg-gold-500 px-6 py-3 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400"
          >
            Browse Lots →
          </a>
        </div>
      )}
    </div>
  );
}
