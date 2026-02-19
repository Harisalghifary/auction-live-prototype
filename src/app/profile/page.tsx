import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const kycStatus: string = profile?.kyc_status ?? "unverified";
  const isVerified: boolean = profile?.is_verified_bidder ?? false;

  const kycConfig: Record<string, { label: string; color: string; description: string }> = {
    unverified: {
      label: "Not Verified",
      color: "text-platinum-500 border-obsidian-700 bg-obsidian-900",
      description: "You must verify your identity to bid in live auctions.",
    },
    pending: {
      label: "Verification Pending",
      color: "text-auction-pending border-auction-pending/30 bg-auction-pending/10",
      description: "Your verification is under review. This typically takes 1–2 business days.",
    },
    approved: {
      label: "Verified Bidder ✓",
      color: "text-green-400 border-green-600/30 bg-green-600/10",
      description: "You are fully verified and can bid in all live auctions.",
    },
    rejected: {
      label: "Verification Rejected",
      color: "text-auction-live border-auction-live/30 bg-auction-live/10",
      description: "Your verification was unsuccessful. Please resubmit.",
    },
  };

  const kyc = kycConfig[kycStatus] ?? kycConfig.unverified;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-bold text-platinum-200">My Account</h1>

      {/* Account card */}
      <div className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
          Account Details
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/20 font-display text-2xl font-bold text-gold-400">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-body text-base font-medium text-platinum-200">
              {profile?.display_name ?? user.email}
            </p>
            <p className="font-body text-sm text-platinum-500">{user.email}</p>
            <p className="font-body text-xs text-platinum-500">
              Member since {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>

      {/* KYC Status card */}
      <div className="mb-6 rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
          Bidder Verification (KYC)
        </h2>

        <div className={`mb-4 inline-flex rounded-full border px-3 py-1 font-body text-sm font-semibold ${kyc.color}`}>
          {kyc.label}
        </div>

        <p className="mb-4 font-body text-sm text-platinum-500">{kyc.description}</p>

        {(kycStatus === "unverified" || kycStatus === "rejected") && (
          <a
            href="/profile/verify"
            className="inline-block rounded-xl bg-gold-500 px-5 py-2.5 font-body font-semibold text-obsidian-950 transition hover:bg-gold-400"
          >
            {kycStatus === "rejected" ? "Resubmit Verification" : "Start Verification"}
          </a>
        )}
      </div>

      {/* Bidding stats */}
      {isVerified && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5 text-center">
            <p className="font-display text-3xl font-bold text-gold-400">—</p>
            <p className="font-body text-xs uppercase tracking-widest text-platinum-500">Lots Won</p>
          </div>
          <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-5 text-center">
            <p className="font-display text-3xl font-bold text-gold-400">—</p>
            <p className="font-body text-xs uppercase tracking-widest text-platinum-500">Active Bids</p>
          </div>
        </div>
      )}
    </div>
  );
}
