import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { KycApprovalRow } from "./KycApprovalRow";

export default async function AdminKycPage() {
  const supabase = await createSupabaseServerClient();

  const { data: pending } = await supabase
    .from("profiles")
    .select("id, username, kyc_status, is_verified_bidder, created_at")
    .eq("kyc_status", "pending")
    .order("created_at", { ascending: true });

  const { data: recent } = await supabase
    .from("profiles")
    .select("id, username, kyc_status, is_verified_bidder, created_at")
    .in("kyc_status", ["approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-platinum-200">KYC Queue</h1>

      {/* Pending */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-body text-sm font-semibold uppercase tracking-widest text-platinum-500">Pending Review</h2>
          {(pending?.length ?? 0) > 0 && (
            <span className="rounded-full bg-auction-pending/20 px-2 py-0.5 font-body text-xs font-bold text-auction-pending">
              {pending!.length}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-obsidian-700 bg-obsidian-800">
          {pending?.length ? (
            <div className="divide-y divide-obsidian-700">
              {pending.map((profile) => (
                <KycApprovalRow key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center font-body text-sm text-platinum-500">
              No pending KYC submissions. ✓
            </p>
          )}
        </div>
      </div>

      {/* Recent decisions */}
      <div>
        <h2 className="mb-3 font-body text-sm font-semibold uppercase tracking-widest text-platinum-500">Recent Decisions</h2>
        <div className="overflow-hidden rounded-2xl border border-obsidian-700 bg-obsidian-800">
          {recent?.length ? (
            <div className="divide-y divide-obsidian-700">
              {recent.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-body text-sm text-platinum-200">{profile.username ?? "Anonymous"}</p>
                    <p className="font-body text-xs text-platinum-500">{profile.id.slice(0, 8)}…</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${
                    profile.kyc_status === "approved" ? "bg-green-500/20 text-green-400" : "bg-auction-live/20 text-auction-live"
                  }`}>
                    {profile.kyc_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center font-body text-sm text-platinum-500">No decisions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
